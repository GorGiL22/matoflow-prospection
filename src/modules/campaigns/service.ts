import { generatePersonalizedCampaignEmail } from "@/modules/campaigns/email-personalizer";
import { buildGenericCampaignEmail } from "@/modules/campaigns/generic-template";
import {
  buildCampaignReportCsv,
  buildCampaignReportFilename,
  buildCampaignReportSummary,
} from "@/modules/campaigns/report";
import { campaignRepository } from "@/modules/campaigns/repository";
import { buildSendSchedule } from "@/modules/campaigns/scheduler";
import { processCampaignSendQueue } from "@/modules/campaigns/sender";
import type {
  CampaignDashboardStats,
  CampaignEmail,
  CampaignReport,
  EmailCampaign,
} from "@/types/campaign";

export class CampaignService {
  listCampaigns(): Promise<EmailCampaign[]> {
    return campaignRepository.listCampaigns();
  }

  getCampaign(id: string): Promise<EmailCampaign | null> {
    return campaignRepository.getCampaign(id);
  }

  async getCampaignDetail(id: string) {
    const [campaign, emails, stats] = await Promise.all([
      campaignRepository.getCampaign(id),
      campaignRepository.listCampaignEmails(id),
      campaignRepository.getDashboardStats(id),
    ]);

    if (!campaign) return null;

    const report = buildCampaignReportSummary(campaign, emails, stats);

    return { campaign, emails, stats, report };
  }

  async exportCampaignReportCsv(campaignId: string): Promise<{
    content: string;
    filename: string;
    rowCount: number;
  }> {
    const [campaign, emails, stats] = await Promise.all([
      campaignRepository.getCampaign(campaignId),
      campaignRepository.listCampaignEmails(campaignId),
      campaignRepository.getDashboardStats(campaignId),
    ]);

    if (!campaign) throw new Error("Campagne introuvable");

    return {
      content: buildCampaignReportCsv(campaign, emails, stats),
      filename: buildCampaignReportFilename(campaign),
      rowCount: emails.length,
    };
  }

  getCampaignReport(
    campaign: EmailCampaign,
    emails: CampaignEmail[],
    stats: CampaignDashboardStats
  ): CampaignReport {
    return buildCampaignReportSummary(campaign, emails, stats);
  }

  listEligibleProspectsForCampaign() {
    return campaignRepository.listEligibleProspectsForCampaign();
  }

  async createCampaign(input: {
    nom: string;
    dailyLimit: number;
    minDelayMinutes: number;
    maxDelayMinutes: number;
    minScore?: number;
    limit?: number;
    prospectIds?: string[];
    contentMode?: "ai" | "generic";
    genericSubjectTemplate?: string;
    genericBodyTemplate?: string;
  }): Promise<{
    campaign: EmailCampaign;
    prospectsAdded: number;
    prospectsSkipped: number;
  }> {
    const {
      nom,
      dailyLimit,
      minDelayMinutes,
      maxDelayMinutes,
      minScore,
      limit,
      prospectIds,
    } = input;

    const campaign = await campaignRepository.createCampaign({
      nom,
      dailyLimit,
      minDelayMinutes,
      maxDelayMinutes,
      contentMode: input.contentMode,
      genericSubjectTemplate: input.genericSubjectTemplate,
      genericBodyTemplate: input.genericBodyTemplate,
    });

    if (prospectIds && prospectIds.length > 0) {
      const { added, skipped } = await campaignRepository.addProspectsByIds(
        campaign.id,
        prospectIds
      );
      return {
        campaign,
        prospectsAdded: added,
        prospectsSkipped: skipped,
      };
    }

    const { added, skippedAlreadyContacted } =
      await campaignRepository.addProspectsByFilter(campaign.id, {
        minScore,
        requireEmail: true,
        limit,
      });
    return {
      campaign,
      prospectsAdded: added,
      prospectsSkipped: skippedAlreadyContacted,
    };
  }

  async generateEmailsBatch(
    campaignId: string,
    batchSize = 5
  ): Promise<{ generated: number; remaining: number }> {
    const campaign = await campaignRepository.getCampaign(campaignId);
    if (!campaign) throw new Error("Campagne introuvable");

    const isGeneric = campaign.contentMode === "generic";
    const effectiveBatchSize = isGeneric ? 500 : batchSize;

    const drafts = await campaignRepository.listDraftEmailsWithoutContent(
      campaignId,
      effectiveBatchSize
    );

    let generated = 0;
    for (const draft of drafts) {
      const prospect = await campaignRepository.getProspectForGeneration(
        draft.prospectId
      );
      if (!prospect?.email) continue;

      const content = isGeneric
        ? buildGenericCampaignEmail(
            prospect,
            campaign.genericSubjectTemplate,
            campaign.genericBodyTemplate
          )
        : await generatePersonalizedCampaignEmail(prospect);

      await campaignRepository.saveGeneratedEmail(draft.id, content);
      generated += 1;
    }

    const remainingList =
      await campaignRepository.listDraftEmailsWithoutContent(campaignId, 1000);

    return { generated, remaining: remainingList.length };
  }

  updateCampaignTemplates(
    campaignId: string,
    input: { genericSubjectTemplate: string; genericBodyTemplate: string }
  ) {
    return campaignRepository.updateCampaignTemplates(campaignId, input);
  }

  updateCampaignEmailContent(
    emailId: string,
    input: { subject: string; body: string }
  ) {
    return campaignRepository.updateCampaignEmailContent(emailId, input);
  }

  async prepareAndStart(campaignId: string): Promise<EmailCampaign> {
    const campaign = await campaignRepository.getCampaign(campaignId);
    if (!campaign) throw new Error("Campagne introuvable");

    const emails = await campaignRepository.listCampaignEmails(campaignId);
    const ready = emails.filter((e) => e.statut === "draft" && e.subject);

    if (ready.length === 0) {
      throw new Error("Aucun email généré à planifier");
    }

    const isTestBatch = ready.length <= 5;
    const slots = buildSendSchedule({
      emailIds: ready.map((e) => e.id),
      dailyLimit: campaign.dailyLimit,
      minDelayMinutes: campaign.minDelayMinutes,
      maxDelayMinutes: campaign.maxDelayMinutes,
      ignoreBusinessHours: isTestBatch,
    });

    await campaignRepository.scheduleDraftEmails(campaignId, slots);
    const updated = await campaignRepository.updateCampaignStatus(campaignId, "active");

    if (isTestBatch) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const result = await processCampaignSendQueue();
        if (result.processed) break;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    return updated;
  }

  pauseCampaign(campaignId: string): Promise<EmailCampaign> {
    return campaignRepository.updateCampaignStatus(campaignId, "paused");
  }

  resumeCampaign(campaignId: string): Promise<EmailCampaign> {
    return campaignRepository.updateCampaignStatus(campaignId, "active");
  }

  processQueue() {
    return processCampaignSendQueue();
  }

  getStats(campaignId: string): Promise<CampaignDashboardStats> {
    return campaignRepository.getDashboardStats(campaignId);
  }

  listEmails(campaignId: string): Promise<CampaignEmail[]> {
    return campaignRepository.listCampaignEmails(campaignId);
  }

  markReplied(emailId: string) {
    return campaignRepository.markEmailReplied(emailId);
  }

  trackOpen(emailId: string) {
    return campaignRepository.markEmailOpened(emailId);
  }

  resetCampaignForRetest(campaignId: string) {
    return campaignRepository.resetCampaignForRetest(campaignId);
  }

  unblockProspectForCampaignRetry(prospectId: string) {
    return campaignRepository.unblockProspectForCampaignRetry(prospectId);
  }

  async sendTestEmail(campaignId: string, toEmail: string) {
    const trimmed = toEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      throw new Error("Adresse email de test invalide.");
    }

    const emails = await campaignRepository.listCampaignEmails(campaignId);
    const sample = emails.find((email) => email.subject && email.body);
    if (!sample?.subject || !sample.body) {
      throw new Error("Générez d'abord au moins un email avant d'envoyer un test.");
    }

    const { sendCampaignTestEmail } = await import("@/modules/campaigns/sender");
    await sendCampaignTestEmail({
      to: trimmed,
      subject: sample.subject,
      body: sample.body,
    });

    return { to: trimmed, subject: sample.subject };
  }
}

export const campaignService = new CampaignService();

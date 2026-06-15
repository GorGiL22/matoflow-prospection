import { prisma } from "@/lib/prisma";
import {
  toCampaignContentMode,
  toCampaignEmailStatus,
  toEmailCampaignStatus,
  toPrismaCampaignContentMode,
  toPrismaCampaignEmailStatus,
  toPrismaEmailCampaignStatus,
} from "@/lib/mappers/campaign";
import { toProspect, toProspectStatus } from "@/lib/mappers/prospect";
import type {
  CampaignContentMode,
  CampaignDashboardStats,
  CampaignEmail,
  CampaignEmailDetail,
  CampaignEmailStatus,
  EmailCampaign,
  EmailCampaignStatus,
  PersonalizedCampaignEmail,
} from "@/types/campaign";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const PROSPECT_STATUSES_EXCLUDED_FROM_CAMPAIGN = new Set([
  "CONTACTE",
  "RELANCE",
  "INTERESSE",
  "CHAUD",
  "RDV",
  "CLIENT",
  "REFUSE",
]);

const PROSPECT_STATUSES_PROTECTED_FROM_DOWNGRADE = new Set([
  "INTERESSE",
  "CHAUD",
  "RDV",
  "CLIENT",
  "REFUSE",
]);

function toEmailCampaign(record: {
  id: string;
  nom: string;
  statut: Parameters<typeof toEmailCampaignStatus>[0];
  contentMode: Parameters<typeof toCampaignContentMode>[0];
  genericSubjectTemplate: string | null;
  genericBodyTemplate: string | null;
  dailyLimit: number;
  minDelayMinutes: number;
  maxDelayMinutes: number;
  sentTodayCount: number;
  sentTodayDate: string | null;
  lastSentAt: Date | null;
  dateCreation: Date;
  dateModification: Date;
}): EmailCampaign {
  return {
    id: record.id,
    nom: record.nom,
    statut: toEmailCampaignStatus(record.statut),
    contentMode: toCampaignContentMode(record.contentMode),
    genericSubjectTemplate: record.genericSubjectTemplate,
    genericBodyTemplate: record.genericBodyTemplate,
    dailyLimit: record.dailyLimit,
    minDelayMinutes: record.minDelayMinutes,
    maxDelayMinutes: record.maxDelayMinutes,
    sentTodayCount: record.sentTodayCount,
    sentTodayDate: record.sentTodayDate,
    lastSentAt: record.lastSentAt?.toISOString() ?? null,
    dateCreation: record.dateCreation.toISOString(),
    dateModification: record.dateModification.toISOString(),
  };
}

function toCampaignEmail(record: {
  id: string;
  campaignId: string;
  prospectId: string;
  subject: string | null;
  body: string | null;
  personalizationHook: string | null;
  analysisSummary: string | null;
  statut: Parameters<typeof toCampaignEmailStatus>[0];
  scheduledAt: Date | null;
  sentAt: Date | null;
  openedAt: Date | null;
  repliedAt: Date | null;
  errorMessage: string | null;
  dateCreation: Date;
  dateModification: Date;
  prospect?: {
    id: string;
    nomEntreprise: string;
    email: string | null;
    ville: string | null;
    scoreIA: number | null;
    statut: string;
    siteWeb?: string | null;
  };
}): CampaignEmail {
  return {
    id: record.id,
    campaignId: record.campaignId,
    prospectId: record.prospectId,
    subject: record.subject,
    body: record.body,
    personalizationHook: record.personalizationHook,
    analysisSummary: record.analysisSummary,
    statut: toCampaignEmailStatus(record.statut),
    scheduledAt: record.scheduledAt?.toISOString() ?? null,
    sentAt: record.sentAt?.toISOString() ?? null,
    openedAt: record.openedAt?.toISOString() ?? null,
    repliedAt: record.repliedAt?.toISOString() ?? null,
    errorMessage: record.errorMessage,
    dateCreation: record.dateCreation.toISOString(),
    dateModification: record.dateModification.toISOString(),
    ...(record.prospect
      ? {
          prospect: {
            id: record.prospect.id,
            nomEntreprise: record.prospect.nomEntreprise,
            email: record.prospect.email,
            ville: record.prospect.ville,
            scoreIA: record.prospect.scoreIA,
            statut: record.prospect.statut.toLowerCase(),
          },
        }
      : {}),
  };
}

export class CampaignRepository {
  async listCampaigns(): Promise<EmailCampaign[]> {
    const records = await prisma.emailCampaign.findMany({
      orderBy: { dateCreation: "desc" },
    });
    return records.map(toEmailCampaign);
  }

  async getCampaign(id: string): Promise<EmailCampaign | null> {
    const record = await prisma.emailCampaign.findUnique({ where: { id } });
    return record ? toEmailCampaign(record) : null;
  }

  async createCampaign(input: {
    nom: string;
    dailyLimit: number;
    minDelayMinutes: number;
    maxDelayMinutes: number;
    contentMode?: CampaignContentMode;
    genericSubjectTemplate?: string;
    genericBodyTemplate?: string;
  }): Promise<EmailCampaign> {
    const record = await prisma.emailCampaign.create({
      data: {
        nom: input.nom,
        dailyLimit: input.dailyLimit,
        minDelayMinutes: input.minDelayMinutes,
        maxDelayMinutes: input.maxDelayMinutes,
        ...(input.contentMode && {
          contentMode: toPrismaCampaignContentMode(input.contentMode),
        }),
        ...(input.genericSubjectTemplate && {
          genericSubjectTemplate: input.genericSubjectTemplate,
        }),
        ...(input.genericBodyTemplate && {
          genericBodyTemplate: input.genericBodyTemplate,
        }),
      },
    });
    return toEmailCampaign(record);
  }

  async updateCampaignTemplates(
    campaignId: string,
    input: {
      genericSubjectTemplate: string;
      genericBodyTemplate: string;
    }
  ): Promise<EmailCampaign> {
    const record = await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        genericSubjectTemplate: input.genericSubjectTemplate,
        genericBodyTemplate: input.genericBodyTemplate,
      },
    });
    return toEmailCampaign(record);
  }

  async updateCampaignEmailContent(
    emailId: string,
    input: { subject: string; body: string }
  ): Promise<void> {
    const email = await prisma.campaignEmail.findUnique({ where: { id: emailId } });
    if (!email) throw new Error("Email introuvable");
    if (email.statut !== "DRAFT") {
      throw new Error("Seuls les emails en brouillon peuvent être modifiés");
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: email.campaignId },
    });
    if (!campaign || campaign.statut !== "DRAFT") {
      throw new Error("La campagne n'est plus modifiable");
    }

    await prisma.campaignEmail.update({
      where: { id: emailId },
      data: {
        subject: input.subject.trim(),
        body: input.body.trim(),
      },
    });
  }

  async updateCampaignStatus(
    id: string,
    statut: EmailCampaignStatus
  ): Promise<EmailCampaign> {
    const record = await prisma.emailCampaign.update({
      where: { id },
      data: { statut: toPrismaEmailCampaignStatus(statut) },
    });
    return toEmailCampaign(record);
  }

  async addProspectsByFilter(
    campaignId: string,
    filters: {
      minScore?: number;
      requireEmail?: boolean;
      limit?: number;
    }
  ): Promise<{ added: number; skippedAlreadyContacted: number }> {
    const alreadyTargeted = await prisma.campaignEmail.findMany({
      where: {
        OR: [
          { statut: { in: ["SENT", "OPENED", "REPLIED", "SCHEDULED"] } },
          { statut: "DRAFT", campaignId: { not: campaignId } },
        ],
      },
      select: { prospectId: true },
    });
    const excludedIds = new Set(alreadyTargeted.map((row) => row.prospectId));

    const skippedAlreadyContacted = await prisma.prospect.count({
      where: {
        ...(filters.minScore !== undefined
          ? { scoreIA: { gte: filters.minScore } }
          : {}),
        ...(filters.requireEmail !== false
          ? { email: { not: null }, emailNormalise: { not: null } }
          : {}),
        OR: [
          { statut: { not: "NOUVEAU" } },
          { id: { in: [...excludedIds] } },
        ],
      },
    });

    const candidates = await prisma.prospect.findMany({
      where: {
        ...(filters.minScore !== undefined
          ? { scoreIA: { gte: filters.minScore } }
          : {}),
        ...(filters.requireEmail !== false
          ? { email: { not: null }, emailNormalise: { not: null } }
          : {}),
        statut: "NOUVEAU",
        id: { notIn: [...excludedIds] },
      },
      take: (filters.limit ?? 200) + excludedIds.size,
      orderBy: { scoreIA: "desc" },
    });

    let added = 0;

    for (const prospect of candidates) {
      if (added >= (filters.limit ?? 200)) break;
      if (!prospect.email?.trim()) continue;

      try {
        await prisma.campaignEmail.create({
          data: { campaignId, prospectId: prospect.id },
        });
        added += 1;
      } catch {
        // Doublon campaignId+prospectId ignoré
      }
    }

    return { added, skippedAlreadyContacted };
  }

  private async getExcludedProspectIds(): Promise<Set<string>> {
    const alreadyTargeted = await prisma.campaignEmail.findMany({
      where: {
        OR: [
          { statut: { in: ["SENT", "OPENED", "REPLIED", "SCHEDULED"] } },
          { statut: "DRAFT" },
        ],
      },
      select: { prospectId: true },
    });
    return new Set(alreadyTargeted.map((row) => row.prospectId));
  }

  private isProspectEligibleForCampaign(statut: string, excludedIds: Set<string>, prospectId: string) {
    if (excludedIds.has(prospectId)) {
      return {
        selectable: false,
        unavailableReason: "Déjà inclus dans une campagne ou email déjà envoyé",
      };
    }

    if (statut !== "NOUVEAU") {
      return {
        selectable: false,
        unavailableReason: "Déjà contacté — hors statut « À contacter »",
      };
    }

    return { selectable: true, unavailableReason: null };
  }

  async listEligibleProspectsForCampaign(): Promise<
    Array<{
      id: string;
      nomEntreprise: string;
      email: string;
      ville: string | null;
      scoreIA: number | null;
      statut: string;
      selectable: boolean;
      unavailableReason: string | null;
    }>
  > {
    const excludedIds = await this.getExcludedProspectIds();

    const records = await prisma.prospect.findMany({
      where: {
        email: { not: null },
        emailNormalise: { not: null },
      },
      orderBy: [{ scoreIA: "desc" }, { dateCreation: "desc" }],
      select: {
        id: true,
        nomEntreprise: true,
        email: true,
        ville: true,
        scoreIA: true,
        statut: true,
      },
    });

    return records
      .filter((record) => record.email?.trim())
      .map((record) => {
        const eligibility = this.isProspectEligibleForCampaign(
          record.statut,
          excludedIds,
          record.id
        );
        return {
          id: record.id,
          nomEntreprise: record.nomEntreprise,
          email: record.email!.trim(),
          ville: record.ville,
          scoreIA: record.scoreIA,
          statut: record.statut.toLowerCase(),
          selectable: eligibility.selectable,
          unavailableReason: eligibility.unavailableReason,
        };
      });
  }

  async addProspectsByIds(
    campaignId: string,
    prospectIds: string[]
  ): Promise<{ added: number; skipped: number }> {
    if (prospectIds.length === 0) {
      throw new Error("Sélectionnez au moins un prospect");
    }

    const excludedIds = await this.getExcludedProspectIds();
    const uniqueIds = [...new Set(prospectIds)];

    const prospects = await prisma.prospect.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, email: true, emailNormalise: true, statut: true },
    });

    let added = 0;
    let skipped = 0;

    for (const prospect of prospects) {
      if (!prospect.email?.trim() || !prospect.emailNormalise) {
        skipped += 1;
        continue;
      }
      if (excludedIds.has(prospect.id)) {
        skipped += 1;
        continue;
      }
      if (PROSPECT_STATUSES_EXCLUDED_FROM_CAMPAIGN.has(prospect.statut)) {
        skipped += 1;
        continue;
      }

      try {
        await prisma.campaignEmail.create({
          data: { campaignId, prospectId: prospect.id },
        });
        added += 1;
      } catch {
        skipped += 1;
      }
    }

    if (added === 0) {
      throw new Error(
        "Aucun prospect n'a pu être ajouté (email manquant ou déjà en campagne)"
      );
    }

    return { added, skipped };
  }

  async listCampaignEmails(campaignId: string): Promise<CampaignEmail[]> {
    const records = await prisma.campaignEmail.findMany({
      where: { campaignId },
      include: {
        prospect: {
          select: {
            id: true,
            nomEntreprise: true,
            email: true,
            ville: true,
            scoreIA: true,
            statut: true,
          },
        },
      },
      orderBy: { dateCreation: "asc" },
    });
    return records.map(toCampaignEmail);
  }

  async getCampaignEmail(id: string): Promise<CampaignEmailDetail | null> {
    const record = await prisma.campaignEmail.findUnique({
      where: { id },
      include: {
        prospect: {
          select: {
            id: true,
            nomEntreprise: true,
            email: true,
            ville: true,
            siteWeb: true,
            scoreIA: true,
            statut: true,
          },
        },
      },
    });
    if (!record) return null;
    return toCampaignEmail(record) as CampaignEmailDetail;
  }

  async saveGeneratedEmail(
    id: string,
    content: PersonalizedCampaignEmail
  ): Promise<void> {
    await prisma.campaignEmail.update({
      where: { id },
      data: {
        subject: content.subject,
        body: content.body,
        personalizationHook: content.personalizationHook,
        analysisSummary: content.analysisSummary,
        statut: "DRAFT",
      },
    });
  }

  async scheduleDraftEmails(
    campaignId: string,
    slots: Array<{ emailId: string; scheduledAt: Date }>
  ): Promise<void> {
    await prisma.$transaction(
      slots.map((slot) =>
        prisma.campaignEmail.update({
          where: { id: slot.emailId },
          data: {
            scheduledAt: slot.scheduledAt,
            statut: "SCHEDULED",
          },
        })
      )
    );
  }

  async resetDailyCounterIfNeeded(campaignId: string): Promise<void> {
    const key = todayKey();
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign || campaign.sentTodayDate === key) return;

    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { sentTodayCount: 0, sentTodayDate: key },
    });
  }

  async incrementSentToday(campaignId: string): Promise<void> {
    const key = todayKey();
    await this.resetDailyCounterIfNeeded(campaignId);
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        sentTodayCount: { increment: 1 },
        sentTodayDate: key,
        lastSentAt: new Date(),
      },
    });
  }

  async getNextScheduledEmail(campaignId: string) {
    return prisma.campaignEmail.findFirst({
      where: {
        campaignId,
        statut: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        prospect: true,
        campaign: true,
      },
    });
  }

  async markEmailSent(id: string): Promise<void> {
    const email = await prisma.campaignEmail.findUnique({
      where: { id },
      include: { prospect: true, campaign: true },
    });
    if (!email) return;

    const previousStatus = email.prospect.statut;
    const shouldMarkContacted = !PROSPECT_STATUSES_PROTECTED_FROM_DOWNGRADE.has(
      previousStatus
    );

    await prisma.$transaction([
      prisma.campaignEmail.update({
        where: { id },
        data: { statut: "SENT", sentAt: new Date() },
      }),
      ...(shouldMarkContacted
        ? [
            prisma.prospect.update({
              where: { id: email.prospectId },
              data: { statut: "CONTACTE" },
            }),
          ]
        : []),
      prisma.activite.create({
        data: {
          prospectId: email.prospectId,
          type: "campagne_email",
          description: `Email de campagne « ${email.campaign.nom} » envoyé`,
          metadata: JSON.stringify({
            campaignId: email.campaignId,
            emailId: id,
            subject: email.subject,
          }),
        },
      }),
      ...(shouldMarkContacted && previousStatus !== "CONTACTE"
        ? [
            prisma.activite.create({
              data: {
                prospectId: email.prospectId,
                type: "changement_statut",
                description: "Statut changé : contacte (email campagne)",
                metadata: JSON.stringify({
                  ancienStatut: toProspectStatus(previousStatus),
                  nouveauStatut: "contacte",
                  source: "campagne_email",
                }),
              },
            }),
          ]
        : []),
    ]);
  }

  async markEmailFailed(id: string, errorMessage: string): Promise<void> {
    await prisma.campaignEmail.update({
      where: { id },
      data: { statut: "FAILED", errorMessage },
    });
  }

  async markEmailOpened(id: string): Promise<void> {
    const record = await prisma.campaignEmail.findUnique({ where: { id } });
    if (!record || record.statut === "REPLIED") return;

    await prisma.campaignEmail.update({
      where: { id },
      data: {
        statut: record.statut === "SENT" ? "OPENED" : record.statut,
        openedAt: record.openedAt ?? new Date(),
      },
    });
  }

  async markEmailReplied(id: string): Promise<void> {
    await prisma.campaignEmail.update({
      where: { id },
      data: { statut: "REPLIED", repliedAt: new Date() },
    });
  }

  async updateEmailStatus(
    id: string,
    statut: CampaignEmailStatus
  ): Promise<void> {
    const data: Record<string, unknown> = {
      statut: toPrismaCampaignEmailStatus(statut),
    };
    if (statut === "replied") data.repliedAt = new Date();
    if (statut === "opened") data.openedAt = new Date();

    await prisma.campaignEmail.update({ where: { id }, data });
  }

  async getDashboardStats(campaignId: string): Promise<CampaignDashboardStats> {
    const emails = await prisma.campaignEmail.findMany({
      where: { campaignId },
      include: { prospect: { select: { statut: true } } },
    });

    const sentStatuses = new Set(["SENT", "OPENED", "REPLIED"]);
    const sent = emails.filter((e) => sentStatuses.has(e.statut));
    const opened = emails.filter(
      (e) => e.statut === "OPENED" || e.statut === "REPLIED"
    );
    const replied = emails.filter((e) => e.statut === "REPLIED");
    const interested = emails.filter((e) =>
      ["INTERESSE", "CHAUD", "RDV"].includes(e.prospect.statut)
    );
    const toFollowUp = emails.filter(
      (e) =>
        e.statut === "SENT" &&
        !e.openedAt &&
        e.sentAt &&
        Date.now() - e.sentAt.getTime() > 5 * 24 * 60 * 60 * 1000
    );

    const emailsSent = sent.length;

    return {
      emailsSent,
      openRate: emailsSent > 0 ? Math.round((opened.length / emailsSent) * 1000) / 10 : 0,
      replyRate: emailsSent > 0 ? Math.round((replied.length / emailsSent) * 1000) / 10 : 0,
      interested: interested.length,
      toFollowUp: toFollowUp.length,
      totalEmails: emails.length,
      scheduled: emails.filter((e) => e.statut === "SCHEDULED").length,
      failed: emails.filter((e) => e.statut === "FAILED").length,
    };
  }

  async countDraftEmails(campaignId: string): Promise<number> {
    return prisma.campaignEmail.count({
      where: { campaignId, statut: "DRAFT", subject: { not: null } },
    });
  }

  async listDraftEmailsWithoutContent(campaignId: string, limit = 10) {
    return prisma.campaignEmail.findMany({
      where: { campaignId, statut: "DRAFT", subject: null },
      include: { prospect: true },
      take: limit,
    });
  }

  async getProspectForGeneration(prospectId: string) {
    const record = await prisma.prospect.findUnique({ where: { id: prospectId } });
    return record ? toProspect(record) : null;
  }

  /**
   * Retire un prospect des campagnes et le remet « À contacter » pour un nouvel envoi test.
   */
  async unblockProspectForCampaignRetry(prospectId: string): Promise<void> {
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      select: { id: true, statut: true, email: true },
    });
    if (!prospect) throw new Error("Prospect introuvable");

    await prisma.$transaction([
      prisma.campaignEmail.deleteMany({ where: { prospectId } }),
      ...(prospect.statut === "CONTACTE" || prospect.statut === "RELANCE"
        ? [
            prisma.prospect.update({
              where: { id: prospectId },
              data: { statut: "NOUVEAU" },
            }),
            prisma.activite.create({
              data: {
                prospectId,
                type: "campagne_email",
                description: "Prospect débloqué pour retest campagne email",
                metadata: JSON.stringify({ email: prospect.email }),
              },
            }),
          ]
        : []),
    ]);
  }

  /**
   * Réinitialise une campagne (emails en brouillon) et débloque ses prospects.
   */
  async resetCampaignForRetest(campaignId: string): Promise<{ unblocked: number }> {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        emails: { select: { prospectId: true } },
      },
    });
    if (!campaign) throw new Error("Campagne introuvable");

    const prospectIds = [...new Set(campaign.emails.map((e) => e.prospectId))];

    await prisma.$transaction([
      prisma.campaignEmail.updateMany({
        where: { campaignId },
        data: {
          statut: "DRAFT",
          subject: null,
          body: null,
          personalizationHook: null,
          analysisSummary: null,
          scheduledAt: null,
          sentAt: null,
          openedAt: null,
          repliedAt: null,
          errorMessage: null,
        },
      }),
      prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          statut: "DRAFT",
          sentTodayCount: 0,
          sentTodayDate: null,
          lastSentAt: null,
        },
      }),
      prisma.prospect.updateMany({
        where: {
          id: { in: prospectIds },
          statut: { in: ["CONTACTE", "RELANCE"] },
        },
        data: { statut: "NOUVEAU" },
      }),
    ]);

    return { unblocked: prospectIds.length };
  }
}

export const campaignRepository = new CampaignRepository();

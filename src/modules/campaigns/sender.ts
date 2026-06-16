import { sendEmail } from "@/lib/email/send";
import { getCampaignTrackingBaseUrl } from "@/lib/campaign-tracking";
import { campaignRepository } from "@/modules/campaigns/repository";
import { canSendNow } from "@/modules/campaigns/scheduler";

function injectTrackingPixel(html: string, emailId: string): string {
  const baseUrl = getCampaignTrackingBaseUrl();
  if (!baseUrl) return html;

  const pixel = `<img src="${baseUrl}/api/campaigns/track/open/${emailId}" width="1" height="1" alt="" style="display:none" />`;
  return html + pixel;
}

function linkifyLine(line: string): string {
  const escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style="color:#059669;text-decoration:underline;">$1</a>'
  );
}

function textToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => `<p style="margin:0 0 12px 0;">${linkifyLine(line) || "&nbsp;"}</p>`)
    .join("");
}

export async function sendCampaignTestEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  await sendEmail({
    to: input.to,
    subject: `[TEST MatoFlow] ${input.subject}`,
    text: input.body,
    html: textToHtml(input.body),
  });
}

export async function processCampaignSendQueue(): Promise<{
  processed: boolean;
  campaignId?: string;
  emailId?: string;
  error?: string;
}> {
  const activeCampaigns = await campaignRepository.listCampaigns();
  const active = activeCampaigns.filter((c) => c.statut === "active");

  for (const campaign of active) {
    await campaignRepository.resetDailyCounterIfNeeded(campaign.id);

    const fresh = await campaignRepository.getCampaign(campaign.id);
    if (!fresh) continue;

    if (fresh.sentTodayCount >= fresh.dailyLimit) continue;

    const lastSent = fresh.lastSentAt ? new Date(fresh.lastSentAt) : null;
    if (
      !canSendNow(lastSent, fresh.minDelayMinutes, fresh.maxDelayMinutes)
    ) {
      continue;
    }

    const next = await campaignRepository.getNextScheduledEmail(campaign.id);
    if (!next?.subject || !next.body || !next.prospect.email) continue;

    try {
      const html = injectTrackingPixel(textToHtml(next.body), next.id);
      await sendEmail({
        to: next.prospect.email,
        subject: next.subject,
        text: next.body,
        html,
      });

      await campaignRepository.markEmailSent(next.id);
      await campaignRepository.incrementSentToday(campaign.id);

      return { processed: true, campaignId: campaign.id, emailId: next.id };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur d'envoi";
      await campaignRepository.markEmailFailed(next.id, message);
      return { processed: true, campaignId: campaign.id, emailId: next.id, error: message };
    }
  }

  for (const campaign of active) {
    await campaignRepository.maybeCompleteCampaign(campaign.id);
  }

  return { processed: false };
}

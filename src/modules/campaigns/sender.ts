import { sendEmail } from "@/lib/email/send";
import { getCampaignTrackingBaseUrl } from "@/lib/campaign-tracking";
import { getCampaignEmailTagName } from "@/modules/campaigns/bounce-handler";
import { campaignRepository } from "@/modules/campaigns/repository";
import { canSendNow } from "@/modules/campaigns/scheduler";
import { appendUnsubscribeFooter } from "@/modules/campaigns/unsubscribe";

let queueProcessing = false;

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
  const footer = `

---
[TEST] Le lien de désabonnement sera inclus dans les vrais envois.`;

  await sendEmail({
    to: input.to,
    subject: `[TEST MatoFlow] ${input.subject}`,
    text: `${input.body.trimEnd()}${footer}`,
    html: textToHtml(`${input.body.trimEnd()}${footer}`),
  });
}

export async function processCampaignSendQueue(): Promise<{
  processed: boolean;
  campaignId?: string;
  emailId?: string;
  error?: string;
}> {
  if (queueProcessing) {
    return { processed: false };
  }

  queueProcessing = true;
  try {
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

      const next = await campaignRepository.claimNextScheduledEmail(campaign.id);
      if (!next?.subject || !next.body || !next.prospect.email) continue;

      if (next.prospect.emailDesabonne) {
        await campaignRepository.markEmailFailed(
          next.id,
          "Prospect désabonné"
        );
        continue;
      }

      let resendId: string | undefined;
      try {
        const { text, htmlExtra } = appendUnsubscribeFooter(next.body, next.id);
        const html = injectTrackingPixel(
          `${textToHtml(next.body)}${htmlExtra}`,
          next.id
        );
        const sent = await sendEmail({
          to: next.prospect.email,
          subject: next.subject,
          text,
          html,
          tags: [{ name: getCampaignEmailTagName(), value: next.id }],
        });
        resendId = sent.id;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur d'envoi";
        await campaignRepository.markEmailFailed(next.id, message);
        return { processed: true, campaignId: campaign.id, emailId: next.id, error: message };
      }

      try {
        await campaignRepository.markEmailSent(next.id, resendId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur d'enregistrement";
        await campaignRepository.markEmailFailed(
          next.id,
          `Envoi Resend OK (${resendId ?? "?"}) mais enregistrement échoué : ${message}`
        );
        return { processed: true, campaignId: campaign.id, emailId: next.id, error: message };
      }

      await campaignRepository.incrementSentToday(campaign.id);

      return { processed: true, campaignId: campaign.id, emailId: next.id };
    }

    for (const campaign of active) {
      await campaignRepository.maybeCompleteCampaign(campaign.id);
    }

    return { processed: false };
  } finally {
    queueProcessing = false;
  }
}

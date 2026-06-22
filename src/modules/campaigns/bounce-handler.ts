import { BOUNCED_EMAILS_PHONE_LIST_NAME } from "@/config/constants";
import { campaignRepository } from "@/modules/campaigns/repository";
import { phoneListRepository } from "@/modules/phone-lists/repository";

const CAMPAIGN_EMAIL_TAG = "matoflow_campaign_email_id";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function extractCampaignEmailIdFromTags(
  tags?: Record<string, string> | Array<{ name: string; value: string }>
): string | null {
  if (!tags) return null;
  if (Array.isArray(tags)) {
    const match = tags.find((tag) => tag.name === CAMPAIGN_EMAIL_TAG);
    return match?.value ?? null;
  }
  return tags[CAMPAIGN_EMAIL_TAG] ?? null;
}

export async function handleCampaignEmailBounce(input: {
  resendEmailId?: string;
  toEmail: string;
  message: string;
  campaignEmailId?: string;
}): Promise<{
  handled: boolean;
  addedToPhoneList: boolean;
  phoneListId?: string;
  reason?: string;
}> {
  let campaignEmail = input.resendEmailId
    ? await campaignRepository.findCampaignEmailByResendId(input.resendEmailId)
    : null;

  if (!campaignEmail && input.campaignEmailId) {
    campaignEmail = await campaignRepository.findCampaignEmailById(
      input.campaignEmailId
    );
  }

  if (!campaignEmail) {
    campaignEmail = await campaignRepository.findLatestSentCampaignEmailByRecipient(
      input.toEmail
    );
  }

  if (!campaignEmail) {
    return { handled: false, addedToPhoneList: false, reason: "Email campagne introuvable" };
  }

  if (campaignEmail.statut === "BOUNCED") {
    return { handled: true, addedToPhoneList: false, reason: "Déjà traité" };
  }
  if (
    campaignEmail.statut === "FAILED" &&
    campaignEmail.errorMessage?.startsWith("BOUNCE:")
  ) {
    return { handled: true, addedToPhoneList: false, reason: "Déjà traité" };
  }

  await campaignRepository.markEmailBounced(campaignEmail.id, {
    message: input.message,
    resendEmailId: input.resendEmailId,
  });

  const phoneList = await phoneListRepository.getOrCreateByName(
    BOUNCED_EMAILS_PHONE_LIST_NAME
  );
  const addResult = await phoneListRepository.addProspectIfHasPhone(
    phoneList.id,
    campaignEmail.prospectId
  );

  return {
    handled: true,
    addedToPhoneList: addResult.added,
    phoneListId: phoneList.id,
    reason: addResult.reason,
  };
}

export function getCampaignEmailTagName(): string {
  return CAMPAIGN_EMAIL_TAG;
}

export function extractCampaignEmailIdFromResendTags(
  tags?: Record<string, string> | Array<{ name: string; value: string }>
): string | null {
  return extractCampaignEmailIdFromTags(tags);
}

export function normalizeRecipientEmail(value: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const match = raw.match(/<([^>]+)>/);
  return normalizeEmail(match?.[1] ?? raw);
}

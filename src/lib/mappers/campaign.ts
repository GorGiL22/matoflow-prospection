import type {
  CampaignContentMode as PrismaCampaignContentMode,
  CampaignEmailStatus as PrismaCampaignEmailStatus,
  EmailCampaignStatus as PrismaEmailCampaignStatus,
} from "@prisma/client";
import type {
  CampaignContentMode,
  CampaignEmailStatus,
  EmailCampaignStatus,
} from "@/types/campaign";

const CONTENT_MODE_TO_DOMAIN: Record<PrismaCampaignContentMode, CampaignContentMode> =
  {
    AI: "ai",
    GENERIC: "generic",
  };

const CONTENT_MODE_TO_PRISMA: Record<CampaignContentMode, PrismaCampaignContentMode> =
  {
    ai: "AI",
    generic: "GENERIC",
  };

export function toCampaignContentMode(
  mode: PrismaCampaignContentMode
): CampaignContentMode {
  return CONTENT_MODE_TO_DOMAIN[mode];
}

export function toPrismaCampaignContentMode(
  mode: CampaignContentMode
): PrismaCampaignContentMode {
  return CONTENT_MODE_TO_PRISMA[mode];
}

const CAMPAIGN_TO_DOMAIN: Record<PrismaEmailCampaignStatus, EmailCampaignStatus> =
  {
    DRAFT: "draft",
    ACTIVE: "active",
    PAUSED: "paused",
    COMPLETED: "completed",
  };

const CAMPAIGN_TO_PRISMA: Record<EmailCampaignStatus, PrismaEmailCampaignStatus> =
  {
    draft: "DRAFT",
    active: "ACTIVE",
    paused: "PAUSED",
    completed: "COMPLETED",
  };

const EMAIL_TO_DOMAIN: Record<PrismaCampaignEmailStatus, CampaignEmailStatus> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  SENDING: "sending",
  SENT: "sent",
  FAILED: "failed",
  OPENED: "opened",
  REPLIED: "replied",
};

const EMAIL_TO_PRISMA: Record<CampaignEmailStatus, PrismaCampaignEmailStatus> = {
  draft: "DRAFT",
  scheduled: "SCHEDULED",
  sending: "SENDING",
  sent: "SENT",
  failed: "FAILED",
  opened: "OPENED",
  replied: "REPLIED",
};

export function toEmailCampaignStatus(
  statut: PrismaEmailCampaignStatus
): EmailCampaignStatus {
  return CAMPAIGN_TO_DOMAIN[statut];
}

export function toPrismaEmailCampaignStatus(
  statut: EmailCampaignStatus
): PrismaEmailCampaignStatus {
  return CAMPAIGN_TO_PRISMA[statut];
}

export function toCampaignEmailStatus(
  statut: PrismaCampaignEmailStatus
): CampaignEmailStatus {
  return EMAIL_TO_DOMAIN[statut];
}

export function toPrismaCampaignEmailStatus(
  statut: CampaignEmailStatus
): PrismaCampaignEmailStatus {
  return EMAIL_TO_PRISMA[statut];
}

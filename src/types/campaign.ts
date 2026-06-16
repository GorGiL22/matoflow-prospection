export const EMAIL_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "paused",
  "completed",
] as const;

export type EmailCampaignStatus = (typeof EMAIL_CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_CONTENT_MODES = ["ai", "generic"] as const;
export type CampaignContentMode = (typeof CAMPAIGN_CONTENT_MODES)[number];

export const CAMPAIGN_EMAIL_STATUSES = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
  "opened",
  "replied",
] as const;

export type CampaignEmailStatus = (typeof CAMPAIGN_EMAIL_STATUSES)[number];

export interface EmailCampaign {
  id: string;
  nom: string;
  statut: EmailCampaignStatus;
  contentMode: CampaignContentMode;
  genericSubjectTemplate: string | null;
  genericBodyTemplate: string | null;
  dailyLimit: number;
  minDelayMinutes: number;
  maxDelayMinutes: number;
  sentTodayCount: number;
  sentTodayDate: string | null;
  lastSentAt: string | null;
  dateCreation: string;
  dateModification: string;
}

export interface CampaignEmail {
  id: string;
  campaignId: string;
  prospectId: string;
  subject: string | null;
  body: string | null;
  personalizationHook: string | null;
  analysisSummary: string | null;
  statut: CampaignEmailStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  openedAt: string | null;
  repliedAt: string | null;
  errorMessage: string | null;
  dateCreation: string;
  dateModification: string;
  prospect?: {
    id: string;
    nomEntreprise: string;
    email: string | null;
    ville: string | null;
    scoreIA: number | null;
    statut: string;
  };
}

export interface CampaignEmailDetail extends CampaignEmail {
  prospect: {
    id: string;
    nomEntreprise: string;
    email: string | null;
    ville: string | null;
    siteWeb: string | null;
    scoreIA: number | null;
    statut: string;
  };
}

export interface CampaignDashboardStats {
  emailsSent: number;
  openRate: number;
  replyRate: number;
  interested: number;
  toFollowUp: number;
  totalEmails: number;
  scheduled: number;
  failed: number;
}

export interface CampaignReport {
  campaignId: string;
  campaignName: string;
  status: EmailCampaignStatus;
  stats: CampaignDashboardStats;
  opened: number;
  replied: number;
  pendingDraft: number;
  firstSentAt: string | null;
  lastSentAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface PersonalizedCampaignEmail {
  subject: string;
  body: string;
  personalizationHook: string;
  analysisSummary: string;
}

export const CAMPAIGN_STATUS_LABELS: Record<EmailCampaignStatus, string> = {
  draft: "Brouillon",
  active: "En cours",
  paused: "En pause",
  completed: "Terminée",
};

export const CAMPAIGN_CONTENT_MODE_LABELS: Record<CampaignContentMode, string> = {
  ai: "Personnalisation IA",
  generic: "Message générique",
};

export const CAMPAIGN_EMAIL_STATUS_LABELS: Record<CampaignEmailStatus, string> = {
  draft: "Brouillon",
  scheduled: "Planifié",
  sending: "En cours d'envoi",
  sent: "Envoyé",
  failed: "Échec",
  opened: "Ouvert",
  replied: "Répondu",
};

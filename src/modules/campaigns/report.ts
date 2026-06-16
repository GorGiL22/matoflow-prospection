import type {
  CampaignDashboardStats,
  CampaignEmail,
  CampaignReport,
  EmailCampaign,
} from "@/types/campaign";
import { CAMPAIGN_EMAIL_STATUS_LABELS, CAMPAIGN_STATUS_LABELS } from "@/types/campaign";

function escapeCsv(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR");
}

export function buildCampaignReportSummary(
  campaign: EmailCampaign,
  emails: CampaignEmail[],
  stats: CampaignDashboardStats
): CampaignReport {
  const sentDates = emails
    .filter((email) => email.sentAt)
    .map((email) => new Date(email.sentAt!).getTime());

  const opened = emails.filter(
    (email) => email.statut === "opened" || email.statut === "replied"
  ).length;
  const replied = emails.filter((email) => email.statut === "replied").length;

  return {
    campaignId: campaign.id,
    campaignName: campaign.nom,
    status: campaign.statut,
    stats,
    opened,
    replied,
    pendingDraft: emails.filter((email) => email.statut === "draft").length,
    firstSentAt:
      sentDates.length > 0
        ? new Date(Math.min(...sentDates)).toISOString()
        : null,
    lastSentAt:
      sentDates.length > 0
        ? new Date(Math.max(...sentDates)).toISOString()
        : null,
    completedAt: campaign.statut === "completed" ? campaign.dateModification : null,
    createdAt: campaign.dateCreation,
  };
}

export function isCampaignQueueFinished(
  campaign: EmailCampaign,
  stats: CampaignDashboardStats,
  emails: CampaignEmail[]
): boolean {
  if (campaign.statut === "completed") return true;
  if (campaign.statut === "draft" || stats.scheduled > 0) return false;

  const processed = emails.filter((email) =>
    ["sent", "failed", "opened", "replied"].includes(email.statut)
  ).length;
  const readyDrafts = emails.filter(
    (email) => email.statut === "draft" && email.subject
  ).length;

  return processed > 0 && readyDrafts === 0;
}

export function buildCampaignReportFilename(campaign: EmailCampaign): string {
  const slug = campaign.nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `matoflow-campagne-${slug || campaign.id}-${date}.csv`;
}

export function buildCampaignReportCsv(
  campaign: EmailCampaign,
  emails: CampaignEmail[],
  stats: CampaignDashboardStats
): string {
  const report = buildCampaignReportSummary(campaign, emails, stats);

  const summaryRows = [
    ["Indicateur", "Valeur"],
    ["Campagne", report.campaignName],
    ["Statut", CAMPAIGN_STATUS_LABELS[report.status]],
    ["Créée le", formatCsvDate(report.createdAt)],
    ["Terminée le", formatCsvDate(report.completedAt)],
    ["Premier envoi", formatCsvDate(report.firstSentAt)],
    ["Dernier envoi", formatCsvDate(report.lastSentAt)],
    ["Prospects ciblés", String(report.stats.totalEmails)],
    ["Emails envoyés", String(report.stats.emailsSent)],
    ["Ouvertures", String(report.opened)],
    ["Taux d'ouverture", `${report.stats.openRate}%`],
    ["Réponses", String(report.replied)],
    ["Taux de réponse", `${report.stats.replyRate}%`],
    ["Échecs", String(report.stats.failed)],
    ["Intéressés", String(report.stats.interested)],
    ["À relancer", String(report.stats.toFollowUp)],
    ["Brouillons restants", String(report.pendingDraft)],
  ];

  const detailHeader = [
    "Entreprise",
    "Email",
    "Ville",
    "Statut email",
    "Statut prospect",
    "Objet",
    "Envoyé le",
    "Ouvert le",
    "Répondu le",
    "Erreur",
  ];

  const detailRows = emails.map((email) => [
    email.prospect?.nomEntreprise ?? "",
    email.prospect?.email ?? "",
    email.prospect?.ville ?? "",
    CAMPAIGN_EMAIL_STATUS_LABELS[email.statut],
    email.prospect?.statut ?? "",
    email.subject ?? "",
    formatCsvDate(email.sentAt),
    formatCsvDate(email.openedAt),
    formatCsvDate(email.repliedAt),
    email.errorMessage ?? "",
  ]);

  const lines = [
    ...summaryRows.map((row) => row.map(escapeCsv).join(",")),
    "",
    detailHeader.map(escapeCsv).join(","),
    ...detailRows.map((row) => row.map(escapeCsv).join(",")),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

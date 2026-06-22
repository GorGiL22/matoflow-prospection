/** Statuts encore en file d'envoi (requêtes Prisma sans BOUNCED pour compatibilité migrations). */
export const PENDING_CAMPAIGN_EMAIL_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "SENDING",
] as const;

export function isBouncedCampaignEmailRecord(input: {
  statut: string;
  errorMessage?: string | null;
}): boolean {
  return (
    input.statut === "BOUNCED" ||
    (input.statut === "FAILED" &&
      (input.errorMessage?.startsWith("BOUNCE:") ?? false))
  );
}

/**
 * URL publique de cette app Next.js (pixel de suivi d'ouverture des campagnes).
 *
 * Distinct de RESEND_FROM : le domaine vérifié Resend (ex. contact@matoflow.fr)
 * sert uniquement à l'envoi. Le pixel appelle /api/campaigns/track/open sur
 * l'URL où cette application est déployée (ex. https://matoflow.fr si l'app
 * y est hébergée, ou https://app.matoflow.fr).
 *
 * En local, laisser vide pour ne pas injecter de pixel (évite les alertes mail).
 */
export function getCampaignTrackingBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (!raw?.trim()) return null;

  try {
    return new URL(raw.trim()).origin;
  } catch {
    return null;
  }
}

export function isCampaignOpenTrackingEnabled(): boolean {
  return getCampaignTrackingBaseUrl() !== null;
}

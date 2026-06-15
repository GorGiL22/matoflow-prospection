import {
  CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS,
} from "@/config/constants";
import type { PersonalizedCampaignEmail } from "@/types/campaign";
import type { Prospect } from "@/types/prospect";

export function applyCampaignTemplate(
  template: string,
  prospect: Pick<Prospect, "nomEntreprise" | "ville">
): string {
  return template
    .replace(/\{nomEntreprise\}/g, prospect.nomEntreprise)
    .replace(/\{ville\}/g, prospect.ville?.trim() || "votre région");
}

export function buildGenericCampaignEmail(
  prospect: Prospect,
  subjectTemplate?: string | null,
  bodyTemplate?: string | null
): PersonalizedCampaignEmail {
  const subject = applyCampaignTemplate(
    subjectTemplate?.trim() || CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.subject,
    prospect
  );
  const body = applyCampaignTemplate(
    bodyTemplate?.trim() || CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.body,
    prospect
  );

  return {
    subject,
    body,
    personalizationHook: `Message pour ${prospect.nomEntreprise}`,
    analysisSummary: "Template générique (sans appel IA)",
  };
}

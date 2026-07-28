import { chatCompletion } from "@/lib/openai";
import { AI_CONFIG, MATOFLOW_VALUE_PROPS } from "@/config/constants";
import { partnerRepository } from "@/modules/partners/crm/repository";
import type { Partner, PartnerOutreachDraft } from "@/types/partner";
import {
  PARTNER_TYPE_LABELS,
  PARTNERSHIP_KIND_LABELS,
  scoreEtoilesLabel,
} from "@/types/partner";

export async function generatePartnerOutreach(
  partner: Partner
): Promise<{
  emailSubject: string;
  emailBody: string;
  linkedinMessage: string;
  arguments: string;
  questionsRdv: string;
  objections: string;
}> {
  const system = `Tu es un commercial partenariats pour MatoFlow (SaaS paysage).

Valeur produit :
${MATOFLOW_VALUE_PROPS.map((p) => `- ${p}`).join("\n")}

Génère une proposition de contact personnalisée. Réponds UNIQUEMENT en JSON :
{
  "emailSubject": "...",
  "emailBody": "...",
  "linkedinMessage": "max 300 car.",
  "arguments": "liste à puces des arguments",
  "questionsRdv": "3-5 questions pour le RDV",
  "objections": "objections probables + réponses courtes"
}
Signe les emails avec Mathis Magnard, Fondateur de MatoFlow.`;

  const user = `
Partenaire :
- ${partner.entreprise} (${PARTNER_TYPE_LABELS[partner.type]})
- Zone : ${partner.zone ?? "—"}
- Site : ${partner.siteWeb ?? "—"}
- Dirigeant : ${partner.nomDirigeant ?? "—"} (${partner.fonctionDirigeant ?? "—"})
- Score : ${scoreEtoilesLabel(partner.scoreEtoiles)}
- Partenariat recommandé : ${
    partner.partnershipKind
      ? PARTNERSHIP_KIND_LABELS[partner.partnershipKind]
      : "à définir"
  }
- Analyse : ${partner.analyseIA?.whyInteresting ?? partner.description ?? "—"}
- Bénéfices : ${partner.analyseIA?.mutualBenefits ?? "—"}
`.trim();

  const raw = await chatCompletion(system, user, {
    temperature: AI_CONFIG.contentTemperature,
    json: true,
  });

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    emailSubject:
      typeof parsed.emailSubject === "string"
        ? parsed.emailSubject
        : "Partenariat MatoFlow",
    emailBody:
      typeof parsed.emailBody === "string"
        ? parsed.emailBody
        : "Erreur de génération.",
    linkedinMessage:
      typeof parsed.linkedinMessage === "string"
        ? parsed.linkedinMessage
        : "Erreur de génération.",
    arguments:
      typeof parsed.arguments === "string" ? parsed.arguments : "",
    questionsRdv:
      typeof parsed.questionsRdv === "string" ? parsed.questionsRdv : "",
    objections:
      typeof parsed.objections === "string" ? parsed.objections : "",
  };
}

export async function generateAndSavePartnerOutreach(
  partnerId: string
): Promise<PartnerOutreachDraft> {
  const partner = await partnerRepository.getById(partnerId);
  if (!partner) throw new Error("Partenaire introuvable");
  const draft = await generatePartnerOutreach(partner);
  return partnerRepository.saveOutreachDraft(partnerId, draft);
}

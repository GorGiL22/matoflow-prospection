import { chatCompletion } from "@/lib/openai";
import { MATOFLOW_VALUE_PROPS } from "@/config/constants";
import { partnerRepository } from "@/modules/partners/crm/repository";
import {
  PARTNER_STATUS_LABELS,
  PARTNER_TYPE_LABELS,
  PARTNERSHIP_KIND_LABELS,
  scoreEtoilesLabel,
} from "@/types/partner";

export async function askPartnerPortfolioAgent(
  question: string
): Promise<string> {
  const partners = await partnerRepository.listForAgent(100);

  const summary = partners
    .map(
      (p) =>
        `- ${p.entreprise} | type=${PARTNER_TYPE_LABELS[p.type]} | statut=${PARTNER_STATUS_LABELS[p.statut]} | score=${scoreEtoilesLabel(p.scoreEtoiles)} | zone=${p.zone ?? "—"} | partenariat=${p.partnershipKind ? PARTNERSHIP_KIND_LABELS[p.partnershipKind] : "—"} | pourquoi=${p.analyseIA?.whyInteresting?.slice(0, 160) ?? p.description?.slice(0, 160) ?? "—"}`
    )
    .join("\n");

  const system = `Tu es l'assistant commercial partenariats de MatoFlow.

MatoFlow : SaaS pour entreprises du paysage.
${MATOFLOW_VALUE_PROPS.map((p) => `- ${p}`).join("\n")}

Réponds en français, de façon concrète et actionnable, en te basant UNIQUEMENT sur le portefeuille fourni.
Si tu compares à Common Gaia, raisonne sur le profil (réseau / offre adhérents / proximité métier paysage).
Si l'info manque, dis-le clairement.`;

  const user = `Portefeuille partenaires (${partners.length}) :
${summary || "(vide)"}

Question : ${question.trim()}`;

  return chatCompletion(system, user, {
    temperature: 0.4,
  });
}

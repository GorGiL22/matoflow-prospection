import { chatCompletion } from "@/lib/openai";
import { analyzeWebsite } from "@/modules/analysis/website-analyzer";
import {
  AI_CONFIG,
  CAMPAIGN_DEFAULTS,
  MATOFLOW_VALUE_PROPS,
  MATOFLOW_WEBSITE_URL,
} from "@/config/constants";
import type { PersonalizedCampaignEmail } from "@/types/campaign";
import type { Prospect } from "@/types/prospect";

const SYSTEM_PROMPT = `Tu es un commercial expert pour MatoFlow, logiciel SaaS pour entreprises du paysage en France.

MatoFlow aide à : ${MATOFLOW_VALUE_PROPS.join(" ; ")}.

Règles STRICTES pour l'email :
- Français naturel et professionnel, ton humain (pas robotique)
- Maximum ${CAMPAIGN_DEFAULTS.maxWords} mots pour le corps
- AU MOINS une phrase personnalisée prouvant que l'entreprise a été analysée (service, spécialité, ville, activité du site)
- INTERDIT : "j'espère que vous allez bien", "leader du marché", "solution innovante", majuscules agressives, urgence artificielle
- Objet : court, naturel, sans spam (pas de "OFFRE", "GRATUIT", points d'exclamation multiples)
- Proposer une démo MatoFlow de façon douce, sans pression
- Inclure OBLIGATOIREMENT le lien ${MATOFLOW_WEBSITE_URL} une fois dans le corps (naturellement, ex. « découvrir MatoFlow : ${MATOFLOW_WEBSITE_URL} »)
- Signer "Mathis — MatoFlow" (pas de placeholder)

Réponds UNIQUEMENT en JSON :
{
  "subject": "objet de l'email",
  "body": "corps en texte brut avec sauts de ligne",
  "personalizationHook": "la phrase ou élément précis utilisé pour personnaliser",
  "analysisSummary": "résumé en 1 phrase de ce qui a été analysé"
}`;

function buildAnalysisContext(
  prospect: Prospect,
  website: Awaited<ReturnType<typeof analyzeWebsite>>
): string {
  const parts = [
    `Entreprise : ${prospect.nomEntreprise}`,
    `Ville : ${prospect.ville ?? "non renseignée"}`,
    `Site : ${prospect.siteWeb ?? "aucun"}`,
    `Email : ${prospect.email ?? "aucun"}`,
    `Score IA MatoFlow : ${prospect.scoreIA ?? "non calculé"}/100`,
    `Description : ${prospect.description ?? "aucune"}`,
  ];

  if (prospect.detailsScoreIA?.services_detected?.length) {
    parts.push(
      `Services détectés (IA) : ${prospect.detailsScoreIA.services_detected.join(", ")}`
    );
  }

  if (prospect.detailsScoreIA?.reasoning) {
    parts.push(`Analyse IA existante : ${prospect.detailsScoreIA.reasoning}`);
  }

  if (website) {
    parts.push(
      `Titre site : ${website.title ?? "—"}`,
      `Meta : ${website.metaDescription ?? "—"}`,
      `Rubriques : ${website.headings.slice(0, 8).join(" | ") || "—"}`,
      `Extrait site : ${website.textContent.slice(0, 1200)}`
    );
  }

  return parts.join("\n");
}

function ensureMatoflowLink(body: string): string {
  if (/matoflow\.fr/i.test(body)) return body;
  return `${body.trim()}\n\nDécouvrir MatoFlow : ${MATOFLOW_WEBSITE_URL}`;
}

export async function generatePersonalizedCampaignEmail(
  prospect: Prospect
): Promise<PersonalizedCampaignEmail> {
  const website = await analyzeWebsite(prospect.siteWeb);
  const context = buildAnalysisContext(prospect, website);

  const response = await chatCompletion(
    SYSTEM_PROMPT,
    `Analyse ces informations et rédige un email de prospection unique pour cette entreprise :\n\n${context}`,
    { temperature: AI_CONFIG.contentTemperature, json: true }
  );

  try {
    const parsed = JSON.parse(response) as PersonalizedCampaignEmail;
    if (!parsed.subject || !parsed.body) {
      throw new Error("Réponse IA incomplète");
    }
    return {
      ...parsed,
      body: ensureMatoflowLink(parsed.body),
    };
  } catch {
    throw new Error("Impossible de générer l'email personnalisé");
  }
}

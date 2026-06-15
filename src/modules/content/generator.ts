import { chatCompletion } from "@/lib/openai";
import { AI_CONFIG, MATOFLOW_VALUE_PROPS } from "@/config/constants";
import type { GeneratedContent, Prospect } from "@/types/prospect";

const BASE_SYSTEM = `Tu es un commercial expert pour MatoFlow, logiciel SaaS pour les entreprises du paysage.

MatoFlow propose :
${MATOFLOW_VALUE_PROPS.map((p) => `- ${p}`).join("\n")}

Ton : chaleureux, direct, orienté bénéfices métier. Pas de jargon technique excessif.`;

function buildProspectContext(prospect: Prospect): string {
  return `
Prospect :
- Entreprise : ${prospect.nomEntreprise}
- Ville : ${prospect.ville ?? "Non renseignée"}
- Site : ${prospect.siteWeb ?? "Non renseigné"}
- Description : ${prospect.description ?? "Non renseignée"}
- Score IA : ${prospect.scoreIA ?? "Non qualifié"}/100
- Services détectés : ${prospect.detailsScoreIA?.services_detected?.join(", ") ?? "Inconnus"}
- Analyse : ${prospect.detailsScoreIA?.reasoning ?? "Aucune"}
`.trim();
}

export async function generateEmailContent(prospect: Prospect): Promise<string> {
  const response = await chatCompletion(
    `${BASE_SYSTEM}

Rédige un email de prospection B2B personnalisé en français, basé UNIQUEMENT sur les informations réelles du prospect.
Signe avec "L'équipe MatoFlow" — pas de placeholders [Votre Nom].
Réponds UNIQUEMENT en JSON : { "email": "Objet: ...\\n\\nCorps..." }`,
    buildProspectContext(prospect),
    { temperature: AI_CONFIG.contentTemperature, json: true }
  );

  try {
    return JSON.parse(response).email ?? "";
  } catch {
    return "Erreur lors de la génération de l'email.";
  }
}

export async function generateLinkedInContent(
  prospect: Prospect
): Promise<string> {
  const response = await chatCompletion(
    `${BASE_SYSTEM}

Rédige un message LinkedIn (max 300 car.) basé sur les services réellement détectés chez ce prospect.
Réponds UNIQUEMENT en JSON : { "linkedin": "..." }`,
    buildProspectContext(prospect),
    { temperature: AI_CONFIG.contentTemperature, json: true }
  );

  try {
    return JSON.parse(response).linkedin ?? "";
  } catch {
    return "Erreur lors de la génération du message LinkedIn.";
  }
}

export async function generateCallScriptContent(
  prospect: Prospect
): Promise<string> {
  const response = await chatCompletion(
    `${BASE_SYSTEM}

Rédige un script d'appel téléphonique structuré (accroche, questions, proposition RDV).
Réponds UNIQUEMENT en JSON : { "callScript": "..." }`,
    buildProspectContext(prospect),
    { temperature: AI_CONFIG.contentTemperature, json: true }
  );

  try {
    return JSON.parse(response).callScript ?? "";
  } catch {
    return "Erreur lors de la génération du script d'appel.";
  }
}

export async function generateCommercialContent(
  prospect: Prospect
): Promise<GeneratedContent> {
  const email = await generateEmailContent(prospect);
  const linkedin = await generateLinkedInContent(prospect);
  const callScript = await generateCallScriptContent(prospect);

  return {
    email,
    linkedin,
    callScript,
  };
}

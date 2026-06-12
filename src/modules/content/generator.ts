import { chatCompletion } from "@/lib/openai";
import { AI_CONFIG, MATOFLOW_VALUE_PROPS } from "@/config/constants";
import type { GeneratedContent, Prospect } from "@/types/prospect";

const CONTENT_SYSTEM_PROMPT = `Tu es un commercial expert pour MatoFlow, logiciel SaaS pour les entreprises du paysage.

MatoFlow propose :
${MATOFLOW_VALUE_PROPS.map((p) => `- ${p}`).join("\n")}

Génère du contenu commercial personnalisé, professionnel et concis en français.
Ton : chaleureux, direct, orienté bénéfices métier. Pas de jargon technique excessif.

Réponds UNIQUEMENT en JSON valide :
{
  "email": "Objet: ...\\n\\nCorps de l'email...",
  "linkedin": "Message LinkedIn (max 300 caractères)",
  "callScript": "Script d'appel structuré avec accroche, questions de découverte et proposition de RDV"
}`;

export async function generateCommercialContent(
  prospect: Prospect
): Promise<GeneratedContent> {
  const userPrompt = `
Prospect :
- Entreprise : ${prospect.company_name}
- Ville : ${prospect.city ?? "Non renseignée"}
- Site : ${prospect.website ?? "Non renseigné"}
- Score IA : ${prospect.ai_score ?? "Non qualifié"}/100
- Services détectés : ${prospect.ai_score_details?.services_detected?.join(", ") ?? "Inconnus"}
- Analyse : ${prospect.ai_score_details?.reasoning ?? "Aucune"}
`.trim();

  const response = await chatCompletion(
    CONTENT_SYSTEM_PROMPT,
    userPrompt,
    { temperature: AI_CONFIG.contentTemperature, json: true }
  );

  try {
    const parsed = JSON.parse(response);
    return {
      email: parsed.email ?? "",
      linkedin: parsed.linkedin ?? "",
      callScript: parsed.callScript ?? "",
    };
  } catch {
    return {
      email: "Erreur lors de la génération de l'email.",
      linkedin: "Erreur lors de la génération du message LinkedIn.",
      callScript: "Erreur lors de la génération du script d'appel.",
    };
  }
}

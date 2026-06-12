import { chatCompletion } from "@/lib/openai";
import { AI_CONFIG } from "@/config/constants";
import type { AiScoreDetails } from "@/types/prospect";

const QUALIFICATION_SYSTEM_PROMPT = `Tu es un expert en qualification commerciale B2B pour MatoFlow,
un logiciel SaaS destiné aux entreprises du paysage (paysagistes, entretien d'espaces verts, élagage, création paysagère).

Analyse les informations fournies sur une entreprise et évalue sa pertinence comme prospect.

Critères d'évaluation :
1. is_landscaping_company : entreprise du secteur paysage / espaces verts
2. has_maintenance_contracts : propose des contrats d'entretien récurrents
3. estimated_company_size : "petite" (<5 employés), "moyenne" (5-20), "grande" (>20)
4. has_teams : présence d'équipes terrain identifiables
5. needs_quoting_planning_billing : besoin probable de devis, planning et facturation

Réponds UNIQUEMENT en JSON valide avec cette structure :
{
  "is_landscaping_company": boolean,
  "has_maintenance_contracts": boolean,
  "estimated_company_size": "petite" | "moyenne" | "grande",
  "has_teams": boolean,
  "needs_quoting_planning_billing": boolean,
  "keywords_found": string[],
  "services_detected": string[],
  "reasoning": string
}`;

export interface QualificationInput {
  companyName: string;
  website?: string | null;
  city?: string | null;
  websiteContent?: string | null;
}

export async function analyzeProspect(
  input: QualificationInput
): Promise<AiScoreDetails> {
  const userPrompt = `
Entreprise : ${input.companyName}
Ville : ${input.city ?? "Non renseignée"}
Site web : ${input.website ?? "Non renseigné"}

${input.websiteContent ? `Contenu du site :\n${input.websiteContent.slice(0, 4000)}` : "Aucun contenu de site disponible — déduis ce que tu peux du nom et de la ville."}
`.trim();

  const response = await chatCompletion(
    QUALIFICATION_SYSTEM_PROMPT,
    userPrompt,
    { temperature: AI_CONFIG.qualificationTemperature, json: true }
  );

  try {
    return JSON.parse(response) as AiScoreDetails;
  } catch {
    return {
      is_landscaping_company: false,
      reasoning: "Erreur lors de l'analyse IA",
    };
  }
}

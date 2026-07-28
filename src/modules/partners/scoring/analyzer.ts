import { chatCompletion } from "@/lib/openai";
import { AI_CONFIG, MATOFLOW_VALUE_PROPS } from "@/config/constants";
import { partnerRepository } from "@/modules/partners/crm/repository";
import type {
  Partner,
  PartnerAnalysis,
  PartnershipKind,
} from "@/types/partner";
import { PARTNERSHIP_KINDS, PARTNER_TYPE_LABELS } from "@/types/partner";

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function averageStars(breakdown: PartnerAnalysis["scoreBreakdown"]): number {
  const values = Object.values(breakdown);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return clampScore(avg);
}

function isPartnershipKind(value: unknown): value is PartnershipKind {
  return (
    typeof value === "string" &&
    (PARTNERSHIP_KINDS as readonly string[]).includes(value)
  );
}

type AnalyzeResult = {
  scoreEtoiles: number;
  analysis: PartnerAnalysis;
  extras: {
    tailleEstimee: string | null;
    hasApi: boolean | null;
    linkedinEntreprise: string | null;
    nomDirigeant: string | null;
    fonctionDirigeant: string | null;
  };
};

export async function analyzePartnerForMatoflow(
  partner: Partner
): Promise<AnalyzeResult> {
  const system = `Tu es un stratège partenariats pour MatoFlow, SaaS pour entreprises du paysage.

Valeur MatoFlow :
${MATOFLOW_VALUE_PROPS.map((p) => `- ${p}`).join("\n")}

Analyse le partenaire potentiel et réponds UNIQUEMENT en JSON :
{
  "whyInteresting": "...",
  "mutualBenefits": "...",
  "matoflowModules": ["devis", "contrats", "..."],
  "recommendedPartnership": "apporteur_affaires|revendeur|integration_api|strategique|offre_adherents|co_marketing",
  "scoreBreakdown": {
    "taille": 1-5,
    "visibilite": 1-5,
    "potentielCommercial": 1-5,
    "coherence": 1-5,
    "complementarite": 1-5,
    "influence": 1-5
  },
  "reasoning": "...",
  "tailleEstimee": "ex. PME / 50 adhérents",
  "hasApi": true/false/null,
  "linkedinEntreprise": "url ou null",
  "nomDirigeant": "si connu sinon null",
  "fonctionDirigeant": "si connu sinon null"
}`;

  const user = `
Partenaire :
- Nom : ${partner.nom}
- Entreprise : ${partner.entreprise}
- Type : ${PARTNER_TYPE_LABELS[partner.type]}
- Zone : ${partner.zone ?? "Non renseignée"}
- Site : ${partner.siteWeb ?? "Non renseigné"}
- Adresse : ${partner.adresse ?? "Non renseignée"}
- Description : ${partner.description ?? "Non renseignée"}
- Services : ${partner.servicesProposes ?? "Non renseignés"}
- Email : ${partner.email ?? "Non renseigné"}
- Téléphone : ${partner.telephone ?? "Non renseigné"}
`.trim();

  const raw = await chatCompletion(system, user, {
    temperature: AI_CONFIG.qualificationTemperature,
    json: true,
  });

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const breakdownRaw = (parsed.scoreBreakdown ?? {}) as Record<string, unknown>;
  const breakdown = {
    taille: clampScore(breakdownRaw.taille),
    visibilite: clampScore(breakdownRaw.visibilite),
    potentielCommercial: clampScore(breakdownRaw.potentielCommercial),
    coherence: clampScore(breakdownRaw.coherence),
    complementarite: clampScore(breakdownRaw.complementarite),
    influence: clampScore(breakdownRaw.influence),
  };

  const recommended = isPartnershipKind(parsed.recommendedPartnership)
    ? parsed.recommendedPartnership
    : "apporteur_affaires";

  return {
    scoreEtoiles: averageStars(breakdown),
    analysis: {
      whyInteresting:
        typeof parsed.whyInteresting === "string"
          ? parsed.whyInteresting
          : "Potentiel à évaluer.",
      mutualBenefits:
        typeof parsed.mutualBenefits === "string"
          ? parsed.mutualBenefits
          : "À préciser.",
      matoflowModules: Array.isArray(parsed.matoflowModules)
        ? parsed.matoflowModules.filter((m): m is string => typeof m === "string")
        : [],
      recommendedPartnership: recommended,
      scoreBreakdown: breakdown,
      reasoning: typeof parsed.reasoning === "string" ? parsed.reasoning : "",
    },
    extras: {
      tailleEstimee:
        typeof parsed.tailleEstimee === "string" ? parsed.tailleEstimee : null,
      hasApi: typeof parsed.hasApi === "boolean" ? parsed.hasApi : null,
      linkedinEntreprise:
        typeof parsed.linkedinEntreprise === "string"
          ? parsed.linkedinEntreprise
          : null,
      nomDirigeant:
        typeof parsed.nomDirigeant === "string" ? parsed.nomDirigeant : null,
      fonctionDirigeant:
        typeof parsed.fonctionDirigeant === "string"
          ? parsed.fonctionDirigeant
          : null,
    },
  };
}

export async function scorePartner(partnerId: string): Promise<Partner> {
  const partner = await partnerRepository.getById(partnerId);
  if (!partner) throw new Error("Partenaire introuvable");

  const result = await analyzePartnerForMatoflow(partner);

  return partnerRepository.updateFields(partnerId, {
    scoreEtoiles: result.scoreEtoiles,
    analyseIA: result.analysis,
    partnershipKind: result.analysis.recommendedPartnership,
    ...(result.extras.tailleEstimee
      ? { tailleEstimee: result.extras.tailleEstimee }
      : {}),
    ...(result.extras.hasApi !== null ? { hasApi: result.extras.hasApi } : {}),
    ...(result.extras.linkedinEntreprise
      ? { linkedinEntreprise: result.extras.linkedinEntreprise }
      : {}),
    ...(result.extras.nomDirigeant
      ? { nomDirigeant: result.extras.nomDirigeant }
      : {}),
    ...(result.extras.fonctionDirigeant
      ? { fonctionDirigeant: result.extras.fonctionDirigeant }
      : {}),
  });
}

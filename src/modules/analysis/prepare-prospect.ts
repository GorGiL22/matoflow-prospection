import { prospectService } from "@/modules/prospects/service";
import { fetchCompanyBySiret } from "@/modules/enrichment/sirene";
import type { ProspectInsert } from "@/types/prospect";

export interface RealAnalysisInput {
  nomEntreprise: string;
  siret?: string | null;
  siteWeb?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  description?: string | null;
}

export async function prepareRealProspectForAnalysis(input: RealAnalysisInput) {
  let enriched = input;

  if (input.siret) {
    const sirene = await fetchCompanyBySiret(input.siret);
    if (sirene) {
      enriched = {
        nomEntreprise: input.nomEntreprise.trim() || sirene.nomEntreprise,
        siret: sirene.siret,
        siteWeb: input.siteWeb,
        ville: input.ville ?? sirene.ville,
        telephone: input.telephone,
        email: input.email,
        description:
          input.description ??
          [
            sirene.activiteLibelle,
            sirene.adresse,
            sirene.effectif ? `Effectif : ${sirene.effectif}` : null,
            sirene.estPaysagiste ? "Activité paysage confirmée (NAF)" : null,
          ]
            .filter(Boolean)
            .join(" — "),
      };
    }
  }

  const payload: ProspectInsert = {
    nomEntreprise: enriched.nomEntreprise,
    siret: enriched.siret ?? null,
    siteWeb: enriched.siteWeb ?? null,
    ville: enriched.ville ?? null,
    telephone: enriched.telephone ?? null,
    email: enriched.email ?? null,
    description: enriched.description ?? null,
  };

  const prospect = await prospectService.createOrUpdateProspect(payload);
  return { prospect, enriched };
}

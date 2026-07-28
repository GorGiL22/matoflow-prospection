import { analyzeWebsite } from "@/modules/analysis/website-analyzer";
import { partnerRepository } from "@/modules/partners/crm/repository";
import { GooglePlacesPartnerProvider } from "@/modules/partners/search/places-provider";
import {
  hasWebSearchConfigured,
  WebSearchProvider,
} from "@/modules/partners/search/web-provider";
import { extractDomainFromUrl } from "@/lib/mappers/partner";
import type {
  Partner,
  PartnerSearchCandidate,
  PartnerType,
} from "@/types/partner";

function dedupeCandidates(
  candidates: PartnerSearchCandidate[]
): PartnerSearchCandidate[] {
  const seen = new Set<string>();
  const result: PartnerSearchCandidate[] = [];

  for (const candidate of candidates) {
    const domain = extractDomainFromUrl(candidate.siteWeb);
    const key =
      domain ??
      `${candidate.entreprise}|${candidate.adresse ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }

  return result;
}

export async function collectPartnerCandidates(input: {
  zone: string;
  types: PartnerType[];
  limitPerType?: number;
}): Promise<PartnerSearchCandidate[]> {
  const limitPerType = input.limitPerType ?? 8;
  const web = new WebSearchProvider();
  const places = new GooglePlacesPartnerProvider();
  const all: PartnerSearchCandidate[] = [];

  for (const type of input.types) {
    if (hasWebSearchConfigured()) {
      try {
        const webResults = await web.search({
          zone: input.zone,
          type,
          limit: limitPerType,
        });
        all.push(...webResults);
      } catch (error) {
        console.error("[partners/search] web", error);
      }
    }

    if (places.supports(type) && process.env.GOOGLE_MAPS_API_KEY) {
      try {
        const placeResults = await places.search({
          zone: input.zone,
          type,
          limit: Math.min(limitPerType, 10),
        });
        all.push(...placeResults);
      } catch (error) {
        console.error("[partners/search] places", error);
      }
    }
  }

  return dedupeCandidates(all);
}

export async function enrichPartnerCandidate(
  candidate: PartnerSearchCandidate,
  zone: string
): Promise<{ partner: Partner; created: boolean }> {
  let email: string | null = null;
  let telephone = candidate.telephone ?? null;
  let description = candidate.description ?? null;
  let servicesProposes: string | null = null;

  if (candidate.siteWeb) {
    try {
      const analysis = await analyzeWebsite(candidate.siteWeb);
      if (analysis) {
        email = analysis.emails[0] ?? null;
        telephone = telephone ?? analysis.phones[0] ?? null;
        description =
          description ||
          analysis.metaDescription ||
          analysis.headings.slice(0, 3).join(" · ") ||
          null;
        if (analysis.headings.length) {
          servicesProposes = analysis.headings.slice(0, 8).join(" | ");
        }
      }
    } catch {
      /* site inaccessible */
    }
  }

  return partnerRepository.upsertFromSearch({
    nom: candidate.nom,
    entreprise: candidate.entreprise,
    type: candidate.type,
    siteWeb: candidate.siteWeb,
    telephone,
    adresse: candidate.adresse,
    zone,
    description,
    email,
    servicesProposes,
    sourceRecherche: candidate.source,
  });
}

export async function runPartnerSearch(input: {
  zone: string;
  types: PartnerType[];
  limitPerType?: number;
  onProgress?: (message: string, processed: number, total: number) => void | Promise<void>;
}): Promise<{ partners: Partner[]; created: number; updated: number }> {
  const candidates = await collectPartnerCandidates({
    zone: input.zone,
    types: input.types,
    limitPerType: input.limitPerType,
  });

  const partners: Partner[] = [];
  let created = 0;
  let updated = 0;

  for (let i = 0; i < candidates.length; i += 1) {
    await input.onProgress?.(
      `Enrichissement ${candidates[i].entreprise}`,
      i,
      candidates.length
    );
    const result = await enrichPartnerCandidate(candidates[i], input.zone);
    if (result.created) created += 1;
    else updated += 1;
    partners.push(result.partner);
  }

  await input.onProgress?.(
    "Recherche terminée",
    candidates.length,
    candidates.length
  );
  return { partners, created, updated };
}

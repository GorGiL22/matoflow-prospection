import {
  normalizeEmail,
  normalizeSiret,
  normalizeWebsiteDomain,
} from "@/lib/utils";
import type { Prospect, ProspectInsert } from "@/types/prospect";

export interface DeduplicationKeys {
  websiteDomain: string | null;
  emailNormalized: string | null;
  siretNormalized: string | null;
}

export function extractDeduplicationKeys(
  data: Pick<ProspectInsert, "website" | "email" | "siret">
): DeduplicationKeys {
  return {
    websiteDomain: normalizeWebsiteDomain(data.website),
    emailNormalized: normalizeEmail(data.email),
    siretNormalized: normalizeSiret(data.siret),
  };
}

export function findDuplicateProspect(
  prospects: Prospect[],
  keys: DeduplicationKeys
): Prospect | null {
  const { websiteDomain, emailNormalized, siretNormalized } = keys;

  return (
    prospects.find((p) => {
      if (siretNormalized && p.siret_normalized === siretNormalized) return true;
      if (emailNormalized && p.email_normalized === emailNormalized) return true;
      if (websiteDomain && p.website_domain === websiteDomain) return true;
      return false;
    }) ?? null
  );
}

export function mergeProspectData(
  existing: Prospect,
  incoming: ProspectInsert
): ProspectInsert {
  return {
    company_name: incoming.company_name?.trim() || existing.company_name,
    siret: incoming.siret ?? existing.siret,
    phone: incoming.phone ?? existing.phone,
    email: incoming.email ?? existing.email,
    website: incoming.website ?? existing.website,
    city: incoming.city ?? existing.city,
    google_reviews_count: Math.max(
      incoming.google_reviews_count ?? 0,
      existing.google_reviews_count
    ),
    source: incoming.source ?? existing.source,
    ai_score: incoming.ai_score ?? existing.ai_score,
    ai_score_details: incoming.ai_score_details ?? existing.ai_score_details,
  };
}

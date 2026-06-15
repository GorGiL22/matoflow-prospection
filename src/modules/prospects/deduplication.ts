import {
  normalizeEmail,
  normalizeSiret,
  normalizeWebsiteDomain,
} from "@/lib/utils";
import type { UnepCompanySummary } from "@/lib/unep-api";
import { extractUnepSlug } from "@/lib/unep-api";
import type { Prospect, ProspectInsert } from "@/types/prospect";

export interface DeduplicationKeys {
  websiteDomain: string | null;
  emailNormalized: string | null;
  siretNormalized: string | null;
}

export function extractDeduplicationKeys(
  data: Pick<ProspectInsert, "siteWeb" | "email" | "siret">
): DeduplicationKeys {
  return {
    websiteDomain: normalizeWebsiteDomain(data.siteWeb),
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
      if (siretNormalized && p.siretNormalise === siretNormalized) return true;
      if (emailNormalized && p.emailNormalise === emailNormalized) return true;
      if (websiteDomain && p.domaineSite === websiteDomain) return true;
      return false;
    }) ?? null
  );
}

export function isProspectInIndex(
  data: {
    unepId?: string;
    unepSlug?: string | null;
    unepLink?: string;
    email?: string | null;
    siteWeb?: string | null;
    siret?: string | null;
  },
  index: {
    unepIds: Set<string>;
    unepSlugs: Set<string>;
    emails: Set<string>;
    domains: Set<string>;
    sirets: Set<string>;
  }
): boolean {
  if (data.unepId && index.unepIds.has(data.unepId)) return true;

  const slug = data.unepSlug ?? (data.unepLink ? extractUnepSlugFromLink(data.unepLink) : null);
  if (slug && index.unepSlugs.has(slug)) return true;

  const email = normalizeEmail(data.email);
  if (email && index.emails.has(email)) return true;

  const domain = normalizeWebsiteDomain(data.siteWeb);
  if (domain && index.domains.has(domain)) return true;

  const siret = normalizeSiret(data.siret);
  if (siret && index.sirets.has(siret)) return true;

  return false;
}

function extractUnepSlugFromLink(link: string): string | null {
  return extractUnepSlug(link);
}

export function isUnepSummaryKnown(
  summary: Pick<UnepCompanySummary, "id" | "link">,
  index: {
    unepIds: Set<string>;
    unepSlugs: Set<string>;
  }
): boolean {
  if (index.unepIds.has(String(summary.id))) return true;

  const slug = extractUnepSlug(summary.link);
  if (slug && index.unepSlugs.has(slug)) return true;

  return false;
}

export function registerCompanyInIndex(
  company: {
    unepId: string;
    unepUrl: string;
    email?: string | null;
    siteWeb?: string | null;
    siret?: string | null;
  },
  index: {
    unepIds: Set<string>;
    unepSlugs: Set<string>;
    emails: Set<string>;
    domains: Set<string>;
    sirets: Set<string>;
  }
): void {
  index.unepIds.add(company.unepId);

  const slug = extractUnepSlug(company.unepUrl);
  if (slug) index.unepSlugs.add(slug);

  const email = normalizeEmail(company.email);
  if (email) index.emails.add(email);

  const domain = normalizeWebsiteDomain(company.siteWeb);
  if (domain) index.domains.add(domain);

  const siret = normalizeSiret(company.siret);
  if (siret) index.sirets.add(siret);
}

export function mergeProspectData(
  existing: Prospect,
  incoming: ProspectInsert
): ProspectInsert {
  return {
    nomEntreprise: incoming.nomEntreprise?.trim() || existing.nomEntreprise,
    siret: incoming.siret ?? existing.siret,
    telephone: incoming.telephone ?? existing.telephone,
    email: incoming.email ?? existing.email,
    siteWeb: incoming.siteWeb ?? existing.siteWeb,
    ville: incoming.ville ?? existing.ville,
    description: incoming.description ?? existing.description,
    avisGoogle: Math.max(
      incoming.avisGoogle ?? 0,
      existing.avisGoogle ?? 0
    ),
    scoreIA: incoming.scoreIA ?? existing.scoreIA,
    detailsScoreIA: incoming.detailsScoreIA ?? existing.detailsScoreIA,
  };
}

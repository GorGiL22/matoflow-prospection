import {
  decodeHtmlEntities,
  isValidEmailAddress,
  normalizeEmail,
  normalizeWebsiteDomain,
} from "@/lib/utils";
import type { FfpConcepteurResult } from "@/types/scraping";

function decodeMailto(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function sanitizeFfpEmail(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const decoded = decodeHtmlEntities(decodeMailto(raw.trim()));
  if (!isValidEmailAddress(decoded)) return null;
  return normalizeEmail(decoded);
}

export function normalizeFfpAgencyKey(
  nomEntreprise: string,
  ville: string | null | undefined
): string {
  const nom = nomEntreprise
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  const city = (ville ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s*\(\d{2,3}\)\s*/g, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

  return `${nom}|${city}`;
}

function contactScore(company: FfpConcepteurResult): number {
  let score = 0;
  if (sanitizeFfpEmail(company.email)) score += 100;
  if (company.telephone?.trim()) score += 40;
  if (company.siteWeb?.trim()) score += 20;
  if (company.adresse?.trim()) score += 10;
  if (company.nomContact?.trim()) score += 5;
  return score;
}

export function dedupeFfpConcepteursByAgency(
  companies: FfpConcepteurResult[]
): FfpConcepteurResult[] {
  const groups = new Map<string, FfpConcepteurResult[]>();

  for (const company of companies) {
    const key = normalizeFfpAgencyKey(company.nomEntreprise, company.ville);
    const bucket = groups.get(key) ?? [];
    bucket.push(company);
    groups.set(key, bucket);
  }

  const deduped: FfpConcepteurResult[] = [];

  for (const members of groups.values()) {
    const sorted = [...members].sort((a, b) => contactScore(b) - contactScore(a));
    const primary = { ...sorted[0] };

    primary.email = sanitizeFfpEmail(primary.email);
    for (const extra of sorted.slice(1)) {
      if (!primary.email) {
        primary.email = sanitizeFfpEmail(extra.email);
      }
      if (!primary.telephone && extra.telephone) {
        primary.telephone = extra.telephone;
      }
      if (!primary.siteWeb && extra.siteWeb) {
        primary.siteWeb = extra.siteWeb;
      }
      if (!primary.adresse && extra.adresse) {
        primary.adresse = extra.adresse;
      }
    }

    const extraContacts = sorted
      .slice(1)
      .map((m) => m.nomContact)
      .filter(Boolean) as string[];

    if (extraContacts.length > 0) {
      primary.nomContact = [primary.nomContact, ...extraContacts]
        .filter(Boolean)
        .filter((name, index, arr) => arr.indexOf(name) === index)
        .join(", ");
    }

    deduped.push(primary);
  }

  return deduped.sort((a, b) =>
    a.nomEntreprise.localeCompare(b.nomEntreprise, "fr")
  );
}

export function sanitizeFfpConcepteur(
  company: FfpConcepteurResult
): FfpConcepteurResult {
  return {
    ...company,
    email: sanitizeFfpEmail(company.email),
    nomEntreprise: company.nomEntreprise.trim(),
    siteWeb: company.siteWeb?.trim() || null,
  };
}

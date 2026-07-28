import type { FfpConcepteurResult } from "@/types/scraping";
import { sanitizeFfpEmail } from "@/modules/scraping/ffp-dedup";
import { decodeHtmlEntities } from "@/lib/utils";

const FFP_BASE_URL = "https://f-f-p.org";
const FFP_ANNUAIRE_URL = `${FFP_BASE_URL}/annuaire/`;
const USER_AGENT = "MatoFlow-Prospection/1.0 (+https://matoflow.fr)";

export const FFP_REQUEST_DELAY_MS = 750;
export const FFP_ENRICH_CONCURRENCY = 6;

export interface FfpAnnuaireEntry {
  ffpWpId: string;
  ffpSlug: string;
  nomContact: string;
  nomAgence: string | null;
  ville: string | null;
  region: string | null;
}

export interface FfpImportProgress {
  phase: "annuaire" | "enrichissement" | "import" | "done";
  total: number;
  processed: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  current?: string;
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeMailto(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractMetaValue(html: string, label: string): string | null {
  const match = html.match(
    new RegExp(`data-label="${label}"[^>]*>([\\s\\S]*?)<\\/li>`, "i")
  );
  if (!match) return null;
  const cleaned = stripHtml(match[1]);
  return cleaned || null;
}

function extractEmails(html: string): string[] {
  const emails = new Set<string>();

  for (const match of html.matchAll(/mailto:([^"'>\s]+)/gi)) {
    const email = sanitizeFfpEmail(decodeMailto(match[1]));
    if (!email) continue;
    emails.add(email);
  }

  return [...emails];
}

function extractPhone(contactBlock: string | null): string | null {
  if (!contactBlock) return null;
  const cleaned = stripHtml(contactBlock);
  const match = cleaned.match(/(?:\+33|0)[\d\s.]{8,}/);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function extractSiteWeb(html: string): string | null {
  for (const match of html.matchAll(/href="(https?:\/\/[^"]+)"/gi)) {
    const url = match[1];
    if (
      url.includes("f-f-p.org") ||
      url.includes("ffp.blueingreen.fr") ||
      url.includes("facebook.com") ||
      url.includes("instagram.com") ||
      url.includes("linkedin.com") ||
      url.includes("youtube.com") ||
      url.includes("cnil.fr") ||
      url.includes("assoconnect.com")
    ) {
      continue;
    }
    return url;
  }
  return null;
}

function parseVilleFromAdresse(adresse: string | null): string | null {
  if (!adresse) return null;
  const cpCity = adresse.match(/\b\d{5}\s+(.+)$/);
  if (cpCity) return cpCity[1].trim();
  return adresse.trim() || null;
}

async function fetchFfpHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} pour ${url}`);
  }

  return response.text();
}

export function parseFfpAnnuaireAgences(html: string): FfpAnnuaireEntry[] {
  const entries = new Map<string, FfpAnnuaireEntry>();

  for (const row of html.split("<tr")) {
    if (
      !row.includes("icon-dot-agence-paysage") ||
      row.includes("filleul") ||
      row.includes("icon-dot-student")
    ) {
      continue;
    }

    const wpId = row.match(/data-wp-id="(\d+)"/)?.[1];
    const slug = row.match(/membre\/([^"]+)"/)?.[1];
    if (!wpId || !slug) continue;

    const nomContact =
      stripHtml(
        row.match(
          /user-name-container[\s\S]*?membre\/[^"]+"[^>]*>([\s\S]*?)<\/a>/i
        )?.[1] ?? ""
      ) || null;

    const nomAgence =
      stripHtml(
        row.match(
          /agency-container[\s\S]*?membre\/[^"]+"[^>]*>([\s\S]*?)<\/a>/i
        )?.[1] ?? ""
      ) || null;

    const ville =
      row.match(/address-container">([^<]*)</)?.[1]?.trim() || null;

    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (match) => stripHtml(match[1])
    );
    const region = cells.at(-1)?.trim() || null;

    entries.set(slug, {
      ffpWpId: wpId,
      ffpSlug: decodeURIComponent(slug),
      nomContact,
      nomAgence,
      ville: ville || null,
      region,
    });
  }

  return [...entries.values()];
}

export async function fetchFfpAnnuaireAgences(): Promise<FfpAnnuaireEntry[]> {
  const html = await fetchFfpHtml(FFP_ANNUAIRE_URL);
  return parseFfpAnnuaireAgences(html);
}

export async function enrichFfpConcepteur(
  entry: FfpAnnuaireEntry
): Promise<FfpConcepteurResult> {
  const ffpUrl = `${FFP_BASE_URL}/membre/${encodeURIComponent(entry.ffpSlug)}`;
  const html = await fetchFfpHtml(ffpUrl);

  const agence = extractMetaValue(html, "agence");
  const adresse = extractMetaValue(html, "adresse");
  const contactBlock = html.match(
    /data-label="contact"[^>]*>([\s\S]*?)<\/li>/i
  )?.[1];

  const emails = extractEmails(html);
  const telephone = extractPhone(contactBlock ?? null);
  const siteWeb = extractSiteWeb(html);

  const nomEntreprise =
    agence?.trim() ||
    entry.nomAgence?.trim() ||
    entry.nomContact?.trim() ||
    `FFP ${entry.ffpSlug}`;

  return {
    ffpWpId: entry.ffpWpId,
    ffpSlug: entry.ffpSlug,
    nomEntreprise,
    nomContact: entry.nomContact,
    telephone,
    email: emails[0] ?? null,
    siteWeb,
    ville: entry.ville || parseVilleFromAdresse(adresse),
    adresse,
    region: entry.region,
    ffpUrl,
  };
}

export function buildFfpDescription(company: FfpConcepteurResult): string {
  return [
    company.nomContact ? `Contact: ${company.nomContact}` : null,
    company.adresse,
    company.region ? `Antenne: ${company.region}` : null,
    `FFP:${company.ffpWpId}`,
    `FFP: ${company.ffpUrl}`,
  ]
    .filter(Boolean)
    .join(" — ");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichFfpConcepteursBatch(
  entries: FfpAnnuaireEntry[],
  options?: {
    concurrency?: number;
    delayMs?: number;
    onProgress?: (progress: FfpImportProgress) => void;
  }
): Promise<{ results: FfpConcepteurResult[]; errors: string[] }> {
  const concurrency = options?.concurrency ?? FFP_ENRICH_CONCURRENCY;
  const delayMs = options?.delayMs ?? FFP_REQUEST_DELAY_MS;
  const results: FfpConcepteurResult[] = [];
  const errors: string[] = [];

  for (let index = 0; index < entries.length; index += concurrency) {
    const batch = entries.slice(index, index + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (entry) => {
        try {
          return await enrichFfpConcepteur(entry);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Erreur inconnue";
          errors.push(`${entry.ffpSlug}: ${message}`);
          return null;
        }
      })
    );

    for (const result of batchResults) {
      if (result) results.push(result);
    }

    options?.onProgress?.({
      phase: "enrichissement",
      total: entries.length,
      processed: Math.min(index + batch.length, entries.length),
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      current: batch.at(-1)?.nomAgence ?? batch.at(-1)?.ffpSlug,
    });

    if (index + concurrency < entries.length) {
      await sleep(delayMs);
    }
  }

  return { results, errors };
}

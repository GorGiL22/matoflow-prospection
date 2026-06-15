import { decodeHtmlEntities, normalizeUnepWebsite } from "@/lib/utils";

const UNEP_BASE_URL = "https://www.lesentreprisesdupaysage.fr";
const UNEP_API_URL = `${UNEP_BASE_URL}/wp-json/wp/v2`;
const USER_AGENT = "MatoFlow-Prospection/1.0 (+https://github.com/GorGiL22/matoflow-prospection)";

/** IDs région UNEP (taxonomie legacy — seuls ceux-ci retournent des entreprises). */
export const UNEP_REGION_ILE_DE_FRANCE = 1183;
export const UNEP_REGION_NORMANDIE = 1185;
export const UNEP_REGION_PACA = 1186;
export const UNEP_REGION_NOUVELLE_AQUITAINE = 1187;
export const UNEP_REGION_OCCITANIE = 1188;
export const UNEP_REGION_BRETAGNE = 1191;
export const UNEP_REGION_PAYS_DE_LA_LOIRE = 1192;
export const UNEP_REGION_GRAND_EST = 1194;
export const UNEP_REGION_CENTRE = 1196;
export const UNEP_REGION_AUVERGNE_RHONE_ALPES = 1198;

export interface UnepCompanySummary {
  id: number;
  slug: string;
  nomEntreprise: string;
  link: string;
  activites: string[];
}

interface UnepCompanyRaw {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  class_list?: string[];
}

interface UnepListResponse {
  items: UnepCompanySummary[];
  total: number;
  totalPages: number;
}

function parseActivites(classList: string[] | undefined): string[] {
  if (!classList) return [];

  return classList
    .filter((item) => item.startsWith("company_skills-"))
    .map((item) =>
      item
        .replace("company_skills-", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    );
}

function mapCompanySummary(raw: UnepCompanyRaw): UnepCompanySummary {
  return {
    id: raw.id,
    slug: raw.slug,
    nomEntreprise: decodeHtmlEntities(raw.title.rendered),
    link: raw.link,
    activites: parseActivites(raw.class_list),
  };
}

async function unepFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(`${UNEP_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`UNEP API erreur ${response.status} sur ${path}`);
  }

  return response;
}

export async function listUnepCompaniesByRegion(
  regionId: number,
  page = 1,
  perPage = 100
): Promise<UnepListResponse> {
  const response = await unepFetch(
    `/companies?regions=${regionId}&per_page=${perPage}&page=${page}`
  );

  const items = (await response.json()) as UnepCompanyRaw[];

  return {
    items: items.map(mapCompanySummary),
    total: Number(response.headers.get("X-WP-Total") ?? items.length),
    totalPages: Number(response.headers.get("X-WP-TotalPages") ?? 1),
  };
}

export interface UnepLocalBusinessDetails {
  nomEntreprise: string;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
}

interface LocalBusinessSchema {
  "@type"?: string;
  name?: string;
  email?: string;
  telephone?: string;
  url?: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
  };
}

function extractLocalBusinessSchemas(html: string): LocalBusinessSchema[] {
  const schemas: LocalBusinessSchema[] = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const raw = match[1]?.trim();
    if (!raw || !raw.includes("LocalBusiness")) continue;

    try {
      const parsed = JSON.parse(raw) as
        | LocalBusinessSchema
        | LocalBusinessSchema[];

      if (Array.isArray(parsed)) {
        schemas.push(
          ...parsed.filter((item) => item["@type"] === "LocalBusiness")
        );
      } else if (parsed["@type"] === "LocalBusiness") {
        schemas.push(parsed);
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return schemas;
}

export async function fetchUnepCompanyDetails(
  link: string
): Promise<UnepLocalBusinessDetails | null> {
  const response = await fetch(link, {
    headers: {
      Accept: "text/html",
      "User-Agent": USER_AGENT,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const schema = extractLocalBusinessSchemas(html)[0];
  if (!schema) return null;

  const street = schema.address?.streetAddress?.trim() ?? "";
  const ville = schema.address?.addressLocality?.trim() ?? null;
  const codePostal = schema.address?.postalCode?.trim() ?? null;
  const adresse = [street, codePostal, ville].filter(Boolean).join(" ") || null;

  return {
    nomEntreprise: decodeHtmlEntities(schema.name?.trim() ?? ""),
    email: schema.email?.trim() || null,
    telephone: schema.telephone?.trim() || null,
    siteWeb: normalizeUnepWebsite(schema.url),
    adresse,
    ville,
    codePostal,
  };
}

export function getUnepProfileUrl(slug: string): string {
  return `${UNEP_BASE_URL}/localiser-un-paysagiste/${slug}/`;
}

export function extractUnepSlug(link: string): string | null {
  const match = link.match(/localiser-un-paysagiste\/([^/?#]+)/i);
  return match?.[1]?.replace(/\/$/, "") ?? null;
}

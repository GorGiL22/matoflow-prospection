import type { PartnerSearchCandidate, PartnerType } from "@/types/partner";
import {
  buildSearchQueries,
  guessTypeFromText,
  type PartnerSearchProvider,
} from "@/modules/partners/search/types";

interface SerperOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
}

interface BraveWebResult {
  title?: string;
  url?: string;
  description?: string;
}

async function searchWithSerper(
  query: string,
  apiKey: string,
  limit: number
): Promise<SerperOrganicResult[]> {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({ q: query, gl: "fr", hl: "fr", num: limit }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Serper ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as { organic?: SerperOrganicResult[] };
  return data.organic ?? [];
}

async function searchWithBrave(
  query: string,
  apiKey: string,
  limit: number
): Promise<BraveWebResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(limit, 20)));
  url.searchParams.set("country", "fr");
  url.searchParams.set("search_lang", "fr");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brave Search ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    web?: { results?: BraveWebResult[] };
  };
  return data.web?.results ?? [];
}

function toCandidate(
  title: string,
  link: string,
  snippet: string | undefined,
  type: PartnerType
): PartnerSearchCandidate {
  return {
    nom: title,
    entreprise: title,
    type: guessTypeFromText(`${title} ${snippet ?? ""}`, type),
    siteWeb: link,
    description: snippet ?? null,
    source: "web",
    sourceUrl: link,
  };
}

export class WebSearchProvider implements PartnerSearchProvider {
  readonly name = "web";

  async search(input: {
    zone: string;
    type: PartnerType;
    limit: number;
  }): Promise<PartnerSearchCandidate[]> {
    const serperKey = process.env.SERPER_API_KEY?.trim();
    const braveKey = process.env.BRAVE_SEARCH_API_KEY?.trim();

    if (!serperKey && !braveKey) {
      throw new Error(
        "Aucune clé de recherche web : définissez SERPER_API_KEY ou BRAVE_SEARCH_API_KEY"
      );
    }

    const queries = buildSearchQueries(input.zone, input.type).slice(0, 2);
    const perQuery = Math.max(3, Math.ceil(input.limit / queries.length));
    const results: PartnerSearchCandidate[] = [];
    const seen = new Set<string>();

    for (const query of queries) {
      if (results.length >= input.limit) break;

      if (serperKey) {
        const organic = await searchWithSerper(query, serperKey, perQuery);
        for (const item of organic) {
          if (!item.title || !item.link) continue;
          const key = item.link.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(
            toCandidate(item.title, item.link, item.snippet, input.type)
          );
          if (results.length >= input.limit) break;
        }
      } else if (braveKey) {
        const web = await searchWithBrave(query, braveKey, perQuery);
        for (const item of web) {
          if (!item.title || !item.url) continue;
          const key = item.url.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(
            toCandidate(item.title, item.url, item.description, input.type)
          );
          if (results.length >= input.limit) break;
        }
      }
    }

    return results.slice(0, input.limit);
  }
}

export function hasWebSearchConfigured(): boolean {
  return Boolean(
    process.env.SERPER_API_KEY?.trim() || process.env.BRAVE_SEARCH_API_KEY?.trim()
  );
}

import {
  parseCityFromAddress,
  searchPlacesText,
  type GooglePlaceRaw,
} from "@/lib/google-places";
import { analyzeWebsite } from "@/modules/analysis/website-analyzer";

export interface GoogleMapsSearchConfig {
  ville: string;
  maxResults?: number;
}

export type { GoogleMapsPlaceResult } from "@/types/scraping";
import type { GoogleMapsPlaceResult } from "@/types/scraping";

const SEARCH_QUERIES = [
  "paysagiste",
  "entretien espaces verts",
  "aménagement paysager",
  "élagage",
];

function mapPlace(raw: GooglePlaceRaw, fallbackCity: string): GoogleMapsPlaceResult {
  const placeId = raw.id?.replace("places/", "") ?? crypto.randomUUID();
  const adresse = raw.formattedAddress ?? null;

  return {
    placeId,
    nomEntreprise: raw.displayName?.text ?? "Entreprise inconnue",
    telephone:
      raw.nationalPhoneNumber ?? raw.internationalPhoneNumber ?? null,
    email: null,
    siteWeb: raw.websiteUri ?? null,
    ville: parseCityFromAddress(adresse ?? undefined) ?? fallbackCity,
    adresse,
    avisGoogle: raw.userRatingCount ?? 0,
    noteGoogle: raw.rating ?? null,
    googleMapsUrl: raw.googleMapsUri ?? null,
  };
}

export async function searchLandscapersOnGoogleMaps(
  config: GoogleMapsSearchConfig
): Promise<GoogleMapsPlaceResult[]> {
  const ville = config.ville.trim();
  if (!ville) throw new Error("Ville requise");

  const maxResults = config.maxResults ?? 20;
  const perQuery = Math.ceil(maxResults / SEARCH_QUERIES.length);
  const seen = new Map<string, GoogleMapsPlaceResult>();

  for (const keyword of SEARCH_QUERIES) {
    if (seen.size >= maxResults) break;

    const textQuery = `${keyword} ${ville}`;
    const response = await searchPlacesText(textQuery, {
      maxResults: perQuery,
    });

    for (const place of response.places ?? []) {
      const mapped = mapPlace(place, ville);
      if (!seen.has(mapped.placeId)) {
        seen.set(mapped.placeId, mapped);
      }
      if (seen.size >= maxResults) break;
    }
  }

  return [...seen.values()].slice(0, maxResults);
}

export async function enrichPlaceWithWebsiteEmail(
  place: GoogleMapsPlaceResult
): Promise<GoogleMapsPlaceResult> {
  if (!place.siteWeb || place.email) return place;

  const analysis = await analyzeWebsite(place.siteWeb);
  if (analysis?.emails[0]) {
    return { ...place, email: analysis.emails[0] };
  }
  return place;
}

export async function enrichPlacesWithEmails(
  places: GoogleMapsPlaceResult[],
  onProgress?: (current: number, total: number) => void
): Promise<GoogleMapsPlaceResult[]> {
  const enriched: GoogleMapsPlaceResult[] = [];

  for (let i = 0; i < places.length; i++) {
    onProgress?.(i + 1, places.length);
    const place = places[i];
    if (place.siteWeb && !place.email) {
      enriched.push(await enrichPlaceWithWebsiteEmail(place));
    } else {
      enriched.push(place);
    }
  }

  return enriched;
}

const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
].join(",");

export interface GooglePlaceRaw {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

interface TextSearchResponse {
  places?: GooglePlaceRaw[];
  nextPageToken?: string;
}

export function getGoogleMapsApiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY manquante — ajoutez-la dans .env.local"
    );
  }
  return key;
}

export async function searchPlacesText(
  textQuery: string,
  options?: { maxResults?: number; pageToken?: string }
): Promise<TextSearchResponse> {
  const apiKey = getGoogleMapsApiKey();

  const body: Record<string, unknown> = {
    textQuery,
    languageCode: "fr",
    regionCode: "FR",
    pageSize: Math.min(options?.maxResults ?? 20, 20),
  };

  if (options?.pageToken) {
    body.pageToken = options.pageToken;
  }

  const response = await fetch(PLACES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google Places API erreur ${response.status}: ${errorText.slice(0, 200)}`
    );
  }

  return response.json() as Promise<TextSearchResponse>;
}

export function parseCityFromAddress(address: string | undefined): string | null {
  if (!address) return null;
  const frenchMatch = address.match(/\b(\d{5})\s+([^,]+)/);
  if (frenchMatch?.[2]) return frenchMatch[2].trim();
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2] ?? null;
  return null;
}

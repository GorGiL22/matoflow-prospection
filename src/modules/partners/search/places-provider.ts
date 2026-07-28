import {
  parseCityFromAddress,
  searchPlacesText,
} from "@/lib/google-places";
import type { PartnerSearchCandidate, PartnerType } from "@/types/partner";
import {
  buildSearchQueries,
  type PartnerSearchProvider,
} from "@/modules/partners/search/types";

const PLACES_FRIENDLY_TYPES: PartnerType[] = [
  "pepiniere",
  "fournisseur",
  "revendeur",
  "distributeur",
  "centre_formation",
  "consultant",
  "autre",
];

export class GooglePlacesPartnerProvider implements PartnerSearchProvider {
  readonly name = "places";

  supports(type: PartnerType): boolean {
    return PLACES_FRIENDLY_TYPES.includes(type);
  }

  async search(input: {
    zone: string;
    type: PartnerType;
    limit: number;
  }): Promise<PartnerSearchCandidate[]> {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return [];
    }

    const query = buildSearchQueries(input.zone, input.type)[0];
    const response = await searchPlacesText(query, {
      maxResults: Math.min(input.limit, 20),
    });

    return (response.places ?? []).map((place) => {
      const name = place.displayName?.text?.trim() || "Sans nom";
      const address = place.formattedAddress ?? null;
      return {
        nom: name,
        entreprise: name,
        type: input.type,
        siteWeb: place.websiteUri ?? null,
        telephone:
          place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
        adresse: address,
        description: address
          ? `${parseCityFromAddress(address) ?? ""}`.trim() || null
          : null,
        source: "places" as const,
        sourceUrl: place.googleMapsUri ?? null,
      };
    });
  }
}

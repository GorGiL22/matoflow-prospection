/**
 * Module Scraping — recherche Google Maps
 */

export type {
  GoogleMapsPlaceResult,
  GoogleMapsSearchConfig,
} from "./google-maps";
export {
  enrichPlacesWithEmails,
  searchLandscapersOnGoogleMaps,
} from "./google-maps";

export type { UnepCompanyResult, UnepSearchConfig } from "./unep";
export {
  searchUnepLandscapersInArea,
  searchUnepLandscapersInLyon,
  searchUnepLandscapersInParis,
} from "./unep";
export type { UnepSearchArea } from "./unep-areas";

export interface ScrapingConfig {
  query: string;
  city: string;
  maxResults: number;
}

export interface ScrapingResult {
  companyName: string;
  phone?: string;
  website?: string;
  city?: string;
  googleReviewsCount?: number;
}

/**
 * Module Scraping — V2
 * Recherche automatisée de prospects via Google Maps, annuaires, etc.
 */

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

export class ScrapingModule {
  async search(_config: ScrapingConfig): Promise<ScrapingResult[]> {
    throw new Error("Module scraping non implémenté — prévu en V2");
  }
}

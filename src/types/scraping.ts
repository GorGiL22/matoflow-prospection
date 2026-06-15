export interface GoogleMapsPlaceResult {
  placeId: string;
  nomEntreprise: string;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  ville: string | null;
  adresse: string | null;
  avisGoogle: number;
  noteGoogle: number | null;
  googleMapsUrl: string | null;
}

export interface UnepCompanyResult {
  unepId: string;
  nomEntreprise: string;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  ville: string | null;
  adresse: string | null;
  codePostal: string | null;
  activites: string[];
  unepUrl: string;
}

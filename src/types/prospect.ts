export const PROSPECT_STATUSES = [
  "nouveau",
  "contacte",
  "relance",
  "rdv",
  "client",
  "refuse",
] as const;

export const PROSPECT_SOURCES = [
  "manuel",
  "google_maps",
  "scraping",
  "import_csv",
  "api",
  "linkedin",
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];
export type ProspectSource = (typeof PROSPECT_SOURCES)[number];

export interface AiScoreDetails {
  is_landscaping_company?: boolean;
  has_maintenance_contracts?: boolean;
  estimated_company_size?: "petite" | "moyenne" | "grande";
  has_teams?: boolean;
  needs_quoting_planning_billing?: boolean;
  keywords_found?: string[];
  services_detected?: string[];
  reasoning?: string;
}

export interface Prospect {
  id: string;
  company_name: string;
  siret: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  google_reviews_count: number;
  status: ProspectStatus;
  source: ProspectSource;
  ai_score: number | null;
  ai_score_details: AiScoreDetails;
  website_domain: string | null;
  email_normalized: string | null;
  siret_normalized: string | null;
  generated_email: string | null;
  generated_linkedin: string | null;
  generated_call_script: string | null;
  content_generated_at: string | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
}

export interface ProspectInsert {
  company_name: string;
  siret?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  city?: string | null;
  google_reviews_count?: number;
  source?: ProspectSource;
  status?: ProspectStatus;
  ai_score?: number | null;
  ai_score_details?: AiScoreDetails;
}

export interface ProspectUpdate extends Partial<ProspectInsert> {
  status?: ProspectStatus;
  generated_email?: string | null;
  generated_linkedin?: string | null;
  generated_call_script?: string | null;
  last_contacted_at?: string | null;
}

export interface ProspectQualification {
  id: string;
  prospect_id: string;
  score: number;
  criteria: AiScoreDetails;
  website_analysis: Record<string, unknown>;
  model_version: string;
  created_at: string;
}

export interface GeneratedContent {
  email: string;
  linkedin: string;
  callScript: string;
}

export interface DashboardStats {
  total_prospects: number;
  nouveaux: number;
  contactes: number;
  relances: number;
  rdv: number;
  clients: number;
  refuses: number;
  prioritaires: number;
  score_moyen: number | null;
}

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  relance: "Relancé",
  rdv: "RDV",
  client: "Client",
  refuse: "Refusé",
};

export const SOURCE_LABELS: Record<ProspectSource, string> = {
  manuel: "Manuel",
  google_maps: "Google Maps",
  scraping: "Scraping",
  import_csv: "Import CSV",
  api: "API",
  linkedin: "LinkedIn",
};

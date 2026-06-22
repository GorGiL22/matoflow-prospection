export const PROSPECT_STATUSES = [
  "nouveau",
  "contacte",
  "relance",
  "interesse",
  "chaud",
  "rdv",
  "client",
  "refuse",
] as const;

export const PIPELINE_STATUSES = PROSPECT_STATUSES;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

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
  nomEntreprise: string;
  siret: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  ville: string | null;
  description: string | null;
  avisGoogle: number;
  scoreIA: number | null;
  statut: ProspectStatus;
  dateCreation: string;
  dateModification: string;
  siretNormalise: string | null;
  emailNormalise: string | null;
  domaineSite: string | null;
  detailsScoreIA: AiScoreDetails;
  emailGenere: string | null;
  linkedinGenere: string | null;
  scriptAppelGenere: string | null;
  commentaireCommercial: string | null;
}

export interface ProspectInsert {
  nomEntreprise: string;
  siret?: string | null;
  telephone?: string | null;
  email?: string | null;
  siteWeb?: string | null;
  ville?: string | null;
  description?: string | null;
  unepId?: string | null;
  unepSlug?: string | null;
  avisGoogle?: number;
  scoreIA?: number | null;
  statut?: ProspectStatus;
  detailsScoreIA?: AiScoreDetails;
}

export interface ProspectUpdate extends Partial<ProspectInsert> {
  statut?: ProspectStatus;
  emailGenere?: string | null;
  linkedinGenere?: string | null;
  scriptAppelGenere?: string | null;
  commentaireCommercial?: string | null;
}

export interface ProspectNote {
  id: string;
  prospectId: string;
  contenu: string;
  dateCreation: string;
}

export interface ProspectActivity {
  id: string;
  prospectId: string;
  type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  dateCreation: string;
}

export interface ProspectQualification {
  id: string;
  prospectId: string;
  score: number;
  criteres: AiScoreDetails;
  analyseSite: Record<string, unknown> | null;
  versionModele: string;
  dateCreation: string;
}

export interface GeneratedContent {
  email: string;
  linkedin: string;
  callScript: string;
}

export interface DashboardStats {
  totalProspects: number;
  nouveaux: number;
  clients: number;
  tauxConversion: number;
  contactes: number;
  relances: number;
  rdv: number;
  refuses: number;
  prioritaires: number;
  scoreMoyen: number | null;
}

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  nouveau: "À contacter",
  contacte: "Contacté",
  relance: "Relancé",
  interesse: "Intéressé",
  chaud: "Prospect chaud",
  rdv: "RDV",
  client: "Client",
  refuse: "Refusé",
};

export const STATUS_SHORT_LABELS: Record<ProspectStatus, string> = {
  nouveau: "À contacter",
  contacte: "Contacté",
  relance: "Relancé",
  interesse: "Intéressé",
  chaud: "Chaud",
  rdv: "RDV",
  client: "Client",
  refuse: "Refusé",
};

export const STATUS_ACTIVE_CLASSES: Record<ProspectStatus, string> = {
  nouveau: "bg-slate-600 text-white",
  contacte: "bg-blue-600 text-white",
  relance: "bg-amber-600 text-white",
  interesse: "bg-violet-600 text-white",
  chaud: "bg-orange-600 text-white",
  rdv: "bg-emerald-600 text-white",
  client: "bg-green-700 text-white",
  refuse: "bg-red-600 text-white",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  creation: "Création",
  mise_a_jour: "Mise à jour",
  changement_statut: "Changement de statut",
  qualification: "Qualification IA",
  contenu: "Contenu généré",
  note: "Note ajoutée",
  campagne_email: "Campagne email",
};

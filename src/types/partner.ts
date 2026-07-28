export const PARTNER_TYPES = [
  "cooperative",
  "cabinet_comptable",
  "consultant",
  "revendeur",
  "distributeur",
  "pepiniere",
  "fournisseur",
  "organisme_sap",
  "centre_formation",
  "federation",
  "reseau_pro",
  "autre",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_TYPE_LABELS: Record<PartnerType, string> = {
  cooperative: "Coopérative",
  cabinet_comptable: "Cabinet comptable",
  consultant: "Consultant",
  revendeur: "Revendeur",
  distributeur: "Distributeur",
  pepiniere: "Pépinière",
  fournisseur: "Fournisseur",
  organisme_sap: "Organisme SAP",
  centre_formation: "Centre de formation",
  federation: "Fédération",
  reseau_pro: "Réseau professionnel",
  autre: "Autre",
};

export const PARTNER_STATUSES = [
  "decouvert",
  "a_contacter",
  "premier_contact",
  "rendez_vous",
  "en_discussion",
  "partenariat_signe",
  "refus",
  "suspendu",
] as const;

export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  decouvert: "Découvert",
  a_contacter: "À contacter",
  premier_contact: "Premier contact",
  rendez_vous: "Rendez-vous",
  en_discussion: "En discussion",
  partenariat_signe: "Partenariat signé",
  refus: "Refus",
  suspendu: "Suspendu",
};

export const PARTNERSHIP_KINDS = [
  "apporteur_affaires",
  "revendeur",
  "integration_api",
  "strategique",
  "offre_adherents",
  "co_marketing",
] as const;

export type PartnershipKind = (typeof PARTNERSHIP_KINDS)[number];

export const PARTNERSHIP_KIND_LABELS: Record<PartnershipKind, string> = {
  apporteur_affaires: "Apporteur d'affaires",
  revendeur: "Revendeur",
  integration_api: "Intégration API",
  strategique: "Partenariat stratégique",
  offre_adherents: "Offre adhérents",
  co_marketing: "Co-marketing",
};

export interface PartnerAnalysis {
  whyInteresting: string;
  mutualBenefits: string;
  matoflowModules: string[];
  recommendedPartnership: PartnershipKind;
  scoreBreakdown: {
    taille: number;
    visibilite: number;
    potentielCommercial: number;
    coherence: number;
    complementarite: number;
    influence: number;
  };
  reasoning: string;
}

export interface Partner {
  id: string;
  nom: string;
  entreprise: string;
  type: PartnerType;
  siteWeb: string | null;
  linkedinEntreprise: string | null;
  linkedinDirigeant: string | null;
  nomDirigeant: string | null;
  fonctionDirigeant: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  zone: string | null;
  departementsCouverture: string | null;
  tailleEstimee: string | null;
  description: string | null;
  servicesProposes: string | null;
  hasApi: boolean | null;
  scoreEtoiles: number | null;
  analyseIA: PartnerAnalysis | null;
  partnershipKind: PartnershipKind | null;
  statut: PartnerStatus;
  sourceRecherche: string | null;
  domaineNormalise: string | null;
  nomNormalise: string | null;
  dateCreation: string;
  dateModification: string;
}

export interface PartnerNote {
  id: string;
  partnerId: string;
  contenu: string;
  dateCreation: string;
}

export interface PartnerActivite {
  id: string;
  partnerId: string;
  type: string;
  description: string;
  metadata: string | null;
  dateCreation: string;
}

export interface PartnerOutreachDraft {
  id: string;
  partnerId: string;
  emailSubject: string | null;
  emailBody: string | null;
  linkedinMessage: string | null;
  arguments: string | null;
  questionsRdv: string | null;
  objections: string | null;
  dateCreation: string;
  dateModification: string;
}

export interface PartnerDetail extends Partner {
  notes: PartnerNote[];
  activites: PartnerActivite[];
  drafts: PartnerOutreachDraft[];
}

export interface PartnerDashboardStats {
  total: number;
  actifs: number;
  rendezVous: number;
  partenariats: number;
  clientsGeneres: number;
  mrrGenere: number;
  commissionsVersees: number;
  valeurTotale: number;
  parStatut: Record<PartnerStatus, number>;
  parType: Partial<Record<PartnerType, number>>;
}

export interface PartnerSearchCandidate {
  nom: string;
  entreprise: string;
  type: PartnerType;
  siteWeb?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  description?: string | null;
  source: "web" | "places";
  sourceUrl?: string | null;
}

export type PartnerSearchJobStatus =
  | "running"
  | "completed"
  | "error"
  | "cancelled";

export interface PartnerSearchJobProgress {
  processed: number;
  total: number;
  message?: string;
}

export interface PartnerSearchJobSnapshot {
  id: string;
  zone: string;
  types: PartnerType[];
  status: PartnerSearchJobStatus;
  config: { limit: number; enrich: boolean; score: boolean };
  results: Array<{ partnerId: string; nom: string; type: PartnerType }>;
  logs: Array<{ at: string; level: "info" | "warn" | "error"; message: string }>;
  progress: PartnerSearchJobProgress | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function scoreEtoilesLabel(score: number | null | undefined): string {
  if (!score || score < 1) return "Non noté";
  const clamped = Math.min(5, Math.max(1, Math.round(score)));
  const labels = [
    "",
    "Très faible",
    "Faible",
    "Intéressant",
    "Très intéressant",
    "Priorité maximale",
  ];
  return `${"★".repeat(clamped)}${"☆".repeat(5 - clamped)} ${labels[clamped]}`;
}

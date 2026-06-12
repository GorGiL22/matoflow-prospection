export const APP_NAME = "MatoFlow Prospection";

export const AI_CONFIG = {
  model: "gpt-4o-mini",
  qualificationTemperature: 0.3,
  contentTemperature: 0.7,
} as const;

export const SCORING_WEIGHTS = {
  is_landscaping_company: 30,
  has_maintenance_contracts: 25,
  estimated_company_size: 15,
  has_teams: 15,
  needs_quoting_planning_billing: 15,
} as const;

export const PRIORITY_SCORE_THRESHOLD = 70;

export const MATOFLOW_VALUE_PROPS = [
  "Devis et facturation simplifiés",
  "Planning des interventions et des équipes",
  "Gestion des contrats d'entretien récurrents",
  "Suivi client et historique des chantiers",
  "Application mobile pour les équipes terrain",
] as const;

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

/** 0 = sans limite (toute la région). Plafond par lot sinon. */
export const UNEP_MAX_RESULTS_PER_RUN = 500;

export const CAMPAIGN_DEFAULTS = {
  dailyLimit: 25,
  minDelayMinutes: 5,
  maxDelayMinutes: 15,
  maxWords: 120,
} as const;

export const CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS = {
  subject: "MatoFlow pour {nomEntreprise}",
  body: `Bonjour,

Je me permets de vous contacter au sujet de {nomEntreprise}.

Chez MatoFlow, nous aidons les entreprises du paysage à simplifier leurs devis, le planning des équipes et le suivi des contrats d'entretien.

Si vous êtes ouvert à échanger 15 minutes, je peux vous montrer comment d'autres paysagistes organisent leurs interventions au quotidien.

Découvrir MatoFlow : https://matoflow.fr

Bonne journée,
Mathis — MatoFlow`,
} as const;

export const CAMPAIGN_TEMPLATE_PLACEHOLDERS = [
  "{nomEntreprise}",
  "{ville}",
] as const;

export const MATOFLOW_VALUE_PROPS = [
  "Devis et facturation simplifiés",
  "Planning des interventions et des équipes",
  "Gestion des contrats d'entretien récurrents",
  "Suivi client et historique des chantiers",
  "Application mobile pour les équipes terrain",
] as const;

export const MATOFLOW_WEBSITE_URL = "https://matoflow.fr";

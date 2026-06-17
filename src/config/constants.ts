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

/** Fiches UNEP téléchargées en parallèle (10 = ~2× plus rapide, qualité identique). */
export const UNEP_ENRICH_CONCURRENCY = 10;

/** Pause entre chaque lot de téléchargements UNEP (ms). */
export const UNEP_ENRICH_CHUNK_DELAY_MS = 30;

/** Sites web analysés en parallèle (Google Maps). */
export const GOOGLE_MAPS_ENRICH_CONCURRENCY = 5;

export const CAMPAIGN_DEFAULTS = {
  dailyLimit: 25,
  minDelayMinutes: 5,
  maxDelayMinutes: 15,
  maxWords: 120,
} as const;

/** Liste d'appels créée automatiquement quand un email de campagne rebondit. */
export const BOUNCED_EMAILS_PHONE_LIST_NAME = "Emails rebondis — à appeler";

export const CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS = {
  subject: "Question sur vos devis et planning — {nomEntreprise}",
  body: `Bonjour,

Je travaille également dans le secteur du paysage et je me posais une question.

Aujourd'hui, comment gérez-vous vos devis, vos contrats d'entretien et le planning de vos équipes ?

J'ai développé MatoFlow après avoir constaté que beaucoup d'entreprises jonglaient entre Excel, papier, WhatsApp et plusieurs outils différents.

Je ne sais pas si c'est votre cas, mais si le sujet vous parle, je serais ravi d'échanger 15 minutes avec vous pour avoir votre retour et vous montrer comment d'autres entreprises du paysage s'organisent.

Bien cordialement,

Mathis Magnard
Fondateur de MatoFlow
https://matoflow.fr`,
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

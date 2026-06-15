export const ANALYSIS_STEPS = [
  "recherche",
  "analyse_site",
  "qualification",
  "score",
  "email",
  "linkedin",
  "sauvegarde",
] as const;

export type AnalysisStep = (typeof ANALYSIS_STEPS)[number];

export const ANALYSIS_STEP_LABELS: Record<AnalysisStep, string> = {
  recherche: "Recherche du prospect",
  analyse_site: "Analyse du site",
  qualification: "Qualification IA",
  score: "Attribution du score",
  email: "Génération de l'email",
  linkedin: "Génération du message LinkedIn",
  sauvegarde: "Sauvegarde SQLite",
};

export interface AnalysisLogEvent {
  type: "log";
  step: AnalysisStep;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
}

export interface AnalysisStepEvent {
  type: "step";
  step: AnalysisStep;
  status: "start" | "complete" | "error";
}

export interface AnalysisProspectEvent {
  type: "prospect";
  prospect: AnalysisProspectRow;
}

export interface AnalysisCompleteEvent {
  type: "complete";
  prospectId: string;
}

export interface AnalysisErrorEvent {
  type: "error";
  message: string;
}

export type AnalysisStreamEvent =
  | AnalysisLogEvent
  | AnalysisStepEvent
  | AnalysisProspectEvent
  | AnalysisCompleteEvent
  | AnalysisErrorEvent;

export interface AnalysisProspectRow {
  id: string;
  nomEntreprise: string;
  telephone: string | null;
  siteWeb: string | null;
  ville: string | null;
  avisGoogle: number;
  scoreIA: number | null;
  emailGenere: string | null;
  linkedinGenere: string | null;
  statut: string;
  stepReached: number;
  isComplete: boolean;
}

export function createLogEvent(
  step: AnalysisStep,
  message: string,
  level: AnalysisLogEvent["level"] = "info"
): AnalysisLogEvent {
  return {
    type: "log",
    step,
    message,
    level,
    timestamp: new Date().toISOString(),
  };
}

export function createStepEvent(
  step: AnalysisStep,
  status: AnalysisStepEvent["status"]
): AnalysisStepEvent {
  return { type: "step", step, status };
}

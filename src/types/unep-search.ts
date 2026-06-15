export const UNEP_SEARCH_STEPS = [
  "initialisation",
  "liste_region",
  "enrichissement",
  "filtrage",
  "termine",
] as const;

export type UnepSearchStep = (typeof UNEP_SEARCH_STEPS)[number];

export const UNEP_SEARCH_STEP_LABELS: Record<UnepSearchStep, string> = {
  initialisation: "Connexion UNEP",
  liste_region: "Liste région",
  enrichissement: "Lecture des fiches",
  filtrage: "Filtrage zone",
  termine: "Résultats",
};

export interface UnepSearchLogEvent {
  type: "log";
  step: UnepSearchStep;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
}

export interface UnepSearchStepEvent {
  type: "step";
  step: UnepSearchStep;
  status: "start" | "complete" | "error";
}

export interface UnepSearchCompanyEvent {
  type: "company";
  company: {
    unepId: string;
    nomEntreprise: string;
    ville: string | null;
    codePostal: string | null;
    email: string | null;
  };
}

import type { UnepCompanyResult } from "@/types/scraping";

export interface UnepSearchResultsEvent {
  type: "results";
  results: UnepCompanyResult[];
}

export interface UnepSearchCompleteEvent {
  type: "complete";
  resultsCount: number;
  resume?: {
    nextPage: number;
    totalPages: number;
    exhausted: boolean;
  };
}

export interface UnepSearchProgressEvent {
  type: "progress";
  page: number;
  totalPages: number;
  matchesFound: number;
  scanned: number;
  skipped: number;
  nextPage: number;
  exhausted: boolean;
}

export interface UnepSearchErrorEvent {
  type: "error";
  message: string;
}

export type UnepSearchStreamEvent =
  | UnepSearchLogEvent
  | UnepSearchStepEvent
  | UnepSearchCompanyEvent
  | UnepSearchResultsEvent
  | UnepSearchCompleteEvent
  | UnepSearchProgressEvent
  | UnepSearchErrorEvent;

export function createUnepLogEvent(
  step: UnepSearchStep,
  message: string,
  level: UnepSearchLogEvent["level"] = "info"
): UnepSearchLogEvent {
  return {
    type: "log",
    step,
    message,
    level,
    timestamp: new Date().toISOString(),
  };
}

export function createUnepStepEvent(
  step: UnepSearchStep,
  status: UnepSearchStepEvent["status"]
): UnepSearchStepEvent {
  return { type: "step", step, status };
}

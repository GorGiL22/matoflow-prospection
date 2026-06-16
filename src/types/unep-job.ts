import type { UnepSearchArea } from "@/modules/scraping/unep-areas";
import type { UnepCompanyResult } from "@/types/scraping";
import type {
  UnepSearchLogEvent,
  UnepSearchStep,
} from "@/types/unep-search";

export type UnepSearchJobStatus =
  | "running"
  | "stopped"
  | "completed"
  | "error";

export interface UnepSearchJobConfig {
  maxResults: number;
  startPage: number;
  includeMetropole: boolean;
  excludeExisting: boolean;
  autoChain?: boolean;
}

export interface UnepSearchJobProgress {
  page: number;
  totalPages: number;
  matchesFound: number;
  scanned: number;
  skipped: number;
  nextPage: number;
  exhausted: boolean;
}

export interface UnepSearchJobResume {
  nextPage: number;
  totalPages: number;
  exhausted: boolean;
}

export interface UnepSearchJobStepsState {
  activeStep: UnepSearchStep | null;
  completedSteps: UnepSearchStep[];
  errorStep: UnepSearchStep | null;
}

export interface UnepSearchJobSnapshot {
  id: string;
  area: UnepSearchArea;
  status: UnepSearchJobStatus;
  config: UnepSearchJobConfig;
  results: UnepCompanyResult[];
  logs: UnepSearchLogEvent[];
  progress: UnepSearchJobProgress | null;
  stepsState: UnepSearchJobStepsState;
  errorMessage: string | null;
  resume: UnepSearchJobResume | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnepSearchJobInput {
  area: UnepSearchArea;
  maxResults: number;
  startPage: number;
  includeMetropole: boolean;
  excludeExisting: boolean;
  autoChain?: boolean;
}

export const ACTIVE_UNEP_JOB_STORAGE_KEY = "matoflow-unep-active-job-id";
export const UNEP_AUTO_CHAIN_STORAGE_KEY = "matoflow-unep-auto-chain";

export interface UnepAreaScanSummary {
  area: UnepSearchArea;
  isRunning: boolean;
  hasBeenScanned: boolean;
  lastStatus: UnepSearchJobStatus | null;
  lastUpdatedAt: string | null;
  importedCount: number;
  isFullyScanned: boolean;
  canResume: boolean;
  resumeFromPage: number | null;
  totalPages: number | null;
}

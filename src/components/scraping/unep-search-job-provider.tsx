"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearUnepScanCursor,
  saveUnepScanCursor,
} from "@/lib/unep-scan-cursor";
import type { UnepSearchArea } from "@/modules/scraping/unep-areas";
import type {
  CreateUnepSearchJobInput,
  UnepSearchJobSnapshot,
} from "@/types/unep-job";
import {
  ACTIVE_UNEP_JOB_STORAGE_KEY,
  UNEP_AUTO_CHAIN_STORAGE_KEY,
} from "@/types/unep-job";

interface UnepSearchJobContextValue {
  job: UnepSearchJobSnapshot | null;
  isRunning: boolean;
  autoChain: boolean;
  isChaining: boolean;
  startJob: (input: CreateUnepSearchJobInput) => Promise<void>;
  stopJob: () => Promise<void>;
  refreshJob: () => Promise<void>;
  setAutoChain: (enabled: boolean) => void;
}

const UnepSearchJobContext = createContext<UnepSearchJobContextValue | null>(
  null
);

function readAutoChainPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(UNEP_AUTO_CHAIN_STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

async function fetchJob(id: string): Promise<UnepSearchJobSnapshot | null> {
  const response = await fetch(`/api/unep/search/jobs/${id}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { job: UnepSearchJobSnapshot };
  return data.job;
}

function syncScanCursor(job: UnepSearchJobSnapshot) {
  if (!job.resume || job.resume.exhausted) {
    clearUnepScanCursor(job.area);
    return;
  }

  saveUnepScanCursor(job.area, {
    nextPage: job.resume.nextPage,
    totalPages: job.resume.totalPages,
  });
}

export function UnepSearchJobProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [job, setJob] = useState<UnepSearchJobSnapshot | null>(null);
  const [trackedJobId, setTrackedJobId] = useState<string | null>(null);
  const [autoChain, setAutoChainState] = useState(true);
  const [isChaining, setIsChaining] = useState(false);
  const prevStatusRef = useRef<string | null>(null);
  const chainedJobIdsRef = useRef<Set<string>>(new Set());
  const chainAbortRef = useRef(false);
  const startJobRef = useRef<
    ((input: CreateUnepSearchJobInput) => Promise<void>) | null
  >(null);

  useEffect(() => {
    setAutoChainState(readAutoChainPreference());
  }, []);

  const setAutoChain = useCallback((enabled: boolean) => {
    localStorage.setItem(UNEP_AUTO_CHAIN_STORAGE_KEY, String(enabled));
    setAutoChainState(enabled);
  }, []);

  const refreshJob = useCallback(async () => {
    if (!trackedJobId) return;

    const next = await fetchJob(trackedJobId);
    if (!next) {
      localStorage.removeItem(ACTIVE_UNEP_JOB_STORAGE_KEY);
      setTrackedJobId(null);
      setJob(null);
      return;
    }

    setJob(next);
    syncScanCursor(next);

    if (next.status !== "running") {
      localStorage.removeItem(ACTIVE_UNEP_JOB_STORAGE_KEY);
    }
  }, [trackedJobId]);

  useEffect(() => {
    const storedId = localStorage.getItem(ACTIVE_UNEP_JOB_STORAGE_KEY);
    if (!storedId) return;

    setTrackedJobId(storedId);
    void fetchJob(storedId).then((loaded) => {
      if (loaded) {
        setJob(loaded);
        prevStatusRef.current = loaded.status;
      }
    });
  }, []);

  useEffect(() => {
    if (!trackedJobId || job?.status !== "running") return;

    const interval = setInterval(() => {
      void refreshJob();
    }, 1000);

    return () => clearInterval(interval);
  }, [trackedJobId, job?.status, refreshJob]);

  const startJob = useCallback(async (input: CreateUnepSearchJobInput) => {
    chainAbortRef.current = false;

    const response = await fetch("/api/unep/search/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const data = (await response.json()) as {
      job?: UnepSearchJobSnapshot;
      error?: string;
    };

    if (!response.ok || !data.job) {
      throw new Error(data.error ?? "Impossible de démarrer la recherche UNEP");
    }

    localStorage.setItem(ACTIVE_UNEP_JOB_STORAGE_KEY, data.job.id);
    setTrackedJobId(data.job.id);
    setJob(data.job);
    prevStatusRef.current = data.job.status;
  }, []);

  startJobRef.current = startJob;

  const chainToNextArea = useCallback(async (_finishedArea: UnepSearchArea) => {
    if (chainAbortRef.current || !readAutoChainPreference()) return;

    setIsChaining(true);
    try {
      if (chainAbortRef.current) return;

      const activeResponse = await fetch("/api/unep/search/jobs/active");
      const activeData = (await activeResponse.json()) as {
        job: UnepSearchJobSnapshot | null;
      };
      if (activeData.job?.status === "running") return;

      if (chainAbortRef.current) return;

      const nextResponse = await fetch("/api/unep/search/jobs/next");
      const nextData = (await nextResponse.json()) as {
        input: CreateUnepSearchJobInput | null;
      };

      if (!nextData.input || !startJobRef.current || chainAbortRef.current) {
        return;
      }

      await startJobRef.current(nextData.input);
    } catch {
      // L'enchaînement automatique ne doit pas bloquer l'interface.
    } finally {
      setIsChaining(false);
    }
  }, []);

  useEffect(() => {
    if (!job) {
      prevStatusRef.current = null;
      return;
    }

    const wasRunning = prevStatusRef.current === "running";
    const justCompleted = job.status === "completed";

    if (
      wasRunning &&
      justCompleted &&
      autoChain &&
      !chainedJobIdsRef.current.has(job.id)
    ) {
      chainedJobIdsRef.current.add(job.id);
      void chainToNextArea(job.area);
    }

    prevStatusRef.current = job.status;
  }, [job, autoChain, chainToNextArea]);

  const stopJob = useCallback(async () => {
    chainAbortRef.current = true;
    setIsChaining(false);
    setAutoChain(false);
    localStorage.setItem(UNEP_AUTO_CHAIN_STORAGE_KEY, "false");

    const response = await fetch("/api/unep/search/jobs/stop-active", {
      method: "POST",
    });

    const data = (await response.json()) as {
      jobs?: UnepSearchJobSnapshot[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(data.error ?? "Impossible d'arrêter la recherche");
    }

    const stoppedJobs = data.jobs ?? [];
    const latest =
      stoppedJobs[0] ??
      (trackedJobId ? await fetchJob(trackedJobId) : null) ??
      (await (async () => {
        const activeRes = await fetch("/api/unep/search/jobs/active");
        const activeData = (await activeRes.json()) as {
          job: UnepSearchJobSnapshot | null;
        };
        return activeData.job;
      })());

    if (latest) {
      setJob(latest);
      prevStatusRef.current = latest.status;
      syncScanCursor(latest);
    } else {
      localStorage.removeItem(ACTIVE_UNEP_JOB_STORAGE_KEY);
      setTrackedJobId(null);
      setJob(null);
      prevStatusRef.current = null;
    }

    if (trackedJobId) {
      const pollUntilStopped = async (attempt = 0) => {
        if (attempt > 30) return;
        const jobState = await fetchJob(trackedJobId);
        if (jobState?.status === "running") {
          setTimeout(() => void pollUntilStopped(attempt + 1), 1000);
        } else if (jobState) {
          setJob(jobState);
          prevStatusRef.current = jobState.status;
          syncScanCursor(jobState);
          localStorage.removeItem(ACTIVE_UNEP_JOB_STORAGE_KEY);
        }
      };
      await pollUntilStopped();
    }
  }, [trackedJobId, setAutoChain]);

  const value = useMemo(
    () => ({
      job,
      isRunning: job?.status === "running",
      autoChain,
      isChaining,
      startJob,
      stopJob,
      refreshJob,
      setAutoChain,
    }),
    [job, autoChain, isChaining, startJob, stopJob, refreshJob, setAutoChain]
  );

  return (
    <UnepSearchJobContext.Provider value={value}>
      {children}
    </UnepSearchJobContext.Provider>
  );
}

export function useUnepSearchJob() {
  const context = useContext(UnepSearchJobContext);
  if (!context) {
    throw new Error("useUnepSearchJob must be used within UnepSearchJobProvider");
  }
  return context;
}

export function useUnepSearchJobForArea(area: UnepSearchArea) {
  const context = useUnepSearchJob();
  const areaJob =
    context.job?.area === area ? context.job : null;

  return {
    ...context,
    areaJob,
    isRunningForArea:
      context.job?.status === "running" && context.job.area === area,
    hasFinishedResultsForArea:
      areaJob !== null &&
      areaJob.status !== "running" &&
      areaJob.results.length > 0,
  };
}

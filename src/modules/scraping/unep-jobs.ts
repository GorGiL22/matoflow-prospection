import { prisma } from "@/lib/prisma";
import {
  searchUnepLandscapersInArea,
  type UnepSearchConfig,
} from "@/modules/scraping/unep";
import type { UnepSearchArea } from "@/modules/scraping/unep-areas";
import {
  getUnepAreaDefinition,
  UNEP_SEARCH_AREA_IDS,
} from "@/modules/scraping/unep-areas";
import type {
  CreateUnepSearchJobInput,
  UnepAreaScanSummary,
  UnepSearchJobConfig,
  UnepSearchJobProgress,
  UnepSearchJobResume,
  UnepSearchJobSnapshot,
  UnepSearchJobStatus,
  UnepSearchJobStepsState,
} from "@/types/unep-job";
import type { UnepCompanyResult } from "@/types/scraping";
import type {
  UnepSearchLogEvent,
  UnepSearchStreamEvent,
} from "@/types/unep-search";

const stopFlags = new Map<string, { stopRequested: boolean }>();

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function defaultStepsState(): UnepSearchJobStepsState {
  return {
    activeStep: null,
    completedSteps: [],
    errorStep: null,
  };
}

function toSnapshot(record: {
  id: string;
  area: string;
  status: string;
  config: string;
  results: string;
  logs: string;
  progress: string | null;
  stepsState: string;
  errorMessage: string | null;
  resume: string | null;
  createdAt: Date;
  updatedAt: Date;
}): UnepSearchJobSnapshot {
  return {
    id: record.id,
    area: record.area as UnepSearchArea,
    status: record.status as UnepSearchJobStatus,
    config: parseJson<UnepSearchJobConfig>(record.config, {
      maxResults: 50,
      startPage: 1,
      includeMetropole: false,
      excludeExisting: true,
    }),
    results: parseJson<UnepCompanyResult[]>(record.results, []),
    logs: parseJson<UnepSearchLogEvent[]>(record.logs, []),
    progress: parseJson<UnepSearchJobProgress | null>(record.progress, null),
    stepsState: parseJson<UnepSearchJobStepsState>(
      record.stepsState,
      defaultStepsState()
    ),
    errorMessage: record.errorMessage,
    resume: parseJson<UnepSearchJobResume | null>(record.resume, null),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getJobRecord(id: string) {
  return prisma.unepSearchJob.findUnique({ where: { id } });
}

export async function getUnepSearchJob(
  id: string
): Promise<UnepSearchJobSnapshot | null> {
  const record = await getJobRecord(id);
  return record ? toSnapshot(record) : null;
}

export async function getActiveUnepSearchJob(
  area?: UnepSearchArea
): Promise<UnepSearchJobSnapshot | null> {
  const record = await prisma.unepSearchJob.findFirst({
    where: {
      status: "running",
      ...(area ? { area } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return null;

  const staleMs = 2 * 60 * 1000;
  const isStale =
    !stopFlags.has(record.id) &&
    Date.now() - record.updatedAt.getTime() > staleMs;

  if (isStale) {
    await persistJobState(record.id, {
      status: "error",
      errorMessage: "Recherche interrompue (serveur redémarré ou job orphelin).",
    });
    return null;
  }

  return toSnapshot(record);
}

function buildAreaScanSummary(
  area: UnepSearchArea,
  latest: UnepSearchJobSnapshot | null,
  isRunning: boolean
): UnepAreaScanSummary {
  if (!latest) {
    return {
      area,
      isRunning,
      hasBeenScanned: false,
      lastStatus: null,
      lastUpdatedAt: null,
      importedCount: 0,
      isFullyScanned: false,
      canResume: false,
      resumeFromPage: null,
      totalPages: null,
    };
  }

  const resume = latest.resume;
  const canResume = Boolean(resume && !resume.exhausted && resume.nextPage > 1);

  return {
    area,
    isRunning,
    hasBeenScanned: latest !== null,
    lastStatus: latest.status,
    lastUpdatedAt: latest.updatedAt,
    importedCount: latest.results.length,
    isFullyScanned: Boolean(resume?.exhausted),
    canResume,
    resumeFromPage: resume?.nextPage ?? null,
    totalPages: resume?.totalPages ?? latest.progress?.totalPages ?? null,
  };
}

export async function getUnepAreaScanSummaries(): Promise<UnepAreaScanSummary[]> {
  const records = await prisma.unepSearchJob.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const latestByArea = new Map<string, ReturnType<typeof toSnapshot>>();
  const runningByArea = new Set<string>();

  for (const record of records) {
    if (record.status === "running") {
      const staleMs = 2 * 60 * 1000;
      const isStale =
        !stopFlags.has(record.id) &&
        Date.now() - record.updatedAt.getTime() > staleMs;
      if (!isStale) {
        runningByArea.add(record.area);
      }
    }
    if (!latestByArea.has(record.area)) {
      latestByArea.set(record.area, toSnapshot(record));
    }
  }

  return UNEP_SEARCH_AREA_IDS.map((area) =>
    buildAreaScanSummary(
      area,
      latestByArea.get(area) ?? null,
      runningByArea.has(area)
    )
  );
}

export async function buildNextUnepAutoJob(): Promise<{
  input: CreateUnepSearchJobInput;
  areaName: string;
} | null> {
  const summaries = await getUnepAreaScanSummaries();

  for (const area of UNEP_SEARCH_AREA_IDS) {
    const summary = summaries.find((item) => item.area === area);
    if (summary?.isRunning || summary?.isFullyScanned) continue;

    const definition = getUnepAreaDefinition(area);
    const startPage =
      summary?.canResume && summary.resumeFromPage
        ? summary.resumeFromPage
        : 1;

    return {
      areaName: definition.areaName,
      input: {
        area,
        maxResults: 0,
        startPage,
        includeMetropole: definition.includeMetropoleDefault,
        excludeExisting: true,
      },
    };
  }

  return null;
}

export async function getUnepAreaScanSummary(
  area: UnepSearchArea
): Promise<UnepAreaScanSummary> {
  const [running, latestRecord] = await Promise.all([
    getActiveUnepSearchJob(area),
    prisma.unepSearchJob.findFirst({
      where: { area },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const latest = latestRecord ? toSnapshot(latestRecord) : null;

  return buildAreaScanSummary(area, latest, Boolean(running));
}

export async function createUnepSearchJob(
  input: CreateUnepSearchJobInput
): Promise<UnepSearchJobSnapshot> {
  const running = await getActiveUnepSearchJob(input.area);
  if (running) {
    throw new Error(
      "Une recherche UNEP est déjà en cours pour cette zone. Arrêtez-la ou attendez la fin."
    );
  }

  const config: UnepSearchJobConfig = {
    maxResults: input.maxResults,
    startPage: input.startPage,
    includeMetropole: input.includeMetropole,
    excludeExisting: input.excludeExisting,
  };

  const record = await prisma.unepSearchJob.create({
    data: {
      area: input.area,
      status: "running",
      config: JSON.stringify(config),
      results: "[]",
      logs: "[]",
      stepsState: JSON.stringify(defaultStepsState()),
    },
  });

  stopFlags.set(record.id, { stopRequested: false });
  void runUnepSearchJob(record.id);

  return toSnapshot(record);
}

export async function stopUnepSearchJob(
  id: string
): Promise<UnepSearchJobSnapshot | null> {
  const record = await getJobRecord(id);
  if (!record || record.status !== "running") {
    return record ? toSnapshot(record) : null;
  }

  const hadInMemoryRunner = stopFlags.has(id);
  stopFlags.set(id, { stopRequested: true });

  const snapshot = toSnapshot(record);
  snapshot.logs.push({
    type: "log",
    step: "termine",
    message: "Arrêt demandé — finalisation des résultats en cours...",
    level: "warning",
    timestamp: new Date().toISOString(),
  });

  if (!hadInMemoryRunner) {
    await persistJobState(id, {
      status: "stopped",
      logs: snapshot.logs.slice(-500),
      stepsState: {
        ...parseJson(record.stepsState, defaultStepsState()),
        activeStep: null,
      },
    });
    stopFlags.delete(id);
    return getUnepSearchJob(id);
  }

  await persistJobState(id, {
    logs: snapshot.logs.slice(-500),
  });

  return getUnepSearchJob(id);
}

export async function stopAllActiveUnepSearchJobs(): Promise<
  UnepSearchJobSnapshot[]
> {
  const running = await prisma.unepSearchJob.findMany({
    where: { status: "running" },
    select: { id: true },
  });

  const stopped: UnepSearchJobSnapshot[] = [];
  for (const job of running) {
    const snapshot = await stopUnepSearchJob(job.id);
    if (snapshot) stopped.push(snapshot);
  }
  return stopped;
}

async function persistJobState(
  id: string,
  patch: {
    results?: UnepCompanyResult[];
    logs?: UnepSearchLogEvent[];
    progress?: UnepSearchJobProgress | null;
    stepsState?: UnepSearchJobStepsState;
    resume?: UnepSearchJobResume | null;
    status?: UnepSearchJobStatus;
    errorMessage?: string | null;
  }
): Promise<void> {
  await prisma.unepSearchJob.update({
    where: { id },
    data: {
      ...(patch.results !== undefined && {
        results: JSON.stringify(patch.results),
      }),
      ...(patch.logs !== undefined && { logs: JSON.stringify(patch.logs) }),
      ...(patch.progress !== undefined && {
        progress: patch.progress ? JSON.stringify(patch.progress) : null,
      }),
      ...(patch.stepsState !== undefined && {
        stepsState: JSON.stringify(patch.stepsState),
      }),
      ...(patch.resume !== undefined && {
        resume: patch.resume ? JSON.stringify(patch.resume) : null,
      }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.errorMessage !== undefined && {
        errorMessage: patch.errorMessage,
      }),
    },
  });
}

async function handleJobStreamEvent(
  jobId: string,
  state: {
    results: UnepCompanyResult[];
    logs: UnepSearchLogEvent[];
    stepsState: UnepSearchJobStepsState;
    progress: UnepSearchJobProgress | null;
    resume: UnepSearchJobResume | null;
  },
  event: UnepSearchStreamEvent
): Promise<void> {
  switch (event.type) {
    case "log":
      state.logs.push(event);
      break;
    case "step":
      if (event.status === "start") {
        state.stepsState.activeStep = event.step;
      } else if (event.status === "complete") {
        state.stepsState.completedSteps = [
          ...new Set([...state.stepsState.completedSteps, event.step]),
        ];
        state.stepsState.activeStep = null;
      } else if (event.status === "error") {
        state.stepsState.errorStep = event.step;
        state.stepsState.activeStep = null;
      }
      break;
    case "company":
      break;
    case "results":
      state.results = event.results;
      break;
    case "progress":
      state.progress = {
        page: event.page,
        totalPages: event.totalPages,
        matchesFound: event.matchesFound,
        scanned: event.scanned,
        skipped: event.skipped,
        nextPage: event.nextPage,
        exhausted: event.exhausted,
      };
      state.resume = {
        nextPage: event.nextPage,
        totalPages: event.totalPages,
        exhausted: event.exhausted,
      };
      break;
    case "complete":
      if (event.resume) {
        state.resume = event.resume;
      }
      break;
    case "error":
      break;
  }

  await persistJobState(jobId, {
    results: state.results,
    logs: state.logs.slice(-500),
    progress: state.progress,
    stepsState: state.stepsState,
    resume: state.resume,
  });
}

async function runUnepSearchJob(jobId: string): Promise<void> {
  const record = await getJobRecord(jobId);
  if (!record) return;

  const config = parseJson<UnepSearchJobConfig>(record.config, {
    maxResults: 50,
    startPage: 1,
    includeMetropole: false,
    excludeExisting: true,
  });

  const state = {
    results: [] as UnepCompanyResult[],
    logs: [] as UnepSearchLogEvent[],
    stepsState: defaultStepsState(),
    progress: null as UnepSearchJobProgress | null,
    resume: null as UnepSearchJobResume | null,
  };

  const shouldStop = () => stopFlags.get(jobId)?.stopRequested ?? false;

  const searchConfig: UnepSearchConfig = {
    maxResults: config.maxResults,
    startPage: config.startPage,
    includeMetropole: config.includeMetropole,
    excludeExisting: config.excludeExisting,
    shouldStop,
  };

  let finalStatus: UnepSearchJobStatus = "completed";
  let errorMessage: string | null = null;

  try {
    const results = await searchUnepLandscapersInArea(
      record.area as UnepSearchArea,
      searchConfig,
      async (event) => {
        if (event.type === "results") {
          state.results = event.results;
        }
        await handleJobStreamEvent(jobId, state, event);
      }
    );

    state.results = results;

    if (shouldStop()) {
      finalStatus = "stopped";
    }
  } catch (error) {
    finalStatus = "error";
    errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    state.logs.push({
      type: "log",
      step: "termine",
      message: errorMessage,
      level: "error",
      timestamp: new Date().toISOString(),
    });
  } finally {
    const wasStopped = shouldStop();
    stopFlags.delete(jobId);

    const current = await getJobRecord(jobId);
    if (wasStopped) {
      finalStatus = "stopped";
    }

    await persistJobState(jobId, {
      results: state.results,
      logs: state.logs.slice(-500),
      progress: state.progress,
      stepsState: {
        ...state.stepsState,
        activeStep: null,
      },
      resume: state.resume,
      status: finalStatus,
      errorMessage,
    });
  }
}

import { prisma } from "@/lib/prisma";
import { runPartnerSearch } from "@/modules/partners/search/orchestrator";
import { scorePartner } from "@/modules/partners/scoring/analyzer";
import type {
  PartnerSearchJobSnapshot,
  PartnerSearchJobStatus,
  PartnerType,
} from "@/types/partner";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toSnapshot(record: {
  id: string;
  zone: string;
  types: string;
  status: string;
  config: string;
  results: string;
  logs: string;
  progress: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PartnerSearchJobSnapshot {
  return {
    id: record.id,
    zone: record.zone,
    types: parseJson<PartnerType[]>(record.types, []),
    status: record.status as PartnerSearchJobStatus,
    config: parseJson(record.config, {
      limit: 8,
      enrich: true,
      score: true,
    }),
    results: parseJson(record.results, []),
    logs: parseJson(record.logs, []),
    progress: parseJson(record.progress, null),
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function appendLog(
  id: string,
  level: "info" | "warn" | "error",
  message: string
) {
  const record = await prisma.partnerSearchJob.findUnique({ where: { id } });
  if (!record) return;
  const logs = parseJson<PartnerSearchJobSnapshot["logs"]>(record.logs, []);
  logs.push({ at: new Date().toISOString(), level, message });
  await prisma.partnerSearchJob.update({
    where: { id },
    data: { logs: JSON.stringify(logs.slice(-80)) },
  });
}

export async function getPartnerSearchJob(
  id: string
): Promise<PartnerSearchJobSnapshot | null> {
  const record = await prisma.partnerSearchJob.findUnique({ where: { id } });
  return record ? toSnapshot(record) : null;
}

export async function getActivePartnerSearchJob(): Promise<PartnerSearchJobSnapshot | null> {
  const record = await prisma.partnerSearchJob.findFirst({
    where: { status: "running" },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return null;

  const staleMs = 5 * 60 * 1000;
  if (Date.now() - record.updatedAt.getTime() > staleMs) {
    await prisma.partnerSearchJob.update({
      where: { id: record.id },
      data: {
        status: "error",
        errorMessage: "Recherche interrompue (job orphelin).",
      },
    });
    return null;
  }

  return toSnapshot(record);
}

export async function createAndRunPartnerSearchJob(input: {
  zone: string;
  types: PartnerType[];
  limitPerType?: number;
  score?: boolean;
}): Promise<PartnerSearchJobSnapshot> {
  const job = await prisma.partnerSearchJob.create({
    data: {
      zone: input.zone.trim() || "France",
      types: JSON.stringify(input.types),
      status: "running",
      config: JSON.stringify({
        limit: input.limitPerType ?? 8,
        enrich: true,
        score: input.score !== false,
      }),
      logs: JSON.stringify([
        {
          at: new Date().toISOString(),
          level: "info",
          message: `Démarrage recherche « ${input.zone} » (${input.types.length} type(s))`,
        },
      ]),
      progress: JSON.stringify({ processed: 0, total: 0, message: "Initialisation" }),
    },
  });

  void executePartnerSearchJob(job.id).catch(async (error) => {
    console.error("[partners/search-job]", error);
    await prisma.partnerSearchJob.update({
      where: { id: job.id },
      data: {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Erreur recherche partenaires",
      },
    });
  });

  return toSnapshot(job);
}

async function executePartnerSearchJob(jobId: string): Promise<void> {
  const job = await prisma.partnerSearchJob.findUnique({ where: { id: jobId } });
  if (!job) return;

  const types = parseJson<PartnerType[]>(job.types, []);
  const config = parseJson<{ limit: number; score: boolean }>(job.config, {
    limit: 8,
    score: true,
  });

  const { partners, created, updated } = await runPartnerSearch({
    zone: job.zone,
    types,
    limitPerType: config.limit,
    onProgress: async (message, processed, total) => {
      await prisma.partnerSearchJob.update({
        where: { id: jobId },
        data: {
          progress: JSON.stringify({ processed, total, message }),
        },
      });
      await appendLog(jobId, "info", message);
    },
  });

  const results: PartnerSearchJobSnapshot["results"] = [];

  for (const partner of partners) {
    if (config.score) {
      try {
        await scorePartner(partner.id);
      } catch (error) {
        await appendLog(
          jobId,
          "warn",
          `Scoring échoué pour ${partner.entreprise}: ${
            error instanceof Error ? error.message : "erreur"
          }`
        );
      }
    }
    results.push({
      partnerId: partner.id,
      nom: partner.entreprise,
      type: partner.type,
    });
  }

  await prisma.partnerSearchJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      results: JSON.stringify(results),
      progress: JSON.stringify({
        processed: partners.length,
        total: partners.length,
        message: `Terminé — ${created} créés, ${updated} mis à jour`,
      }),
    },
  });
  await appendLog(
    jobId,
    "info",
    `Recherche terminée : ${created} créés, ${updated} mis à jour`
  );
}

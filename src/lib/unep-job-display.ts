import type { UnepSearchJobSnapshot } from "@/types/unep-job";

/** Nombre de prospects importés — utilise progress en direct si results pas encore synchronisé. */
export function getUnepLiveImportedCount(
  job: Pick<UnepSearchJobSnapshot, "results" | "progress"> | null | undefined
): number {
  if (!job) return 0;
  return Math.max(job.results.length, job.progress?.matchesFound ?? 0);
}

export function formatUnepLiveStats(
  job: Pick<UnepSearchJobSnapshot, "results" | "progress"> | null | undefined
): string | null {
  if (!job?.progress) return null;

  const imported = getUnepLiveImportedCount(job);
  const { page, totalPages, scanned, skipped } = job.progress;

  return `${imported} enregistré(s) · page ${page}/${totalPages} · ${scanned} fiche(s) analysée(s) · ${skipped} ignoré(s)`;
}

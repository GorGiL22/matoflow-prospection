"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Square, Search } from "lucide-react";
import { getUnepAreaDefinition, getUnepAreaHref } from "@/modules/scraping/unep-areas";
import { useUnepSearchJob } from "@/components/scraping/unep-search-job-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  formatUnepLiveStats,
  getUnepLiveImportedCount,
} from "@/lib/unep-job-display";

export function UnepSearchJobBanner() {
  const { job, isRunning, stopJob, isChaining } = useUnepSearchJob();
  const [isStopping, setIsStopping] = useState(false);
  const [stopError, setStopError] = useState<string | null>(null);

  const showBanner = isChaining || (job && isRunning);
  if (!showBanner) return null;

  const areaDefinition = job ? getUnepAreaDefinition(job.area) : null;
  const progress = job?.progress;
  const href = job ? getUnepAreaHref(job.area) : "/prospects/recherche-unep";
  const importedCount = job ? getUnepLiveImportedCount(job) : 0;
  const liveStats = job ? formatUnepLiveStats(job) : null;
  const progressPercent =
    progress && progress.totalPages > 0
      ? Math.round((progress.page / progress.totalPages) * 100)
      : null;

  async function handleStop() {
    setStopError(null);
    setIsStopping(true);
    try {
      await stopJob();
    } catch (error) {
      setStopError(
        error instanceof Error ? error.message : "Impossible d'arrêter la recherche"
      );
    } finally {
      setIsStopping(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-72 right-4 z-50 mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-4 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted">
              <Loader2 className="h-4 w-4 animate-spin text-brand" />
            </span>
            {isChaining
              ? "Enchaînement automatique — préparation de la prochaine ville…"
              : `Recherche UNEP — ${areaDefinition?.areaName ?? ""}`}
          </p>
          {!isChaining && job && (
            <>
              <p className="mt-2 text-sm text-muted">
                {liveStats ? (
                  <span className="font-medium text-foreground">{liveStats}</span>
                ) : (
                  <>
                    <span className="font-semibold text-brand">{importedCount}</span>{" "}
                    prospect{importedCount !== 1 ? "s" : ""} enregistré
                    {importedCount !== 1 ? "s" : ""} · analyse en cours…
                  </>
                )}
              </p>
              {progressPercent !== null && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              )}
            </>
          )}
          {stopError && (
            <p className="mt-2 text-sm text-red-600">{stopError}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {job && !isChaining && (
            <Link
              href={href}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <Search className="h-3.5 w-3.5" />
              Voir le journal
            </Link>
          )}
          <button
            type="button"
            onClick={() => void handleStop()}
            disabled={isStopping}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            {isStopping ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Square className="h-3.5 w-3.5" />
            )}
            Arrêter tout
          </button>
        </div>
      </div>
    </div>
  );
}

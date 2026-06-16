"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useUnepSearchJob } from "@/components/scraping/unep-search-job-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  formatUnepLiveStats,
  getUnepLiveImportedCount,
} from "@/lib/unep-job-display";
import {
  getUnepAreaDefinition,
  getUnepAreaHref,
} from "@/modules/scraping/unep-areas";

export function UnepActiveScanNotice() {
  const { job, isRunning } = useUnepSearchJob();

  if (!isRunning || !job) return null;

  const area = getUnepAreaDefinition(job.area);
  const importedCount = getUnepLiveImportedCount(job);
  const liveStats = formatUnepLiveStats(job);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 font-medium">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <span>
            Scan UNEP en cours — {area.areaName}
            <span className="mt-1 block text-xs font-normal opacity-90">
              {liveStats ??
                `${importedCount} prospect${importedCount > 1 ? "s" : ""} enregistré${importedCount > 1 ? "s" : ""}`}
            </span>
          </span>
        </p>
        <Link
          href={getUnepAreaHref(job.area)}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          Voir le journal
        </Link>
      </div>
    </div>
  );
}

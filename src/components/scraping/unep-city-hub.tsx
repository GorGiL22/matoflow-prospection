"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useUnepSearchJob } from "@/components/scraping/unep-search-job-provider";
import { Card } from "@/components/ui/card";
import {
  UnepAreaScanBadge,
  getUnepAreaScanStatusText,
} from "@/components/scraping/unep-area-scan-status";
import {
  UNEP_CITY_CATALOG,
  getUnepAreaHref,
} from "@/modules/scraping/unep-areas";
import type { UnepAreaScanSummary } from "@/types/unep-job";

interface UnepCityHubProps {
  initialSummaries: UnepAreaScanSummary[];
}

export function UnepCityHub({ initialSummaries }: UnepCityHubProps) {
  const { job, isRunning } = useUnepSearchJob();
  const [summaries, setSummaries] = useState(initialSummaries);

  const refreshSummaries = useCallback(async () => {
    try {
      const response = await fetch("/api/unep/search/summaries");
      if (!response.ok) return;
      const data = (await response.json()) as {
        summaries?: UnepAreaScanSummary[];
      };
      if (data.summaries) {
        setSummaries(data.summaries);
      }
    } catch {
      // Ignore refresh errors — keep the last known state.
    }
  }, []);

  useEffect(() => {
    setSummaries(initialSummaries);
  }, [initialSummaries]);

  useEffect(() => {
    if (!isRunning && job?.status === "completed") {
      void refreshSummaries();
    }
  }, [isRunning, job?.status, job?.area, refreshSummaries]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      void refreshSummaries();
    }, 5000);
    return () => clearInterval(interval);
  }, [isRunning, refreshSummaries]);

  const summaryByArea = new Map(summaries.map((summary) => [summary.area, summary]));
  const scannedCount = summaries.filter(
    (summary) => summary.isFullyScanned || summary.hasBeenScanned
  ).length;
  const fullyScannedCount = summaries.filter(
    (summary) => summary.isFullyScanned
  ).length;

  return (
    <div className="space-y-4">
      {scannedCount > 0 && (
        <p className="text-sm text-muted">
          {fullyScannedCount} ville{fullyScannedCount > 1 ? "s" : ""} entièrement
          analysée{fullyScannedCount > 1 ? "s" : ""} · {scannedCount} déjà
          scannée{scannedCount > 1 ? "s" : ""} sur {summaries.length}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {UNEP_CITY_CATALOG.map((city) => {
          const summary = summaryByArea.get(city.id);
          const statusText = summary ? getUnepAreaScanStatusText(summary) : null;

          return (
            <Link key={city.id} href={getUnepAreaHref(city.id)}>
              <Card
                className={`h-full p-4 transition-all duration-150 hover:shadow-md ${
                  summary?.isFullyScanned
                    ? "border-emerald-300/80 bg-emerald-50/60 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : summary?.hasBeenScanned
                      ? "border-amber-200/80 hover:border-amber-300 dark:border-amber-900/60"
                      : "hover:border-brand/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      summary?.isFullyScanned
                        ? "bg-emerald-100 dark:bg-emerald-900/50"
                        : "bg-surface-muted"
                    }`}
                  >
                    <Building2
                      className={`h-5 w-5 ${
                        summary?.isFullyScanned
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted"
                      }`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-foreground">
                        {city.areaName}
                      </p>
                      {summary ? (
                        <UnepAreaScanBadge summary={summary} />
                      ) : null}
                    </div>
                    <p className="text-xs text-muted">
                      {city.regionName} · ~{city.approximateCount} fiches région
                    </p>
                    <p className="mt-1 text-xs text-brand">{city.zoneLabel}</p>
                    {statusText && (
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        {statusText}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

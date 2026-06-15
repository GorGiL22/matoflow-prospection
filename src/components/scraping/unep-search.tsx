"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUnepSearchJobForArea } from "@/components/scraping/unep-search-job-provider";
import { UnepSearchConsole } from "@/components/scraping/unep-search-console";
import { UnepSearchSteps } from "@/components/scraping/unep-search-steps";
import { Card, CardHeader } from "@/components/ui/card";
import { UNEP_MAX_RESULTS_PER_RUN } from "@/config/constants";
import {
  clearUnepScanCursor,
  loadUnepScanCursor,
  type UnepScanCursor,
} from "@/lib/unep-scan-cursor";
import { getScoreBgColor, getScoreColor } from "@/lib/utils";
import {
  formatUnepLiveStats,
  getUnepLiveImportedCount,
} from "@/lib/unep-job-display";
import {
  getUnepAreaDefinition,
  type UnepSearchArea,
} from "@/modules/scraping/unep-areas";
import type { UnepAreaScanSummary } from "@/types/unep-job";
import { Leaf, Loader2, Search, Square } from "lucide-react";

export function UnepSearchPanel({
  area,
  initialScanSummary = null,
}: {
  area: UnepSearchArea;
  initialScanSummary?: UnepAreaScanSummary | null;
}) {
  const areaDefinition = getUnepAreaDefinition(area);
  const { areaJob, isRunningForArea, job: globalJob, startJob, stopJob, autoChain, setAutoChain } =
    useUnepSearchJobForArea(area);

  const [includeMetropole, setIncludeMetropole] = useState(
    areaDefinition.includeMetropoleDefault
  );
  const [excludeExisting, setExcludeExisting] = useState(true);
  const [unlimitedResults, setUnlimitedResults] = useState(false);
  const [maxResults, setMaxResults] = useState(100);
  const [resumeScan, setResumeScan] = useState(true);
  const [startPage, setStartPage] = useState(1);
  const [scanCursor, setScanCursor] = useState<UnepScanCursor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  const otherJobRunning =
    globalJob?.status === "running" && globalJob.area !== area;

  const results = areaJob?.results ?? [];
  const logs = areaJob?.logs ?? [];
  const activeStep = areaJob?.stepsState.activeStep ?? null;
  const completedSteps = new Set(areaJob?.stepsState.completedSteps ?? []);
  const errorStep = areaJob?.stepsState.errorStep ?? null;

  useEffect(() => {
    const stored = loadUnepScanCursor(area);
    setScanCursor(stored);
    if (stored && stored.nextPage > 1) {
      setStartPage(stored.nextPage);
    }
  }, [area]);

  useEffect(() => {
    const resume = areaJob?.resume;
    if (!resume || resume.exhausted) return;

    const cursor = {
      nextPage: resume.nextPage,
      totalPages: resume.totalPages,
    };
    setScanCursor(cursor);
    if (resumeScan) {
      setStartPage(resume.nextPage);
    }
  }, [areaJob?.resume, areaJob?.updatedAt, resumeScan]);

  const knownTotalPages =
    areaJob?.progress?.totalPages ??
    scanCursor?.totalPages ??
    Math.ceil(areaDefinition.approximateCount / 100);

  const liveProgress = isRunningForArea ? areaJob?.progress : null;
  const importedCount = getUnepLiveImportedCount(areaJob);
  const liveStatsText = formatUnepLiveStats(areaJob);

  const resumeMessage =
    areaJob?.status === "stopped"
      ? `${importedCount} prospect(s) enregistré(s) en base — vous pouvez relancer pour continuer.`
      : areaJob?.status === "completed" && areaJob.resume?.exhausted
        ? `${importedCount} prospect(s) enregistré(s) — région entièrement parcourue.`
        : areaJob?.status === "completed" && areaJob.resume && areaJob.resume.nextPage > 1
          ? `${importedCount} prospect(s) enregistré(s) — prochaine recherche reprendra à la page ${areaJob.resume.nextPage}/${areaJob.resume.totalPages}.`
          : importedCount > 0 && !isRunningForArea
            ? `${importedCount} prospect(s) enregistré(s) automatiquement en base.`
            : null;

  const handleResetCursor = () => {
    clearUnepScanCursor(area);
    setScanCursor(null);
    setStartPage(1);
    setResumeScan(false);
  };

  function resolveStartPage(): number {
    if (resumeScan && scanCursor && scanCursor.nextPage > 1) {
      return scanCursor.nextPage;
    }
    return Math.max(1, Math.min(startPage, knownTotalPages || startPage));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsStarting(true);

    const effectiveStartPage = resolveStartPage();

    try {
      await startJob({
        area,
        maxResults: unlimitedResults ? 0 : maxResults,
        startPage: effectiveStartPage,
        includeMetropole,
        excludeExisting,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la recherche UNEP"
      );
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStop() {
    setIsStopping(true);
    setError(null);
    try {
      await stopJob();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'arrêter la recherche"
      );
    } finally {
      setIsStopping(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  const isBusy = isStarting || isRunningForArea;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={`Recherche UNEP — ${areaDefinition.areaName}`}
          description={`Annuaire des entreprises du paysage (${areaDefinition.regionName}) — enregistrement automatique en base`}
        />

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[120px]">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Page de départ
              </label>
              <input
                type="number"
                min={1}
                max={knownTotalPages || 999}
                value={startPage}
                onChange={(e) => setStartPage(Number(e.target.value))}
                disabled={isBusy || resumeScan}
                className={inputClass}
              />
            </div>

            {!unlimitedResults ? (
              <div className="min-w-[120px]">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Max nouveaux
                </label>
                <input
                  type="number"
                  min={1}
                  max={UNEP_MAX_RESULTS_PER_RUN}
                  value={maxResults}
                  onChange={(e) => setMaxResults(Number(e.target.value))}
                  disabled={isBusy}
                  className={inputClass}
                />
              </div>
            ) : null}

            {isRunningForArea ? (
              <button
                type="button"
                onClick={handleStop}
                disabled={isStopping}
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Arrêter
              </button>
            ) : (
              <button
                type="submit"
                disabled={isBusy || otherJobRunning}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {isStarting
                  ? "Démarrage..."
                  : initialScanSummary?.isFullyScanned
                    ? "Relancer la recherche"
                    : initialScanSummary?.canResume
                      ? "Reprendre le scan"
                      : "Lancer la recherche"}
              </button>
            )}
          </div>

          {otherJobRunning && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Une recherche UNEP est déjà en cours sur une autre zone.
            </p>
          )}

          {isRunningForArea && (
            <div className="rounded-xl border border-brand-subtle bg-brand-muted/50 px-4 py-3">
              <p className="text-sm font-medium text-brand">
                {liveStatsText ??
                  `${importedCount} prospect(s) enregistré(s) · analyse en cours…`}
              </p>
              {liveProgress && liveProgress.scanned > 0 && importedCount === 0 && (
                <p className="mt-1 text-xs text-muted">
                  {liveProgress.scanned} fiche(s) parcourue(s) — les nouveaux
                  prospects s&apos;affichent dès leur enregistrement.
                </p>
              )}
            </div>
          )}

          {liveProgress && !isRunningForArea && (
            <p className="text-sm text-muted">
              {liveStatsText}
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={excludeExisting}
                onChange={(e) => setExcludeExisting(e.target.checked)}
                disabled={isBusy}
                className="rounded border-zinc-300"
              />
              Ignorer les prospects déjà en base
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={unlimitedResults}
                onChange={(e) => setUnlimitedResults(e.target.checked)}
                disabled={isBusy}
                className="rounded border-zinc-300"
              />
              Sans limite ({UNEP_MAX_RESULTS_PER_RUN} max par lot sinon)
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={resumeScan}
                onChange={(e) => setResumeScan(e.target.checked)}
                disabled={isBusy || !scanCursor}
                className="rounded border-zinc-300"
              />
              Reprendre à la page {scanCursor?.nextPage ?? 1}
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={autoChain}
                onChange={(e) => setAutoChain(e.target.checked)}
                disabled={isBusy}
                className="rounded border-zinc-300"
              />
              Enchaîner automatiquement les villes restantes (sans limite)
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={includeMetropole}
                onChange={(e) => setIncludeMetropole(e.target.checked)}
                disabled={isBusy}
                className="rounded border-zinc-300"
              />
              {areaDefinition.metropoleCheckboxLabel}
            </label>

            {scanCursor ? (
              <button
                type="button"
                onClick={handleResetCursor}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"
              >
                Recommencer page 1
              </button>
            ) : null}
          </div>
        </form>

        <p className="mt-3 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Chaque nouveau prospect est enregistré en base dès qu&apos;il est
          trouvé. L&apos;analyse tourne en arrière-plan (~{knownTotalPages}{" "}
          pages régionales).
          {areaDefinition.narrowWithoutMetroHint && !includeMetropole && (
            <span className="block text-amber-600 dark:text-amber-400">
              {areaDefinition.narrowWithoutMetroHint}
            </span>
          )}
        </p>
      </Card>

      <Card>
        <CardHeader
          title="Progression de la recherche"
          description={`Connexion UNEP → liste ${areaDefinition.regionName} → fiches → filtrage ${areaDefinition.areaName}`}
        />
        <UnepSearchSteps
          activeStep={activeStep}
          completedSteps={completedSteps}
          errorStep={errorStep}
        />
      </Card>

      <UnepSearchConsole
        logs={logs}
        isRunning={isRunningForArea}
        areaName={areaDefinition.areaName}
      />

      {resumeMessage && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300">
          {resumeMessage}{" "}
          <Link href="/prospects" className="underline">
            Voir les prospects →
          </Link>
        </p>
      )}

      {areaJob?.errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {areaJob.errorMessage}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {(importedCount > 0 || isRunningForArea) && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">
                {importedCount}
              </span>{" "}
              prospect{importedCount > 1 ? "s" : ""} enregistré
              {importedCount > 1 ? "s" : ""} en base
              {isRunningForArea ? " · mise à jour en direct" : ""}
            </p>
          </div>

          {results.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Nom
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Téléphone
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Email
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Site
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Ville
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Activités
                  </th>
                  <th className="px-3 py-3 font-medium text-zinc-600 dark:text-zinc-400">
                    Score IA
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {results.map((company) => (
                  <tr
                    key={company.unepId}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-3 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <a
                        href={company.unepUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-emerald-600 dark:hover:text-emerald-400"
                      >
                        {company.nomEntreprise}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {company.telephone ?? "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {company.email ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3">
                      {company.siteWeb ? (
                        <a
                          href={company.siteWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          {company.siteWeb.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">
                      {company.ville ?? "—"}
                      {company.codePostal ? (
                        <span className="ml-1 text-xs text-zinc-400">
                          ({company.codePostal})
                        </span>
                      ) : null}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {company.activites.length > 0
                        ? company.activites.join(", ")
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBgColor(null)} ${getScoreColor(null)}`}
                      >
                        —
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          ) : isRunningForArea ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 p-8 text-center text-sm text-muted">
              {liveProgress && liveProgress.scanned > 0
                ? `${liveProgress.scanned} fiche(s) analysée(s) — en attente de nouveaux prospects dans la zone…`
                : "Parcours de l'annuaire UNEP en cours…"}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}

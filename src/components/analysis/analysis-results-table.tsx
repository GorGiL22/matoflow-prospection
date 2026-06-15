"use client";

import { getScoreBgColor, getScoreColor } from "@/lib/utils";
import type { AnalysisProspectRow } from "@/types/analysis";

interface AnalysisResultsTableProps {
  rows: AnalysisProspectRow[];
}

export function AnalysisResultsTable({ rows }: AnalysisResultsTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Le tableau se remplira au fur et à mesure de l&apos;analyse.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Nom
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Téléphone
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Site
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Ville
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Avis Google
            </th>
            <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">
              Score IA
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-t border-zinc-100 transition-colors duration-500 dark:border-zinc-800"
            >
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                {row.nomEntreprise || (
                  <span className="animate-pulse text-zinc-400">...</span>
                )}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.stepReached >= 1 ? (row.telephone ?? "—") : "—"}
              </td>
              <td className="max-w-[140px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.stepReached >= 1 && row.siteWeb ? row.siteWeb : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.stepReached >= 1 ? (row.ville ?? "—") : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {row.stepReached >= 1 && row.avisGoogle > 0
                  ? row.avisGoogle
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {row.stepReached >= 4 && row.scoreIA !== null ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBgColor(row.scoreIA)} ${getScoreColor(row.scoreIA)}`}
                  >
                    {row.scoreIA}
                  </span>
                ) : row.stepReached >= 4 ? (
                  <span className="animate-pulse text-zinc-400">...</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

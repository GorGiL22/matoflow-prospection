"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Filter } from "lucide-react";
import { selectClassName } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { getScoreBgColor, getScoreColor, formatEmailDisplay, formatPhoneDisplay, hasValidProspectEmail, hasValidProspectPhone, hasValidProspectWebsite } from "@/lib/utils";
import { ProspectDeleteButton } from "@/components/prospects/prospect-delete-button";
import { ProspectContactFilter, DEFAULT_CONTACT_FILTERS, type ContactFilters, type ContactFieldFilter } from "@/components/prospects/prospect-contact-filter";
import { ProspectStatusFilter } from "@/components/prospects/prospect-status-filter";
import { ProspectStatusQuickActions } from "@/components/prospects/prospect-status-quick-actions";
import type { Prospect, ProspectStatus } from "@/types/prospect";

type ScoreSort = "desc" | "asc" | "default";
type AnalysisFilter = "all" | "analyzed" | "unanalyzed";

function matchesContactFieldFilter(
  hasValue: boolean,
  filter: ContactFieldFilter
): boolean {
  if (filter === "with") return hasValue;
  if (filter === "without") return !hasValue;
  return true;
}

interface ProspectTableProps {
  prospects: Prospect[];
}

function sortProspects(
  prospects: Prospect[],
  scoreSort: ScoreSort
): Prospect[] {
  const items = [...prospects];

  if (scoreSort === "default") {
    return items.sort(
      (a, b) =>
        new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    );
  }

  return items.sort((a, b) => {
    const scoreA = a.scoreIA ?? -1;
    const scoreB = b.scoreIA ?? -1;

    if (scoreSort === "desc") return scoreB - scoreA;
    return scoreA - scoreB;
  });
}

function filterProspects(
  prospects: Prospect[],
  analysisFilter: AnalysisFilter,
  contactFilters: ContactFilters,
  statusFilter: ProspectStatus[]
): Prospect[] {
  let filtered = prospects;

  if (analysisFilter === "analyzed") {
    filtered = filtered.filter((prospect) => prospect.scoreIA !== null);
  } else if (analysisFilter === "unanalyzed") {
    filtered = filtered.filter((prospect) => prospect.scoreIA === null);
  }

  if (contactFilters.phone !== "all") {
    filtered = filtered.filter((prospect) =>
      matchesContactFieldFilter(
        hasValidProspectPhone(prospect),
        contactFilters.phone
      )
    );
  }

  if (contactFilters.email !== "all") {
    filtered = filtered.filter((prospect) =>
      matchesContactFieldFilter(
        hasValidProspectEmail(prospect),
        contactFilters.email
      )
    );
  }

  if (contactFilters.site !== "all") {
    filtered = filtered.filter((prospect) =>
      matchesContactFieldFilter(
        hasValidProspectWebsite(prospect),
        contactFilters.site
      )
    );
  }

  if (statusFilter.length > 0) {
    const allowed = new Set(statusFilter);
    filtered = filtered.filter((prospect) => allowed.has(prospect.statut));
  }

  return filtered;
}

export function ProspectTable({ prospects }: ProspectTableProps) {
  const [scoreSort, setScoreSort] = useState<ScoreSort>("desc");
  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>("all");
  const [contactFilters, setContactFilters] = useState<ContactFilters>(
    DEFAULT_CONTACT_FILTERS
  );
  const [statusFilter, setStatusFilter] = useState<ProspectStatus[]>([]);

  const displayedProspects = useMemo(() => {
    const filtered = filterProspects(
      prospects,
      analysisFilter,
      contactFilters,
      statusFilter
    );
    return sortProspects(filtered, scoreSort);
  }, [prospects, analysisFilter, contactFilters, statusFilter, scoreSort]);

  if (prospects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="text-muted">Aucun prospect pour le moment.</p>
        <Link
          href="/prospects/nouveau"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "mt-3",
          })}
        >
          Ajouter un premier prospect →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="h-4 w-4" />
          <span>
            {displayedProspects.length} affiché
            {displayedProspects.length !== prospects.length
              ? ` / ${prospects.length}`
              : ""}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <select
            value={analysisFilter}
            onChange={(e) =>
              setAnalysisFilter(e.target.value as AnalysisFilter)
            }
            className={selectClassName}
            aria-label="Filtrer par analyse IA"
          >
            <option value="all">Tous les prospects</option>
            <option value="analyzed">Analysés par l&apos;IA</option>
            <option value="unanalyzed">Non analysés</option>
          </select>

          <select
            value={scoreSort}
            onChange={(e) => setScoreSort(e.target.value as ScoreSort)}
            className={selectClassName}
            aria-label="Trier par score IA"
          >
            <option value="desc">Score IA décroissant</option>
            <option value="asc">Score IA croissant</option>
            <option value="default">Plus récents d&apos;abord</option>
          </select>
        </div>
      </div>

      <ProspectContactFilter
        filters={contactFilters}
        onChange={setContactFilters}
      />

      <ProspectStatusFilter
        selectedStatuses={statusFilter}
        onChange={setStatusFilter}
      />

      {displayedProspects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            Aucun prospect ne correspond à ce filtre.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted/60">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">
                  Nom
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Statut
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Téléphone
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Email
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Site
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Ville
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  Avis Google
                </th>
                <th className="px-4 py-3 font-medium text-muted">
                  <button
                    type="button"
                    onClick={() =>
                      setScoreSort((current) =>
                        current === "desc" ? "asc" : "desc"
                      )
                    }
                    className="inline-flex items-center gap-1 hover:text-brand"
                  >
                    Score IA
                    {scoreSort === "desc" ? (
                      <ArrowDown className="h-3.5 w-3.5" />
                    ) : scoreSort === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                </th>
                <th className="w-10 px-2 py-3">
                  <span className="sr-only">Supprimer</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {displayedProspects.map((prospect) => (
                <tr
                  key={prospect.id}
                  className="transition-colors hover:bg-surface-muted/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/prospects/${prospect.id}`}
                      className="font-medium text-foreground hover:text-brand"
                    >
                      {prospect.nomEntreprise}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ProspectStatusQuickActions
                      prospectId={prospect.id}
                      currentStatus={prospect.statut}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatPhoneDisplay(prospect.telephone) ?? "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-muted">
                    {formatEmailDisplay(
                      prospect.email ?? prospect.emailNormalise
                    ) ?? "—"}
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-3">
                    {prospect.siteWeb ? (
                      <a
                        href={
                          prospect.siteWeb.startsWith("http")
                            ? prospect.siteWeb
                            : `https://${prospect.siteWeb}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        {prospect.siteWeb.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {prospect.ville ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {prospect.avisGoogle > 0 ? prospect.avisGoogle : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBgColor(prospect.scoreIA)} ${getScoreColor(prospect.scoreIA)}`}
                    >
                      {prospect.scoreIA ?? "—"}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <ProspectDeleteButton
                      prospectId={prospect.id}
                      prospectName={prospect.nomEntreprise}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

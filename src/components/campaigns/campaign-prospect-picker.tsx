"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { inputClassName } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STATUS_SHORT_LABELS, type ProspectStatus } from "@/types/prospect";
import { getScoreColor } from "@/lib/utils";

export interface CampaignProspectCandidate {
  id: string;
  nomEntreprise: string;
  email: string;
  ville: string | null;
  scoreIA: number | null;
  statut: string;
  selectable: boolean;
  unavailableReason: string | null;
}

interface CampaignProspectPickerProps {
  prospects: CampaignProspectCandidate[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CampaignProspectPicker({
  prospects,
  selectedIds,
  onChange,
}: CampaignProspectPickerProps) {
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return prospects;
    return prospects.filter(
      (prospect) =>
        prospect.nomEntreprise.toLowerCase().includes(q) ||
        prospect.email.toLowerCase().includes(q) ||
        prospect.ville?.toLowerCase().includes(q)
    );
  }, [prospects, query]);

  const selectableFiltered = filtered.filter((p) => p.selectable);

  function toggle(id: string, selectable: boolean) {
    if (!selectable) return;
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((item) => item !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  function selectAllVisible() {
    const visibleIds = selectableFiltered.map((p) => p.id);
    onChange([...new Set([...selectedIds, ...visibleIds])]);
  }

  function clearSelection() {
    onChange([]);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Sélection manuelle
          </p>
          <p className="text-xs text-muted">
            {selectedIds.length} sélectionné
            {selectedIds.length > 1 ? "s" : ""} ·{" "}
            {prospects.filter((p) => p.selectable).length} disponible
            {prospects.filter((p) => p.selectable).length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="text-xs font-medium text-brand hover:underline"
          >
            Tout sélectionner (liste)
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs font-medium text-muted hover:underline"
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, email, ville…"
          className={`${inputClassName} pl-9`}
        />
      </div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-surface">
        {filtered.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted">
            Aucun prospect ne correspond à la recherche.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {filtered.map((prospect) => {
              const isSelected = selectedSet.has(prospect.id);
              const status = prospect.statut as ProspectStatus;
              const statusLabel =
                STATUS_SHORT_LABELS[status] ?? prospect.statut;

              return (
                <li key={prospect.id}>
                  <label
                    className={`flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors ${
                      prospect.selectable
                        ? "hover:bg-surface-muted/60"
                        : "cursor-not-allowed opacity-60"
                    } ${isSelected ? "bg-brand-muted/30" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!prospect.selectable}
                      onChange={() => toggle(prospect.id, prospect.selectable)}
                      className="mt-1 rounded border-border"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {prospect.nomEntreprise}
                        </span>
                        <Badge variant="default" className="text-[10px]">
                          {statusLabel}
                        </Badge>
                        {prospect.scoreIA !== null && (
                          <span
                            className={`text-xs font-semibold ${getScoreColor(prospect.scoreIA)}`}
                          >
                            {prospect.scoreIA}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {prospect.email}
                        {prospect.ville ? ` · ${prospect.ville}` : ""}
                      </p>
                      {prospect.unavailableReason && (
                        <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                          {prospect.unavailableReason}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

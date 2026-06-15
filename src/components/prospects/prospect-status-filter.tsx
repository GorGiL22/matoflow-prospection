"use client";

import { cn } from "@/lib/utils";
import {
  PROSPECT_STATUSES,
  STATUS_ACTIVE_CLASSES,
  STATUS_SHORT_LABELS,
  type ProspectStatus,
} from "@/types/prospect";

interface ProspectStatusFilterProps {
  selectedStatuses: ProspectStatus[];
  onChange: (statuses: ProspectStatus[]) => void;
}

export function ProspectStatusFilter({
  selectedStatuses,
  onChange,
}: ProspectStatusFilterProps) {
  const selectedSet = new Set(selectedStatuses);
  const hasSelection = selectedStatuses.length > 0;

  function toggle(status: ProspectStatus) {
    if (selectedSet.has(status)) {
      onChange(selectedStatuses.filter((item) => item !== status));
      return;
    }
    onChange([...selectedStatuses, status]);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">Filtrer par statut</p>
        {hasSelection && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs font-medium text-brand hover:underline"
          >
            Tous les statuts
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROSPECT_STATUSES.map((status) => {
          const isSelected = selectedSet.has(status);

          return (
            <button
              key={status}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(status)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? STATUS_ACTIVE_CLASSES[status]
                  : "border border-border bg-surface-muted text-muted hover:border-brand/30 hover:text-foreground"
              )}
            >
              {STATUS_SHORT_LABELS[status]}
            </button>
          );
        })}
      </div>

      {hasSelection && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {selectedStatuses.length} statut
          {selectedStatuses.length > 1 ? "s" : ""} sélectionné
          {selectedStatuses.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

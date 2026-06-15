"use client";

import { selectClassName } from "@/components/ui/input";

export type ContactFieldFilter = "all" | "with" | "without";

export interface ContactFilters {
  phone: ContactFieldFilter;
  email: ContactFieldFilter;
  site: ContactFieldFilter;
}

export const DEFAULT_CONTACT_FILTERS: ContactFilters = {
  phone: "all",
  email: "all",
  site: "all",
};

const FIELD_OPTIONS: { value: ContactFieldFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "with", label: "Avec" },
  { value: "without", label: "Sans" },
];

interface ProspectContactFilterProps {
  filters: ContactFilters;
  onChange: (filters: ContactFilters) => void;
}

export function ProspectContactFilter({
  filters,
  onChange,
}: ProspectContactFilterProps) {
  const hasActiveFilter = Object.values(filters).some((value) => value !== "all");

  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted">Coordonnées</p>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CONTACT_FILTERS)}
            className="text-xs font-medium text-brand hover:underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            Téléphone
          </span>
          <select
            value={filters.phone}
            onChange={(e) =>
              onChange({
                ...filters,
                phone: e.target.value as ContactFieldFilter,
              })
            }
            className={selectClassName}
            aria-label="Filtrer par téléphone"
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            Email
          </span>
          <select
            value={filters.email}
            onChange={(e) =>
              onChange({
                ...filters,
                email: e.target.value as ContactFieldFilter,
              })
            }
            className={selectClassName}
            aria-label="Filtrer par email"
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            Site web
          </span>
          <select
            value={filters.site}
            onChange={(e) =>
              onChange({
                ...filters,
                site: e.target.value as ContactFieldFilter,
              })
            }
            className={selectClassName}
            aria-label="Filtrer par site web"
          >
            {FIELD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

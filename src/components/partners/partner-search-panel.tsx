"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getPartnerSearchJobAction,
  startPartnerSearchAction,
} from "@/actions/partners";
import {
  PARTNER_TYPES,
  PARTNER_TYPE_LABELS,
  type PartnerSearchJobSnapshot,
  type PartnerType,
} from "@/types/partner";

const DEFAULT_TYPES: PartnerType[] = [
  "cooperative",
  "cabinet_comptable",
  "federation",
  "reseau_pro",
  "organisme_sap",
];

export function PartnerSearchPanel() {
  const router = useRouter();
  const [zone, setZone] = useState("France");
  const [types, setTypes] = useState<PartnerType[]>(DEFAULT_TYPES);
  const [limitPerType, setLimitPerType] = useState(6);
  const [job, setJob] = useState<PartnerSearchJobSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allSelected = types.length === PARTNER_TYPES.length;

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const result = await getPartnerSearchJobAction(job?.id);
      if (cancelled || !result.success) return;
      if (result.job) {
        setJob(result.job);
        if (result.job.status === "completed") {
          router.refresh();
        }
      }
    }
    void poll();
    const interval = setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [job?.id, router]);

  const progressLabel = useMemo(() => {
    if (!job?.progress) return null;
    const { processed, total, message } = job.progress;
    return `${message ?? "En cours"} (${processed}/${total || "?"})`;
  }, [job]);

  function toggleType(type: PartnerType) {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function handleStart() {
    setError(null);
    startTransition(async () => {
      const result = await startPartnerSearchAction({
        zone,
        types,
        limitPerType,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setJob(result.job);
    });
  }

  return (
    <Card>
      <CardHeader
        title="Recherche partenaires"
        description="Indiquez une zone (France, Bretagne, Gironde…) et les types à scanner via le web et Google Places."
      />

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Zone
            </label>
            <Input
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="France, Bretagne, Nantes…"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Résultats max / type
            </label>
            <Input
              type="number"
              min={3}
              max={15}
              value={limitPerType}
              onChange={(e) => setLimitPerType(Number(e.target.value) || 6)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Types</p>
            <button
              type="button"
              className="text-xs text-brand hover:underline"
              onClick={() =>
                setTypes(allSelected ? DEFAULT_TYPES : [...PARTNER_TYPES])
              }
            >
              {allSelected ? "Réduire" : "Tout sélectionner"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PARTNER_TYPES.map((type) => {
              const active = types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "border-brand bg-brand-muted text-brand"
                      : "border-border text-muted-foreground hover:bg-surface-muted"
                  }`}
                >
                  {PARTNER_TYPE_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        ) : null}

        {job ? (
          <div className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm">
            <p className="font-medium">
              Job {job.status === "running" ? "en cours" : job.status}
            </p>
            {progressLabel ? (
              <p className="mt-1 text-muted-foreground">{progressLabel}</p>
            ) : null}
            {job.errorMessage ? (
              <p className="mt-1 text-red-600">{job.errorMessage}</p>
            ) : null}
            {job.results.length > 0 ? (
              <p className="mt-1 text-muted-foreground">
                {job.results.length} partenaire(s) traité(s)
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={handleStart}
          disabled={pending || types.length === 0 || job?.status === "running"}
        >
          {pending || job?.status === "running" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Lancer la recherche
        </Button>
      </div>
    </Card>
  );
}

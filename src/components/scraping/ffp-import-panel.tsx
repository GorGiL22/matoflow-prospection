"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import {
  cleanupFfpConcepteursAction,
  getFfpConcepteurStatsAction,
  importFfpConcepteursAction,
} from "@/actions/ffp";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

interface FfpImportPanelProps {
  initialCount: number;
}

export function FfpImportPanel({ initialCount }: FfpImportPanelProps) {
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCleanup() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await cleanupFfpConcepteursAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      const statsResult = await getFfpConcepteurStatsAction();
      if (statsResult.success) {
        setCount(statsResult.stats.count);
      }

      setMessage(
        `${result.result.emailsFixed} emails corrigés, ${result.result.deleted} doublons supprimés — ${result.result.remaining} agences restantes`
      );
    });
  }

  function handleImport() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await importFfpConcepteursAction();
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { annuaireCount, enrichedCount, imported, updated, errors } =
        result.result;

      const statsResult = await getFfpConcepteurStatsAction();
      if (statsResult.success) {
        setCount(statsResult.stats.count);
      }

      setMessage(
        `${annuaireCount} agences trouvées, ${enrichedCount} fiches enrichies — ${imported} créés, ${updated} mis à jour` +
          (errors.length > 0 ? ` (${errors.length} erreurs)` : "")
      );
    });
  }

  return (
    <Card>
      <CardHeader
        title="Concepteurs FFP"
        description="Importe les ~515 agences de paysage de la Fédération Française du Paysage (f-f-p.org) dans une catégorie dédiée pour vos campagnes ciblées."
      />
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface-muted/40 p-4 text-sm">
          <p>
            <span className="font-medium text-foreground">{count}</span> concepteur
            {count > 1 ? "s" : ""} FFP en base
          </p>
          <p className="mt-2 text-muted">
            L&apos;import récupère nom d&apos;agence, contact, email, téléphone et
            ville depuis l&apos;annuaire public. Comptez 8 à 12 minutes pour
            l&apos;enrichissement complet.
          </p>
        </div>

        {message && <p className="text-sm text-emerald-700">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending}
            className={buttonVariants({ variant: "primary" })}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isPending ? "Import en cours…" : "Lancer l'import FFP"}
          </button>
          <button
            type="button"
            onClick={handleCleanup}
            disabled={isPending}
            className={buttonVariants({ variant: "secondary" })}
          >
            Nettoyer doublons / emails
          </button>
          <Link href="/prospects/concepteurs-ffp" className={buttonVariants({ variant: "secondary" })}>
            Voir les concepteurs FFP
          </Link>
          <Link href="/prospects" className={buttonVariants({ variant: "secondary" })}>
            Tous les prospects
          </Link>
        </div>
      </div>
    </Card>
  );
}

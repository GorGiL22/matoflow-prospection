import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { UnepAreaScanSummary } from "@/types/unep-job";
import { CheckCircle2, Clock3, Loader2, MapPin } from "lucide-react";

export function getUnepAreaScanStatusText(
  summary: UnepAreaScanSummary
): string | null {
  if (summary.isRunning) {
    return "Scan UNEP en cours…";
  }

  if (summary.isFullyScanned) {
    return `Ville analysée — région entièrement parcourue${
      summary.lastUpdatedAt
        ? ` le ${formatDate(summary.lastUpdatedAt)}`
        : ""
    }`;
  }

  if (summary.canResume && summary.resumeFromPage && summary.totalPages) {
    return `Scan partiel · reprise possible page ${summary.resumeFromPage}/${summary.totalPages}${
      summary.lastUpdatedAt
        ? ` · dernier scan ${formatDate(summary.lastUpdatedAt)}`
        : ""
    }`;
  }

  if (summary.hasBeenScanned && summary.importedCount > 0) {
    return `${summary.importedCount} prospect(s) importé(s)${
      summary.lastUpdatedAt
        ? ` · ${formatDate(summary.lastUpdatedAt)}`
        : ""
    }`;
  }

  if (summary.hasBeenScanned) {
    return summary.lastUpdatedAt
      ? `Déjà scannée le ${formatDate(summary.lastUpdatedAt)}`
      : "Déjà scannée";
  }

  return null;
}

export function UnepAreaScanBadge({
  summary,
}: {
  summary: UnepAreaScanSummary;
}) {
  if (summary.isRunning) {
    return (
      <Badge variant="info" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        En cours
      </Badge>
    );
  }

  if (summary.isFullyScanned) {
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Analysée
      </Badge>
    );
  }

  if (summary.hasBeenScanned) {
    return (
      <Badge variant="warning" className="gap-1">
        <Clock3 className="h-3 w-3" />
        Partielle
      </Badge>
    );
  }

  return null;
}

export function UnepAreaScanAlert({
  summary,
  areaName,
}: {
  summary: UnepAreaScanSummary;
  areaName: string;
}) {
  const statusText = getUnepAreaScanStatusText(summary);
  if (!statusText) return null;

  const tone = summary.isFullyScanned
    ? "border-brand-subtle bg-brand-muted text-brand"
    : summary.isRunning
      ? "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tone}`}>
      <p className="flex items-start gap-2 font-medium">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {areaName} — {statusText}
        </span>
      </p>
      {summary.isFullyScanned && (
        <p className="mt-2 pl-6 text-xs opacity-90">
          Cette zone a déjà été entièrement parcourue. Relancer uniquement si
          vous voulez chercher de nouveaux adhérents UNEP.
        </p>
      )}
    </div>
  );
}

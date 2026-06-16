"use client";

import { useState, useTransition } from "react";
import { Download, FileBarChart2, Loader2 } from "lucide-react";
import { exportCampaignReportCsvAction } from "@/actions/campaigns";
import { Card, CardHeader } from "@/components/ui/card";
import type { CampaignReport } from "@/types/campaign";

interface CampaignReportPanelProps {
  report: CampaignReport;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CampaignReportPanel({ report }: CampaignReportPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportCampaignReportCsvAction(report.campaignId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      downloadCsv(result.result.content, result.result.filename);
    });
  }

  const { stats } = report;

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
      <CardHeader
        title="Compte rendu de campagne"
        description="Synthèse des envois et des retours prospects"
      />
      <div className="space-y-4 px-4 pb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Emails envoyés" value={String(stats.emailsSent)} />
          <Metric label="Ouvertures" value={`${report.opened} (${stats.openRate}%)`} />
          <Metric label="Réponses" value={`${report.replied} (${stats.replyRate}%)`} />
          <Metric label="Échecs" value={String(stats.failed)} />
          <Metric label="Intéressés" value={String(stats.interested)} />
          <Metric label="À relancer" value={String(stats.toFollowUp)} />
          <Metric label="Premier envoi" value={formatDate(report.firstSentAt)} />
          <Metric label="Dernier envoi" value={formatDate(report.lastSentAt)} />
        </div>

        {report.completedAt && (
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Campagne terminée le {formatDate(report.completedAt)}.
          </p>
        )}

        {report.pendingDraft > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {report.pendingDraft} email{report.pendingDraft > 1 ? "s" : ""} non
            généré{report.pendingDraft > 1 ? "s" : ""} (hors file d&apos;envoi).
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter le bilan CSV
          </button>
          <p className="inline-flex items-center gap-1 text-xs text-zinc-500">
            <FileBarChart2 className="h-3.5 w-3.5" />
            {stats.totalEmails} ligne{stats.totalEmails > 1 ? "s" : ""} dans le fichier
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2 dark:border-blue-900 dark:bg-zinc-900/60">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

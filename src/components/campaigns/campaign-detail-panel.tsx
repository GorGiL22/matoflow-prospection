"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  generateCampaignEmailsAction,
  startCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
  markEmailRepliedAction,
  resetCampaignForRetestAction,
} from "@/actions/campaigns";
import { Card, CardHeader } from "@/components/ui/card";
import {
  CAMPAIGN_EMAIL_STATUS_LABELS,
  CAMPAIGN_STATUS_LABELS,
  type CampaignDashboardStats,
  type CampaignEmail,
  type EmailCampaign,
} from "@/types/campaign";
import {
  Loader2,
  Pause,
  Play,
  Sparkles,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { CampaignStatsCards } from "./campaign-stats-cards";
import { CampaignEmailExamples } from "./campaign-email-examples";
import { CampaignGenericTemplateForm } from "./campaign-generic-template-form";
import { CAMPAIGN_CONTENT_MODE_LABELS } from "@/types/campaign";
import { FileText } from "lucide-react";

interface CampaignDetailPanelProps {
  campaign: EmailCampaign;
  emails: CampaignEmail[];
  stats: CampaignDashboardStats;
}

const statusBadge: Record<string, string> = {
  draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  paused: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  scheduled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
  sent: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  opened: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-400",
  replied: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
};

export function CampaignDetailPanel({
  campaign,
  emails,
  stats,
}: CampaignDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftsWithoutContent = emails.filter((e) => !e.subject).length;
  const readyToSchedule = emails.filter((e) => e.subject && e.statut === "draft").length;
  const isGeneric = campaign.contentMode === "generic";
  const canEdit = campaign.statut === "draft";

  function runAction(fn: () => Promise<{ success: boolean; error?: string; generated?: number; remaining?: number }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setError(result.error ?? "Erreur");
        return;
      }
      if (result.generated !== undefined) {
        setMessage(
          `${result.generated} email(s) généré(s). ${result.remaining ?? 0} restant(s).`
        );
      } else {
        setMessage("Action effectuée.");
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {campaign.nom}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[campaign.statut]}`}
            >
              {CAMPAIGN_STATUS_LABELS[campaign.statut]}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {stats.totalEmails} prospect(s) · {campaign.sentTodayCount}/{campaign.dailyLimit} envoyés aujourd&apos;hui ·{" "}
            {CAMPAIGN_CONTENT_MODE_LABELS[campaign.contentMode]}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {campaign.statut === "draft" && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  runAction(() => generateCampaignEmailsAction(campaign.id))
                }
                className={
                  isGeneric
                    ? "inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                    : "inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                }
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isGeneric ? (
                  <FileText className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGeneric
                  ? `Générer les emails (${draftsWithoutContent})`
                  : `Générer emails IA (${draftsWithoutContent})`}
              </button>
              {readyToSchedule > 0 && (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => runAction(() => startCampaignAction(campaign.id))}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  Lancer ({readyToSchedule})
                </button>
              )}
            </>
          )}
          {campaign.statut === "active" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => pauseCampaignAction(campaign.id))}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              <Pause className="h-4 w-4" />
              Mettre en pause
            </button>
          )}
          {campaign.statut === "paused" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runAction(() => resumeCampaignAction(campaign.id))}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              Reprendre
            </button>
          )}
          {stats.totalEmails > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                runAction(async () => {
                  if (
                    !confirm(
                      "Réinitialiser cette campagne ? Les emails repassent en brouillon et les prospects sont remis « À contacter » pour un retest."
                    )
                  ) {
                    return { success: false, error: "Annulé" };
                  }
                  return resetCampaignForRetestAction(campaign.id);
                })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"
            >
              <RotateCcw className="h-4 w-4" />
              Débloquer pour retest
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <CampaignStatsCards stats={stats} />

      {isGeneric && canEdit && (
        <CampaignGenericTemplateForm campaign={campaign} editable={canEdit} />
      )}

      <CampaignEmailExamples campaign={campaign} emails={emails} />

      <Card>
        <CardHeader
          title="Emails de la campagne"
          description="Contenu personnalisé, statut d'envoi et suivi"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Objet</th>
                <th className="px-4 py-3">Accroche IA</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr
                  key={email.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{email.prospect?.nomEntreprise}</p>
                    <p className="text-xs text-zinc-500">
                      {email.prospect?.email}
                      {email.prospect?.statut === "contacte" && email.statut !== "draft" && (
                        <span className="ml-2 text-blue-600">· Contacté</span>
                      )}
                    </p>
                  </td>
                  <td className="max-w-xs px-4 py-3">
                    {email.subject ?? (
                      <span className="text-zinc-400">Non généré</span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                    {email.personalizationHook ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${statusBadge[email.statut]}`}
                    >
                      {CAMPAIGN_EMAIL_STATUS_LABELS[email.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {email.sentAt && <p>Envoyé : {formatDate(email.sentAt)}</p>}
                    {email.openedAt && <p>Ouvert : {formatDate(email.openedAt)}</p>}
                    {email.repliedAt && <p>Répondu : {formatDate(email.repliedAt)}</p>}
                    {email.scheduledAt && email.statut === "scheduled" && (
                      <p>Planifié : {formatDate(email.scheduledAt)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {(email.statut === "sent" || email.statut === "opened") && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await markEmailRepliedAction(email.id, campaign.id);
                            router.refresh();
                          })
                        }
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Marquer répondu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {emails.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              Aucun email dans cette campagne.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

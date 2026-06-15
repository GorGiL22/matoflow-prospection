"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Sparkles, FileText } from "lucide-react";
import type { CampaignEmail, EmailCampaign } from "@/types/campaign";
import { cn } from "@/lib/utils";
import { CampaignEmailEditor } from "./campaign-email-editor";

interface CampaignEmailExamplesProps {
  campaign: EmailCampaign;
  emails: CampaignEmail[];
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function CampaignEmailPreviewCard({
  email,
  campaign,
}: {
  email: CampaignEmail;
  campaign: EmailCampaign;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!email.body || !email.subject) return null;

  const words = countWords(email.body);
  const editable =
    campaign.statut === "draft" && email.statut === "draft";
  const isGeneric = campaign.contentMode === "generic";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 bg-zinc-50 px-4 py-3 text-left hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            {email.prospect?.nomEntreprise ?? "Prospect"}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-500">
            Objet : {email.subject}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              isGeneric
                ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            )}
          >
            {words} mots
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
          {!isGeneric && email.personalizationHook && (
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/50">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                Accroche personnalisée
              </p>
              <p className="mt-1 text-sm text-violet-900 dark:text-violet-100">
                « {email.personalizationHook} »
              </p>
            </div>
          )}

          <CampaignEmailEditor
            email={email}
            campaignId={campaign.id}
            editable={editable}
          />

          {email.analysisSummary && (
            <p className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">
                Source :
              </span>{" "}
              {email.analysisSummary}
            </p>
          )}
        </div>
      )}
    </article>
  );
}

export function CampaignEmailExamples({
  campaign,
  emails,
}: CampaignEmailExamplesProps) {
  const generated = emails.filter((e) => e.body && e.subject);
  const pending = emails.filter((e) => !e.body).length;
  const isGeneric = campaign.contentMode === "generic";

  if (generated.length === 0 && pending === 0) return null;

  return (
    <Card>
      <CardHeader
        title={isGeneric ? "Emails générés (modèle)" : "Emails personnalisés IA"}
        description={
          generated.length > 0
            ? isGeneric
              ? `${generated.length} email(s) — nom d'entreprise inséré automatiquement, modifiable avant envoi`
              : `${generated.length} email(s) généré(s) — modifiables avant envoi`
            : isGeneric
              ? `${pending} email(s) en attente — cliquez sur « Générer les emails »`
              : `${pending} email(s) en attente — cliquez sur « Générer emails IA »`
        }
      />

      {generated.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
          {isGeneric ? (
            <FileText className="mx-auto h-8 w-8 text-zinc-300" />
          ) : (
            <Sparkles className="mx-auto h-8 w-8 text-zinc-300" />
          )}
          <p className="mt-2 text-sm text-zinc-500">
            Les aperçus apparaîtront ici après génération.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            "space-y-4",
            generated.length > 3 && "max-h-[70vh] overflow-y-auto pr-1"
          )}
        >
          {generated.map((email) => (
            <CampaignEmailPreviewCard
              key={email.id}
              email={email}
              campaign={campaign}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCampaignAction } from "@/actions/campaigns";
import { CAMPAIGN_DEFAULTS, CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS, CAMPAIGN_TEMPLATE_PLACEHOLDERS } from "@/config/constants";
import { Card, CardHeader } from "@/components/ui/card";
import { inputClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CampaignProspectPicker,
  type CampaignProspectCandidate,
} from "./campaign-prospect-picker";
import { Loader2, Mail, Sparkles, FileText } from "lucide-react";

type SelectionMode = "auto" | "manual";
type ContentMode = "ai" | "generic";

interface CampaignCreateFormProps {
  eligibleProspects: CampaignProspectCandidate[];
}

export function CampaignCreateForm({
  eligibleProspects,
}: CampaignCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("auto");
  const [contentMode, setContentMode] = useState<ContentMode>("generic");
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [genericSubject, setGenericSubject] = useState<string>(
    CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.subject
  );
  const [genericBody, setGenericBody] = useState<string>(
    CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.body
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    if (selectionMode === "manual" && selectedProspectIds.length === 0) {
      setError("Sélectionnez au moins un prospect");
      return;
    }

    startTransition(async () => {
      const result = await createCampaignAction({
        nom: String(form.get("nom")),
        dailyLimit: Number(form.get("dailyLimit")),
        minDelayMinutes: Number(form.get("minDelayMinutes")),
        maxDelayMinutes: Number(form.get("maxDelayMinutes")),
        selectionMode,
        contentMode,
        genericSubjectTemplate:
          contentMode === "generic" ? genericSubject : undefined,
        genericBodyTemplate: contentMode === "generic" ? genericBody : undefined,
        minScore:
          selectionMode === "auto" && form.get("minScore")
            ? Number(form.get("minScore"))
            : undefined,
        limit:
          selectionMode === "auto"
            ? Number(form.get("limit") || 50)
            : undefined,
        prospectIds:
          selectionMode === "manual" ? selectedProspectIds : undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/campagnes/${result.campaign.id}`);
    });
  }

  return (
    <Card>
      <CardHeader
        title="Nouvelle campagne emailing"
        description="Emails personnalisés par l'IA — envois étalés avec limites anti-spam"
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Nom de la campagne</label>
          <input
            name="nom"
            required
            className={inputClassName}
            placeholder="Ex : Lyon paysagistes Q2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Max emails / jour
            </label>
            <input
              name="dailyLimit"
              type="number"
              min={1}
              max={100}
              defaultValue={CAMPAIGN_DEFAULTS.dailyLimit}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Délai min (min)
            </label>
            <input
              name="minDelayMinutes"
              type="number"
              min={1}
              max={60}
              defaultValue={CAMPAIGN_DEFAULTS.minDelayMinutes}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Délai max (min)
            </label>
            <input
              name="maxDelayMinutes"
              type="number"
              min={2}
              max={120}
              defaultValue={CAMPAIGN_DEFAULTS.maxDelayMinutes}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Contenu des emails</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setContentMode("generic")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                contentMode === "generic"
                  ? "bg-sky-600 text-white"
                  : "border border-border bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Message générique (gratuit)
            </button>
            <button
              type="button"
              onClick={() => setContentMode("ai")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                contentMode === "ai"
                  ? "bg-violet-600 text-white"
                  : "border border-border bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Personnalisation IA
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {contentMode === "generic"
              ? `Même texte pour tous avec ${CAMPAIGN_TEMPLATE_PLACEHOLDERS.join(" et ")} remplacés — sans coût API.`
              : "Analyse du site et email unique par prospect (OpenAI)."}
          </p>
        </div>

        {contentMode === "generic" && (
          <div className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Objet modèle</label>
              <input
                value={genericSubject}
                onChange={(e) => setGenericSubject(e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Corps modèle</label>
              <textarea
                value={genericBody}
                onChange={(e) => setGenericBody(e.target.value)}
                rows={10}
                className={`${inputClassName} font-mono text-sm`}
              />
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Prospects ciblés</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectionMode("auto")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectionMode === "auto"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              Sélection automatique
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("manual")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectionMode === "manual"
                  ? "bg-brand text-brand-foreground"
                  : "border border-border bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              Sélection manuelle
            </button>
          </div>
        </div>

        {selectionMode === "auto" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Score IA minimum
                </label>
                <input
                  name="minScore"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Ex : 50 (optionnel)"
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Max prospects
                </label>
                <input
                  name="limit"
                  type="number"
                  min={1}
                  max={500}
                  defaultValue={50}
                  className={inputClassName}
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              Prospects « À contacter » avec email, triés par score IA. Les
              entreprises déjà contactées ou incluses dans une autre campagne
              sont exclues. Le statut passe à « Contacté » dès l&apos;envoi
              réussi de l&apos;email.
            </p>
          </>
        ) : (
          <CampaignProspectPicker
            prospects={eligibleProspects}
            selectedIds={selectedProspectIds}
            onChange={setSelectedProspectIds}
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Créer la campagne
            {selectionMode === "manual" && selectedProspectIds.length > 0
              ? ` (${selectedProspectIds.length})`
              : ""}
          </button>
          <Link
            href="/campagnes"
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface-muted"
          >
            Annuler
          </Link>
        </div>
      </form>
    </Card>
  );
}

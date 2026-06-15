"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCampaignTemplatesAction } from "@/actions/campaigns";
import { CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS, CAMPAIGN_TEMPLATE_PLACEHOLDERS } from "@/config/constants";
import { inputClassName } from "@/components/ui/input";
import { Loader2, Save } from "lucide-react";
import type { EmailCampaign } from "@/types/campaign";

interface CampaignGenericTemplateFormProps {
  campaign: EmailCampaign;
  editable: boolean;
}

export function CampaignGenericTemplateForm({
  campaign,
  editable,
}: CampaignGenericTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [subjectTemplate, setSubjectTemplate] = useState(
    campaign.genericSubjectTemplate ?? CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.subject
  );
  const [bodyTemplate, setBodyTemplate] = useState(
    campaign.genericBodyTemplate ?? CAMPAIGN_GENERIC_TEMPLATE_DEFAULTS.body
  );

  function handleSave() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateCampaignTemplatesAction({
        campaignId: campaign.id,
        genericSubjectTemplate: subjectTemplate,
        genericBodyTemplate: bodyTemplate,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Modèle enregistré.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">Modèle générique</p>
        <p className="text-xs text-muted">
          Sans appel IA —{" "}
          {CAMPAIGN_TEMPLATE_PLACEHOLDERS.join(" et ")} sont remplacés pour
          chaque prospect.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Objet</label>
        <input
          value={subjectTemplate}
          onChange={(e) => setSubjectTemplate(e.target.value)}
          disabled={!editable || isPending}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">Corps du message</label>
        <textarea
          value={bodyTemplate}
          onChange={(e) => setBodyTemplate(e.target.value)}
          disabled={!editable || isPending}
          rows={12}
          className={`${inputClassName} font-mono text-sm`}
        />
      </div>

      {editable && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-muted disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer le modèle
        </button>
      )}

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

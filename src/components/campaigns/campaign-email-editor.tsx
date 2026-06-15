"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCampaignEmailAction } from "@/actions/campaigns";
import { inputClassName } from "@/components/ui/input";
import { Loader2, Pencil, X, Check } from "lucide-react";
import type { CampaignEmail } from "@/types/campaign";

interface CampaignEmailEditorProps {
  email: CampaignEmail;
  campaignId: string;
  editable: boolean;
}

export function CampaignEmailEditor({
  email,
  campaignId,
  editable,
}: CampaignEmailEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(email.subject ?? "");
  const [body, setBody] = useState(email.body ?? "");

  if (!email.subject || !email.body) return null;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCampaignEmailAction({
        emailId: email.id,
        campaignId,
        subject,
        body,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
      router.refresh();
    });
  }

  function handleCancel() {
    setSubject(email.subject ?? "");
    setBody(email.body ?? "");
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="space-y-3">
        {editable && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier le texte
          </button>
        )}
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-xs font-medium text-zinc-500">Objet</p>
          <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {email.subject}
          </p>
          <p className="mt-4 text-xs font-medium text-zinc-500">Corps de l&apos;email</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {email.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Objet</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isPending}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Corps de l&apos;email
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isPending}
          rows={14}
          className={`${inputClassName} font-mono text-sm`}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          <X className="h-4 w-4" />
          Annuler
        </button>
      </div>
    </div>
  );
}

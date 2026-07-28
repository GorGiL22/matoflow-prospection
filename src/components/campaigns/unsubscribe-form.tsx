"use client";

import { useState, useTransition } from "react";
import { confirmUnsubscribeAction } from "@/actions/unsubscribe";

interface UnsubscribeFormProps {
  campaignEmailId: string;
  token: string;
  nomEntreprise: string;
  alreadyUnsubscribed: boolean;
}

export function UnsubscribeForm({
  campaignEmailId,
  token,
  nomEntreprise,
  alreadyUnsubscribed,
}: UnsubscribeFormProps) {
  const [done, setDone] = useState(alreadyUnsubscribed);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await confirmUnsubscribeAction(campaignEmailId, token);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
          Vous êtes désabonné
        </p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          {nomEntreprise} ne recevra plus d&apos;emails de prospection MatoFlow.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <p className="text-sm text-muted">
        Confirmez le désabonnement pour{" "}
        <span className="font-medium text-foreground">{nomEntreprise}</span>.
        Vous ne recevrez plus nos emails de campagne.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={isPending}
        className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-hover disabled:opacity-50"
      >
        {isPending ? "Désabonnement…" : "Se désabonner"}
      </button>
    </div>
  );
}

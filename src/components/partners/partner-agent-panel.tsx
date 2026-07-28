"use client";

import { useState, useTransition } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { askPartnerAgentAction } from "@/actions/partners";

const SUGGESTIONS = [
  "Quels sont les meilleurs partenaires à contacter cette semaine ?",
  "Quels partenaires ressemblent à Common Gaia ?",
  "Quels cabinets comptables seraient les plus pertinents ?",
  "Quels partenaires ont le plus fort potentiel ?",
];

export function PartnerAgentPanel() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask(q: string) {
    setError(null);
    setAnswer(null);
    setQuestion(q);
    startTransition(async () => {
      const result = await askPartnerAgentAction(q);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setAnswer(result.answer);
    });
  }

  return (
    <Card>
      <CardHeader
        title="Agent partenariats"
        description="Posez des questions sur votre portefeuille (priorités, similarité Common Gaia, cabinets, potentiel…)."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => ask(s)}
            className="rounded-full border border-border px-3 py-1 text-left text-xs text-muted-foreground hover:border-brand hover:text-brand"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Votre question…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim()) ask(question);
          }}
        />
        <Button
          type="button"
          disabled={pending || !question.trim()}
          onClick={() => ask(question)}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Demander
        </Button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : null}

      {answer ? (
        <div className="mt-4 rounded-xl border border-border bg-surface-muted/40 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand">
            <Bot className="h-3.5 w-3.5" />
            Réponse
          </div>
          {answer}
        </div>
      ) : null}
    </Card>
  );
}

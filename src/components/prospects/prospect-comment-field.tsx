"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateProspectCommentAction } from "@/actions/prospects";
import { cn } from "@/lib/utils";

interface ProspectCommentFieldProps {
  prospectId: string;
  initialValue: string | null;
  compact?: boolean;
  className?: string;
}

export function ProspectCommentField({
  prospectId,
  initialValue,
  compact = false,
  className,
}: ProspectCommentFieldProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lastSavedRef = useRef(initialValue ?? "");

  useEffect(() => {
    const next = initialValue ?? "";
    setValue(next);
    lastSavedRef.current = next;
  }, [initialValue, prospectId]);

  function save(nextValue: string) {
    const normalized = nextValue.trim();
    if (normalized === lastSavedRef.current.trim()) return;

    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProspectCommentAction({
        prospectId,
        commentaire: normalized || null,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      lastSavedRef.current = normalized;
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleBlur() {
    save(value);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.blur();
    }
  }

  return (
    <div className={cn("relative", className)}>
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={isPending}
        rows={compact ? 2 : 4}
        placeholder="Ex. rappeler mardi, pas intéressé pour l'instant…"
        className={cn(
          "w-full resize-y rounded-lg border border-border bg-surface px-2.5 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60",
          compact && "min-w-[12rem] text-xs"
        )}
        aria-label="Commentaire sur le prospect"
      />
      <div className="mt-1 flex min-h-[1rem] items-center gap-2 text-xs text-muted-foreground">
        {isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Enregistrement…
          </>
        ) : saved ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            Commentaire enregistré
          </span>
        ) : compact ? (
          <span>Ctrl+Entrée pour enregistrer</span>
        ) : (
          <span>Enregistré automatiquement à la sortie du champ · Ctrl+Entrée</span>
        )}
        {error ? (
          <span className="text-red-600 dark:text-red-400">{error}</span>
        ) : null}
      </div>
    </div>
  );
}

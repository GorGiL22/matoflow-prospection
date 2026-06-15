"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteProspectAction } from "@/actions/prospects";
import { cn } from "@/lib/utils";

interface ProspectDeleteButtonProps {
  prospectId: string;
  prospectName: string;
  redirectTo?: string;
  compact?: boolean;
  className?: string;
}

export function ProspectDeleteButton({
  prospectId,
  prospectName,
  redirectTo,
  compact = false,
  className,
}: ProspectDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const message = compact
      ? `Supprimer « ${prospectName} » ?`
      : `Supprimer « ${prospectName} » ? Cette action est irréversible (notes et historique inclus).`;

    if (!window.confirm(message)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteProspectAction(prospectId);
      if (!result.success) {
        setError(result.error);
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className={cn("inline-flex flex-col items-end gap-1", className)}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        title={`Supprimer ${prospectName}`}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50",
          compact
            ? "p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
            : "border border-red-200 bg-white px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {!compact && "Supprimer"}
      </button>
      {error ? (
        <span className="max-w-[200px] text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}

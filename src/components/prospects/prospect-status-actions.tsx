"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatusAction } from "@/actions/prospects";
import { cn } from "@/lib/utils";
import {
  PIPELINE_STATUSES,
  STATUS_ACTIVE_CLASSES,
  STATUS_LABELS,
  type ProspectStatus,
} from "@/types/prospect";

interface ProspectStatusActionsProps {
  prospectId: string;
  currentStatus: ProspectStatus;
}

export function ProspectStatusActions({
  prospectId,
  currentStatus,
}: ProspectStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: ProspectStatus) {
    if (newStatus === currentStatus) return;

    startTransition(async () => {
      const result = await updateStatusAction({ prospectId, statut: newStatus });
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PIPELINE_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          disabled={isPending}
          onClick={() => handleStatusChange(status)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
            currentStatus === status
              ? STATUS_ACTIVE_CLASSES[status]
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          )}
        >
          {STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatusAction } from "@/actions/prospects";
import { cn } from "@/lib/utils";
import {
  PIPELINE_STATUSES,
  STATUS_ACTIVE_CLASSES,
  STATUS_SHORT_LABELS,
  type ProspectStatus,
} from "@/types/prospect";

interface ProspectStatusQuickActionsProps {
  prospectId: string;
  currentStatus: ProspectStatus;
}

export function ProspectStatusQuickActions({
  prospectId,
  currentStatus,
}: ProspectStatusQuickActionsProps) {
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
    <div className="flex min-w-[320px] flex-wrap gap-1">
      {PIPELINE_STATUSES.map((status) => {
        const isActive = currentStatus === status;

        return (
          <button
            key={status}
            type="button"
            disabled={isPending}
            title={STATUS_SHORT_LABELS[status]}
            onClick={() => handleStatusChange(status)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-50",
              isActive
                ? STATUS_ACTIVE_CLASSES[status]
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            )}
          >
            {STATUS_SHORT_LABELS[status]}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  UNEP_SEARCH_STEPS,
  UNEP_SEARCH_STEP_LABELS,
  type UnepSearchStep,
} from "@/types/unep-search";

interface UnepSearchStepsProps {
  activeStep: UnepSearchStep | null;
  completedSteps: Set<UnepSearchStep>;
  errorStep: UnepSearchStep | null;
}

export function UnepSearchSteps({
  activeStep,
  completedSteps,
  errorStep,
}: UnepSearchStepsProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {UNEP_SEARCH_STEPS.map((step, index) => {
        const isComplete = completedSteps.has(step);
        const isActive = activeStep === step;
        const isError = errorStep === step;

        return (
          <li
            key={step}
            className={cn(
              "rounded-xl border p-3 transition-all duration-300",
              isComplete &&
                "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
              isActive &&
                !isComplete &&
                "border-violet-300 bg-violet-50 shadow-sm dark:border-violet-800 dark:bg-violet-950/40",
              !isComplete &&
                !isActive &&
                "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
              isError &&
                "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              {isError ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              ) : (
                <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
              )}
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {index + 1}
              </span>
            </div>
            <p
              className={cn(
                "text-xs font-medium leading-snug",
                isActive && "text-violet-700 dark:text-violet-300",
                isComplete && "text-emerald-700 dark:text-emerald-300",
                !isActive && !isComplete && "text-zinc-600 dark:text-zinc-400"
              )}
            >
              {UNEP_SEARCH_STEP_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ANALYSIS_STEPS,
  ANALYSIS_STEP_LABELS,
  type AnalysisStep,
} from "@/types/analysis";

interface AnalysisStepsProps {
  activeStep: AnalysisStep | null;
  completedSteps: Set<AnalysisStep>;
  errorStep: AnalysisStep | null;
}

export function AnalysisSteps({
  activeStep,
  completedSteps,
  errorStep,
}: AnalysisStepsProps) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {ANALYSIS_STEPS.map((step, index) => {
        const isComplete = completedSteps.has(step);
        const isActive = activeStep === step;
        const isError = errorStep === step;

        return (
          <li
            key={step}
            className={cn(
              "rounded-xl border p-3 transition-all duration-300",
              isComplete &&
                "border-brand-subtle bg-brand-muted/60",
              isActive &&
                !isComplete &&
                "border-accent-subtle bg-accent-muted shadow-sm",
              !isComplete &&
                !isActive &&
                "border-border bg-surface",
              isError && "border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              {isError ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-brand" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {index + 1}
              </span>
            </div>
            <p
              className={cn(
                "text-xs font-medium leading-snug",
                isActive && "text-accent",
                isComplete && "text-brand",
                !isActive && !isComplete && "text-muted"
              )}
            >
              {ANALYSIS_STEP_LABELS[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

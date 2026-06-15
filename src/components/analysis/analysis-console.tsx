"use client";

import { ActivityFeed } from "@/components/ui/activity-feed";
import {
  ANALYSIS_STEP_LABELS,
  type AnalysisLogEvent,
} from "@/types/analysis";

interface AnalysisConsoleProps {
  logs: AnalysisLogEvent[];
  isRunning: boolean;
}

export function AnalysisConsole({ logs, isRunning }: AnalysisConsoleProps) {
  return (
    <ActivityFeed
      logs={logs}
      stepLabels={ANALYSIS_STEP_LABELS}
      isRunning={isRunning}
      title="Journal d'analyse"
      description="Étapes de qualification et génération de contenu"
      emptyMessage="Sélectionnez un prospect et lancez l'analyse pour suivre la progression."
    />
  );
}

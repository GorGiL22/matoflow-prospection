"use client";

import { ActivityFeed } from "@/components/ui/activity-feed";
import {
  UNEP_SEARCH_STEP_LABELS,
  type UnepSearchLogEvent,
} from "@/types/unep-search";

interface UnepSearchConsoleProps {
  logs: UnepSearchLogEvent[];
  isRunning: boolean;
  areaName?: string;
}

export function UnepSearchConsole({
  logs,
  isRunning,
  areaName = "la zone cible",
}: UnepSearchConsoleProps) {
  return (
    <ActivityFeed
      logs={logs}
      stepLabels={UNEP_SEARCH_STEP_LABELS}
      isRunning={isRunning}
      title="Journal d'activité"
      description="Prospects trouvés et actions en temps réel"
      emptyMessage={`Lancez une recherche UNEP sur ${areaName} pour voir l'activité ici.`}
    />
  );
}

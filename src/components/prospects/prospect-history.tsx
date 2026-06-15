import { formatDate } from "@/lib/utils";
import {
  ACTIVITY_TYPE_LABELS,
  type ProspectActivity,
} from "@/types/prospect";

interface ProspectHistoryProps {
  activites: ProspectActivity[];
}

export function ProspectHistory({ activites }: ProspectHistoryProps) {
  if (activites.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Aucune activité enregistrée.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {activites.map((activite) => (
        <li key={activite.id} className="relative pl-6">
          <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {ACTIVITY_TYPE_LABELS[activite.type] ?? activite.type}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {activite.description}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            {formatDate(activite.dateCreation)}
          </p>
        </li>
      ))}
    </ul>
  );
}

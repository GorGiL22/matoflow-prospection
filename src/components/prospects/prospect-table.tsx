import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getScoreBgColor, getScoreColor, formatDate } from "@/lib/utils";
import type { Prospect, ProspectStatus } from "@/types/prospect";
import { STATUS_LABELS } from "@/types/prospect";

const statusVariants: Record<
  ProspectStatus,
  "default" | "info" | "warning" | "success" | "danger"
> = {
  nouveau: "info",
  contacte: "warning",
  relance: "warning",
  rdv: "success",
  client: "success",
  refuse: "danger",
};

interface ProspectTableProps {
  prospects: Prospect[];
}

export function ProspectTable({ prospects }: ProspectTableProps) {
  if (prospects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
        <p className="text-zinc-500">Aucun prospect pour le moment.</p>
        <Link
          href="/prospects/nouveau"
          className="mt-2 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          Ajouter un premier prospect →
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            <th className="px-4 py-3 font-medium text-zinc-600">Entreprise</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Ville</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Score IA</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Statut</th>
            <th className="px-4 py-3 font-medium text-zinc-600">Ajouté le</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {prospects.map((prospect) => (
            <tr key={prospect.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="font-medium text-zinc-900 hover:text-emerald-600"
                >
                  {prospect.company_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {prospect.city ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getScoreBgColor(prospect.ai_score)} ${getScoreColor(prospect.ai_score)}`}
                >
                  {prospect.ai_score ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={statusVariants[prospect.status]}>
                  {STATUS_LABELS[prospect.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {formatDate(prospect.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

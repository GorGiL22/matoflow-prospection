import {
  Users,
  Sparkles,
  Star,
  Phone,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/types/prospect";

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  {
    key: "total_prospects" as const,
    label: "Total prospects",
    icon: Users,
    color: "text-zinc-600",
    bg: "bg-zinc-100",
  },
  {
    key: "nouveaux" as const,
    label: "Nouveaux",
    icon: Sparkles,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "prioritaires" as const,
    label: "Prioritaires",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "contactes" as const,
    label: "Contactés",
    icon: Phone,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "clients" as const,
    label: "Clients obtenus",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {stats[card.key]}
              </p>
              <p className="text-xs text-zinc-500">{card.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

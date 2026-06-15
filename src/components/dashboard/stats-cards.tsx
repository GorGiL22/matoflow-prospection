import {
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardStats } from "@/types/prospect";

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  {
    key: "totalProspects" as const,
    label: "Total prospects",
    icon: Users,
    iconClass: "text-muted",
    bg: "bg-surface-muted",
  },
  {
    key: "nouveaux" as const,
    label: "À contacter",
    icon: Sparkles,
    iconClass: "text-accent",
    bg: "bg-accent-muted",
  },
  {
    key: "clients" as const,
    label: "Clients",
    icon: CheckCircle2,
    iconClass: "text-brand",
    bg: "bg-brand-muted",
  },
  {
    key: "tauxConversion" as const,
    label: "Taux de conversion",
    icon: TrendingUp,
    iconClass: "text-brand-light",
    bg: "bg-brand-muted",
  },
  {
    key: "prioritaires" as const,
    label: "Prioritaires",
    icon: Star,
    iconClass: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}
            >
              <card.icon className={`h-5 w-5 ${card.iconClass}`} />
            </div>
            <div>
              <p className="font-mono text-2xl font-bold tracking-tight text-foreground">
                {card.key === "tauxConversion"
                  ? `${stats[card.key]}%`
                  : stats[card.key]}
              </p>
              <p className="text-xs text-muted">{card.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

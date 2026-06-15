import { Card } from "@/components/ui/card";
import type { CampaignDashboardStats } from "@/types/campaign";

interface CampaignStatsCardsProps {
  stats: CampaignDashboardStats;
}

const cards = [
  { key: "emailsSent" as const, label: "Emails envoyés", suffix: "" },
  { key: "openRate" as const, label: "Taux d'ouverture", suffix: "%" },
  { key: "replyRate" as const, label: "Taux de réponse", suffix: "%" },
  { key: "interested" as const, label: "Prospects intéressés", suffix: "" },
  { key: "toFollowUp" as const, label: "À relancer", suffix: "" },
];

export function CampaignStatsCards({ stats }: CampaignStatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.key} className="p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats[card.key]}
            {card.suffix}
          </p>
          <p className="text-xs text-zinc-500">{card.label}</p>
        </Card>
      ))}
    </div>
  );
}

import Link from "next/link";
import { prospectService } from "@/modules/prospects/service";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { DashboardStats } from "@/types/prospect";

const emptyStats: DashboardStats = {
  totalProspects: 0,
  nouveaux: 0,
  contactes: 0,
  relances: 0,
  rdv: 0,
  clients: 0,
  refuses: 0,
  prioritaires: 0,
  tauxConversion: 0,
  scoreMoyen: null,
};

export default async function DashboardPage() {
  let stats = emptyStats;
  let priorityProspects: Awaited<
    ReturnType<typeof prospectService.getDashboardData>
  >["priorityProspects"] = [];
  let recentProspects: Awaited<
    ReturnType<typeof prospectService.getDashboardData>
  >["recentProspects"] = [];

  try {
    const data = await prospectService.getDashboardData();
    stats = data.stats;
    priorityProspects = data.priorityProspects;
    recentProspects = data.recentProspects;
  } catch {
    // Base SQLite non initialisée ou erreur temporaire
  }

  return (
    <div className="space-y-8">
      <PageHeader
        badge="Vue d'ensemble"
        title="Dashboard"
        description="Suivez votre pipeline de prospection paysagiste en temps réel."
      />

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Prospects prioritaires"
            description="Score IA ≥ 70 — à contacter en priorité"
          />
          <ProspectTable prospects={priorityProspects} />
        </Card>

        <Card>
          <CardHeader
            title="Derniers ajouts"
            description="Les 10 prospects les plus récents"
            action={
              <Link
                href="/prospects"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Voir tout →
              </Link>
            }
          />
          <ProspectTable prospects={recentProspects} />
        </Card>
      </div>
    </div>
  );
}

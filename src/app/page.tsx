import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { Card, CardHeader } from "@/components/ui/card";
import type { DashboardStats } from "@/types/prospect";

const emptyStats: DashboardStats = {
  total_prospects: 0,
  nouveaux: 0,
  contactes: 0,
  relances: 0,
  rdv: 0,
  clients: 0,
  refuses: 0,
  prioritaires: 0,
  score_moyen: null,
};

async function getDashboardData() {
  try {
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    return await service.getDashboardData();
  } catch {
    return {
      stats: emptyStats,
      priorityProspects: [],
      recentProspects: [],
    };
  }
}

export default async function DashboardPage() {
  const { stats, priorityProspects, recentProspects } =
    await getDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vue d&apos;ensemble de votre prospection MatoFlow
        </p>
      </div>

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
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">
                Derniers ajouts
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Les 10 prospects les plus récents
              </p>
            </div>
            <Link
              href="/prospects"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Voir tout →
            </Link>
          </div>
          <ProspectTable prospects={recentProspects} />
        </Card>
      </div>
    </div>
  );
}

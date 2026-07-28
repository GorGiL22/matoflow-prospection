import Link from "next/link";
import { Bot, Search, Users } from "lucide-react";
import { partnerRepository } from "@/modules/partners/crm/repository";
import { PartnerTable } from "@/components/partners/partner-table";
import { PartnerCreateForm } from "@/components/partners/partner-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import type { PartnerDashboardStats } from "@/types/partner";

export const dynamic = "force-dynamic";

export default async function PartenairesPage() {
  let partners: Awaited<ReturnType<typeof partnerRepository.list>> = [];
  let stats: PartnerDashboardStats | null = null;

  try {
    [partners, stats] = await Promise.all([
      partnerRepository.list(),
      partnerRepository.getDashboardStats(),
    ]);
  } catch {
    partners = [];
    stats = null;
  }

  const cards = [
    { label: "Partenaires", value: stats?.total ?? 0 },
    { label: "Actifs", value: stats?.actifs ?? 0 },
    { label: "Rendez-vous", value: stats?.rendezVous ?? 0 },
    { label: "Partenariats signés", value: stats?.partenariats ?? 0 },
    { label: "Clients générés", value: stats?.clientsGeneres ?? 0 },
    { label: "MRR généré", value: `${stats?.mrrGenere ?? 0} €` },
    { label: "Commissions", value: `${stats?.commissionsVersees ?? 0} €` },
    { label: "Valeur totale", value: `${stats?.valeurTotale ?? 0} €` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partenaires"
        description="CRM de découverte et suivi des partenaires MatoFlow"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/partenaires/recherche"
              className={buttonVariants({ variant: "primary" })}
            >
              <Search className="h-4 w-4" />
              Rechercher
            </Link>
            <Link
              href="/partenaires/agent"
              className={buttonVariants({ variant: "secondary" })}
            >
              <Bot className="h-4 w-4" />
              Agent IA
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {card.value}
            </p>
          </Card>
        ))}
      </div>

      <PartnerCreateForm />

      <Card>
        <CardHeader
          title="Portefeuille"
          description={`${partners.length} partenaire${partners.length > 1 ? "s" : ""}`}
          action={
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Classés par score
            </span>
          }
        />
        <PartnerTable partners={partners} />
      </Card>
    </div>
  );
}

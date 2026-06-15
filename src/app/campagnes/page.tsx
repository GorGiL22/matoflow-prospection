import Link from "next/link";
import { Plus, Mail } from "lucide-react";
import { campaignService } from "@/modules/campaigns/service";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  CAMPAIGN_STATUS_LABELS,
  type EmailCampaign,
} from "@/types/campaign";

export const dynamic = "force-dynamic";

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "info"
> = {
  draft: "default",
  active: "success",
  paused: "warning",
  completed: "info",
};

export default async function CampagnesPage() {
  let campaigns: EmailCampaign[] = [];

  try {
    campaigns = await campaignService.listCampaigns();
  } catch {
    campaigns = [];
  }

  const hasActive = campaigns.some((c) => c.statut === "active");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campagnes email"
        description="Prospection personnalisée par IA — envois étalés et suivi des ouvertures."
        actions={
          <Link
            href="/campagnes/nouvelle"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Nouvelle campagne
          </Link>
        }
      />

      {hasActive && (
        <div className="rounded-xl border border-brand-subtle bg-brand-muted px-4 py-3 text-sm text-brand">
          Une campagne est active — les envois sont traités automatiquement en
          arrière-plan.
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Link key={campaign.id} href={`/campagnes/${campaign.id}`}>
            <Card className="flex items-center justify-between p-4 transition-all duration-150 hover:border-brand/40 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted">
                  <Mail className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{campaign.nom}</p>
                  <p className="text-xs text-muted">
                    Créée le{" "}
                    {new Date(campaign.dateCreation).toLocaleDateString("fr-FR")}
                    · max {campaign.dailyLimit}/jour
                  </p>
                </div>
              </div>
              <Badge variant={statusVariant[campaign.statut]}>
                {CAMPAIGN_STATUS_LABELS[campaign.statut]}
              </Badge>
            </Card>
          </Link>
        ))}

        {campaigns.length === 0 && (
          <Card variant="ghost" className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
              <Mail className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted">
              Aucune campagne pour le moment.
            </p>
            <Link
              href="/campagnes/nouvelle"
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                className: "mt-4",
              })}
            >
              Créer votre première campagne
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

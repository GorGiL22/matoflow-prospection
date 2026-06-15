import { CampaignCreateForm } from "@/components/campaigns/campaign-create-form";
import { CampaignEmailStaticExamples } from "@/components/campaigns/campaign-email-static-examples";
import { PageHeader } from "@/components/ui/page-header";
import { campaignService } from "@/modules/campaigns/service";

export const dynamic = "force-dynamic";

export default async function NouvelleCampagnePage() {
  let eligibleProspects: Awaited<
    ReturnType<typeof campaignService.listEligibleProspectsForCampaign>
  > = [];

  try {
    eligibleProspects =
      await campaignService.listEligibleProspectsForCampaign();
  } catch {
    eligibleProspects = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nouvelle campagne"
        description="Choisissez vos prospects automatiquement ou cochez-les un par un avant de lancer la campagne."
      />
      <CampaignCreateForm eligibleProspects={eligibleProspects} />
      <CampaignEmailStaticExamples />
    </div>
  );
}

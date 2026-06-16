import { UnepCityHub } from "@/components/scraping/unep-city-hub";
import { UnepActiveScanNotice } from "@/components/scraping/unep-active-scan-notice";
import { PageHeader } from "@/components/ui/page-header";
import { getUnepAreaScanSummaries } from "@/modules/scraping/unep-jobs";

export const dynamic = "force-dynamic";

export default async function RechercheUnepHubPage() {
  let summaries: Awaited<ReturnType<typeof getUnepAreaScanSummaries>> = [];

  try {
    summaries = await getUnepAreaScanSummaries();
  } catch (error) {
    console.error("getUnepAreaScanSummaries failed:", error);
    summaries = [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Import automatique"
        title="Recherche UNEP"
        description="Import automatique des adhérents UNEP du paysage par grande ville — email, téléphone et site web, enregistrés directement en base."
      />

      <UnepActiveScanNotice />

      <UnepCityHub initialSummaries={summaries} />
    </div>
  );
}

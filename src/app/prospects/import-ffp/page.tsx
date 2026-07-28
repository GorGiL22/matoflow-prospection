import { FfpImportPanel } from "@/components/scraping/ffp-import-panel";
import { PageHeader } from "@/components/ui/page-header";
import { getFfpConcepteurStats } from "@/modules/scraping/ffp-import";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function ImportFfpPage() {
  let count = 0;

  try {
    const stats = await getFfpConcepteurStats();
    count = stats.count;
  } catch {
    count = 0;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Import concepteurs FFP"
        description="Récupérez les agences de paysage adhérentes à la Fédération Française du Paysage."
      />
      <FfpImportPanel initialCount={count} />
    </div>
  );
}

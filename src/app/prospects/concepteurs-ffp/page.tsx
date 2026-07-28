import Link from "next/link";
import { Download } from "lucide-react";
import { prospectService } from "@/modules/prospects/service";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ConcepteursFfpPage() {
  let prospects: Awaited<ReturnType<typeof prospectService.listConcepteursFfp>> =
    [];

  try {
    prospects = await prospectService.listConcepteursFfp();
  } catch {
    prospects = [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Concepteurs FFP"
        description={`${prospects.length} agence${prospects.length > 1 ? "s" : ""} importée${prospects.length > 1 ? "s" : ""} depuis la Fédération Française du Paysage`}
        actions={
          <Link
            href="/prospects/import-ffp"
            className={buttonVariants({ variant: "secondary" })}
          >
            <Download className="h-4 w-4" />
            Réimporter
          </Link>
        }
      />

      <ProspectTable
        prospects={prospects}
        initialCategorieFilter="concepteur_ffp"
        hideCategorieFilter
      />
    </div>
  );
}

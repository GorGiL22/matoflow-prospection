import Link from "next/link";
import { Plus, Download, Sparkles } from "lucide-react";
import { prospectService } from "@/modules/prospects/service";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { ProspectsCrmPanel } from "@/components/prospects/prospects-crm-panel";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  let prospects: Awaited<ReturnType<typeof prospectService.listProspects>> =
    [];
  let concepteurCount = 0;

  try {
    [prospects, concepteurCount] = await Promise.all([
      prospectService.listProspects(),
      prospectService.countConcepteursFfp(),
    ]);
  } catch {
    prospects = [];
    concepteurCount = 0;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospects"
        description={`${prospects.length} prospect${prospects.length > 1 ? "s" : ""} en base${concepteurCount > 0 ? ` · ${concepteurCount} concepteur${concepteurCount > 1 ? "s" : ""} FFP` : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {concepteurCount > 0 && (
              <Link
                href="/prospects/concepteurs-ffp"
                className={buttonVariants({ variant: "secondary" })}
              >
                <Sparkles className="h-4 w-4" />
                Concepteurs FFP ({concepteurCount})
              </Link>
            )}
            <Link
              href="/prospects/import-ffp"
              className={buttonVariants({ variant: "secondary" })}
            >
              <Download className="h-4 w-4" />
              Import FFP
            </Link>
            <Link
              href="/prospects/nouveau"
              className={buttonVariants({ variant: "primary" })}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Link>
          </div>
        }
      />

      <ProspectsCrmPanel />

      <ProspectTable prospects={prospects} />
    </div>
  );
}

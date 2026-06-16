import Link from "next/link";
import { Plus } from "lucide-react";
import { prospectService } from "@/modules/prospects/service";
import { ProspectTable } from "@/components/prospects/prospect-table";
import { ProspectsCrmPanel } from "@/components/prospects/prospects-crm-panel";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProspectsPage() {
  let prospects: Awaited<ReturnType<typeof prospectService.listProspects>> =
    [];

  try {
    prospects = await prospectService.listProspects();
  } catch {
    prospects = [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospects"
        description={`${prospects.length} prospect${prospects.length > 1 ? "s" : ""} en base`}
        actions={
          <Link
            href="/prospects/nouveau"
            className={buttonVariants({ variant: "primary" })}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Link>
        }
      />

      <ProspectsCrmPanel />

      <ProspectTable prospects={prospects} />
    </div>
  );
}

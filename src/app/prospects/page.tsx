import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";
import { ProspectTable } from "@/components/prospects/prospect-table";

async function getProspects() {
  try {
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    return await service.listProspects();
  } catch {
    return [];
  }
}

export default async function ProspectsPage() {
  const prospects = await getProspects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Prospects</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {prospects.length} prospect{prospects.length > 1 ? "s" : ""} en base
          </p>
        </div>
        <Link
          href="/prospects/nouveau"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>

      <ProspectTable prospects={prospects} />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UnepSearchPanel } from "@/components/scraping/unep-search";
import {
  UnepAreaScanAlert,
  UnepAreaScanBadge,
} from "@/components/scraping/unep-area-scan-status";
import { PageHeader } from "@/components/ui/page-header";
import {
  getUnepAreaDefinition,
  isUnepSearchArea,
} from "@/modules/scraping/unep-areas";
import { getUnepAreaScanSummary } from "@/modules/scraping/unep-jobs";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ area: string }> };

export default async function RechercheUnepAreaPage({ params }: PageProps) {
  const { area } = await params;

  if (!isUnepSearchArea(area)) {
    notFound();
  }

  const definition = getUnepAreaDefinition(area);
  let scanSummary: Awaited<ReturnType<typeof getUnepAreaScanSummary>> | null =
    null;

  try {
    scanSummary = await getUnepAreaScanSummary(area);
  } catch {
    scanSummary = null;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/prospects/recherche-unep"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Toutes les villes UNEP
        </Link>
        <PageHeader
          badge={definition.zoneLabel}
          title={`Recherche UNEP — ${definition.areaName}`}
          description={`${definition.regionName} · enregistrement automatique en base`}
          actions={
            scanSummary ? <UnepAreaScanBadge summary={scanSummary} /> : null
          }
        />
      </div>

      {scanSummary && (
        <UnepAreaScanAlert
          summary={scanSummary}
          areaName={definition.areaName}
        />
      )}

      <UnepSearchPanel area={area} initialScanSummary={scanSummary} />
    </div>
  );
}

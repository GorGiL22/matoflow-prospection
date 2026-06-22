import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { campaignService } from "@/modules/campaigns/service";
import { CampaignDetailPanel } from "@/components/campaigns/campaign-detail-panel";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function CampagneDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await campaignService.getCampaignDetail(id);

  if (!detail) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/campagnes"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux campagnes
      </Link>

      <CampaignDetailPanel
        campaign={detail.campaign}
        emails={detail.emails}
        stats={detail.stats}
        report={detail.report}
        noReplyCount={detail.noReplyCount}
      />
    </div>
  );
}

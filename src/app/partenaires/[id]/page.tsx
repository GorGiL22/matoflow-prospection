import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { partnerRepository } from "@/modules/partners/crm/repository";
import { PartnerDetailPanel } from "@/components/partners/partner-detail-panel";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PartenaireDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partner = await partnerRepository.getById(id);
  if (!partner) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/partenaires"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <PartnerDetailPanel partner={partner} />
    </div>
  );
}

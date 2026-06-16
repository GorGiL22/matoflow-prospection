import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { phoneListService } from "@/modules/phone-lists/service";
import { PhoneListDetailPanel } from "@/components/phone-lists/phone-list-detail-panel";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PhoneListDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PhoneListDetailPage({
  params,
}: PhoneListDetailPageProps) {
  const { id } = await params;
  const [list, candidates] = await Promise.all([
    phoneListService.get(id),
    phoneListService.listProspectCandidates(id),
  ]);

  if (!list) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/prospects/listes-numeros"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <ArrowLeft className="h-4 w-4" />
        Toutes les listes
      </Link>

      <PhoneListDetailPanel list={list} candidates={candidates} />
    </div>
  );
}

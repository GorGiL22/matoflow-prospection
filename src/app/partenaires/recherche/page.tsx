import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PartnerSearchPanel } from "@/components/partners/partner-search-panel";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function PartenairesRecherchePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Recherche partenaires"
        description="Scan web + Google Places par zone et type, puis scoring IA automatique."
        actions={
          <Link
            href="/partenaires"
            className={buttonVariants({ variant: "secondary" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Portefeuille
          </Link>
        }
      />
      <PartnerSearchPanel />
    </div>
  );
}

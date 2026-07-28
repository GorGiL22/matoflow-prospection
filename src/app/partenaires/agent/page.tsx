import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PartnerAgentPanel } from "@/components/partners/partner-agent-panel";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function PartenairesAgentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent partenariats"
        description="Assistant commercial sur votre portefeuille partenaires."
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
      <PartnerAgentPanel />
    </div>
  );
}

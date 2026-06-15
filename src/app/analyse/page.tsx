import { getProspectsForAnalysisAction } from "@/actions/analysis";
import { AnalysisAgentPanel } from "@/components/analysis/analysis-agent-panel";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function AnalysePage() {
  const result = await getProspectsForAnalysisAction();
  const prospects = result.success ? result.prospects : [];

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Intelligence artificielle"
        title="Agent IA — Analyse réelle"
        description="Saisissez une entreprise du paysage avec son site web. L'agent interroge le registre SIRENE, scrape le site et génère du contenu personnalisé."
      />

      <AnalysisAgentPanel prospects={prospects} />
    </div>
  );
}

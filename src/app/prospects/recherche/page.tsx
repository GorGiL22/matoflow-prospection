import { GoogleMapsSearchPanel } from "@/components/scraping/google-maps-search";
import { PageHeader } from "@/components/ui/page-header";

export default function RecherchePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        badge="Scraping"
        title="Recherche Google Maps"
        description="Trouvez des paysagistes par ville, importez-les en base puis lancez l'analyse IA."
      />

      <GoogleMapsSearchPanel />
    </div>
  );
}

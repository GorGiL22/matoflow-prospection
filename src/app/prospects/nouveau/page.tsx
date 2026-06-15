import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Nouveau prospect"
        description="La déduplication automatique vérifie le SIRET, l'email et le domaine du site."
      />

      <Card>
        <CardHeader title="Informations entreprise" />
        <ProspectForm />
      </Card>
    </div>
  );
}

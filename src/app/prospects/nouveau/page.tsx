import { Card, CardHeader } from "@/components/ui/card";
import { ProspectForm } from "@/components/prospects/prospect-form";

export default function NewProspectPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Nouveau prospect</h1>
        <p className="mt-1 text-sm text-zinc-500">
          La déduplication automatique vérifie le SIRET, l&apos;email et le
          domaine du site.
        </p>
      </div>

      <Card>
        <CardHeader title="Informations entreprise" />
        <ProspectForm />
      </Card>
    </div>
  );
}

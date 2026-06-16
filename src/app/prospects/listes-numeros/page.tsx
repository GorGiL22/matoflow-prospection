import { phoneListService } from "@/modules/phone-lists/service";
import { PageHeader } from "@/components/ui/page-header";
import { PhoneListCreateForm } from "@/components/phone-lists/phone-list-create-form";
import { PhoneListsGrid } from "@/components/phone-lists/phone-lists-grid";

export const dynamic = "force-dynamic";

export default async function PhoneListsPage() {
  const lists = await phoneListService.list();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listes de numéros"
        description="Créez des listes d'appels à partir des prospects qui ont un téléphone, puis exportez-les en fichier pour votre collègue."
        badge="Appels"
      />

      <PhoneListCreateForm />
      <PhoneListsGrid lists={lists} />
    </div>
  );
}

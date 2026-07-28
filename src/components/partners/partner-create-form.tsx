"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPartnerAction } from "@/actions/partners";
import { PARTNER_TYPES, PARTNER_TYPE_LABELS } from "@/types/partner";

export function PartnerCreateForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPartnerAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/partenaires/${result.partner.id}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader
        title="Ajouter manuellement"
        description="Enregistrez un partenaire découvert hors recherche automatique."
      />
      <form action={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <Input name="entreprise" placeholder="Entreprise *" required />
        <Input name="nom" placeholder="Nom commercial (optionnel)" />
        <select
          name="type"
          defaultValue="autre"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {PARTNER_TYPES.map((type) => (
            <option key={type} value={type}>
              {PARTNER_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        <Input name="zone" placeholder="Zone (ex. Bretagne)" />
        <Input name="siteWeb" placeholder="Site web" className="sm:col-span-2" />
        <Input name="email" placeholder="Email" />
        <Input name="telephone" placeholder="Téléphone" />
        {error ? (
          <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  );
}

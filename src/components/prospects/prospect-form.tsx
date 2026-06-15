"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProspectAction } from "@/actions/prospects";

interface ProspectFormProps {
  initialData?: {
    nomEntreprise?: string;
    siret?: string;
    telephone?: string;
    email?: string;
    siteWeb?: string;
    ville?: string;
    description?: string;
  };
}

export function ProspectForm({ initialData }: ProspectFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProspectAction({
        nomEntreprise: formData.get("nomEntreprise") as string,
        siret: (formData.get("siret") as string) || null,
        telephone: (formData.get("telephone") as string) || null,
        email: (formData.get("email") as string) || null,
        siteWeb: (formData.get("siteWeb") as string) || null,
        ville: (formData.get("ville") as string) || null,
        description: (formData.get("description") as string) || null,
        avisGoogle: Number(formData.get("avisGoogle")) || 0,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/prospects/${result.prospect.id}`);
    });
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nom de l&apos;entreprise *
        </label>
        <input
          name="nomEntreprise"
          required
          defaultValue={initialData?.nomEntreprise}
          className={inputClass}
          placeholder="Ex : Paysages du Val de Loire"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialData?.description}
          className={inputClass}
          placeholder="Activités, services, spécialités..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            SIRET
          </label>
          <input
            name="siret"
            defaultValue={initialData?.siret}
            className={inputClass}
            placeholder="123 456 789 00012"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Ville
          </label>
          <input
            name="ville"
            defaultValue={initialData?.ville}
            className={inputClass}
            placeholder="Tours"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Téléphone
          </label>
          <input
            name="telephone"
            type="tel"
            defaultValue={initialData?.telephone}
            className={inputClass}
            placeholder="02 47 00 00 00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={initialData?.email}
            className={inputClass}
            placeholder="contact@entreprise.fr"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Site internet
          </label>
          <input
            name="siteWeb"
            type="url"
            defaultValue={initialData?.siteWeb}
            className={inputClass}
            placeholder="https://www.exemple-paysage.fr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Avis Google
          </label>
          <input
            name="avisGoogle"
            type="number"
            min="0"
            defaultValue={0}
            className={inputClass}
            placeholder="0"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "Enregistrement..." : "Enregistrer le prospect"}
      </button>
    </form>
  );
}

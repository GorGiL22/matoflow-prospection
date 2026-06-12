"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProspectFormProps {
  initialData?: {
    company_name?: string;
    siret?: string;
    phone?: string;
    email?: string;
    website?: string;
    city?: string;
    google_reviews_count?: number;
  };
}

export function ProspectForm({ initialData }: ProspectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      company_name: formData.get("company_name") as string,
      siret: (formData.get("siret") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      website: (formData.get("website") as string) || null,
      city: (formData.get("city") as string) || null,
      google_reviews_count: Number(formData.get("google_reviews_count")) || 0,
      source: "manuel" as const,
    };

    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la création");
      }

      const prospect = await res.json();
      router.push(`/prospects/${prospect.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Nom de l&apos;entreprise *
        </label>
        <input
          name="company_name"
          required
          defaultValue={initialData?.company_name}
          className={inputClass}
          placeholder="Ex : Paysages du Val de Loire"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
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
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Ville
          </label>
          <input
            name="city"
            defaultValue={initialData?.city}
            className={inputClass}
            placeholder="Tours"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Téléphone
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={initialData?.phone}
            className={inputClass}
            placeholder="02 47 00 00 00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
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
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Site internet
          </label>
          <input
            name="website"
            type="url"
            defaultValue={initialData?.website}
            className={inputClass}
            placeholder="https://www.exemple-paysage.fr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Avis Google
          </label>
          <input
            name="google_reviews_count"
            type="number"
            min="0"
            defaultValue={initialData?.google_reviews_count ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Enregistrer le prospect"}
      </button>
    </form>
  );
}

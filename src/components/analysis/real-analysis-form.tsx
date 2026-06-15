"use client";

import { useState } from "react";
import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClassName, labelClassName } from "@/components/ui/input";

export interface RealAnalysisFormData {
  nomEntreprise: string;
  siret: string;
  siteWeb: string;
  ville: string;
  telephone: string;
  email: string;
  description: string;
}

interface RealAnalysisFormProps {
  onSubmit: (data: RealAnalysisFormData) => void;
  disabled?: boolean;
  showSubmitButton?: boolean;
}

const emptyForm: RealAnalysisFormData = {
  nomEntreprise: "",
  siret: "",
  siteWeb: "",
  ville: "",
  telephone: "",
  email: "",
  description: "",
};

export function RealAnalysisForm({
  onSubmit,
  disabled,
  showSubmitButton = true,
}: RealAnalysisFormProps) {
  const [form, setForm] = useState<RealAnalysisFormData>(emptyForm);

  function handleChange(
    field: keyof RealAnalysisFormData,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-accent">
        <Building2 className="h-4 w-4" />
        Saisissez une entreprise réelle à analyser
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClassName}>
            Nom de l&apos;entreprise *
          </label>
          <input
            required
            value={form.nomEntreprise}
            onChange={(e) => handleChange("nomEntreprise", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="Ex : Vert Nature Paysage"
          />
        </div>

        <div>
          <label className={labelClassName}>
            SIRET (enrichissement API Gouv)
          </label>
          <input
            value={form.siret}
            onChange={(e) => handleChange("siret", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="123 456 789 00012"
          />
        </div>

        <div>
          <label className={labelClassName}>
            Site web * (scraping réel)
          </label>
          <input
            required
            type="url"
            value={form.siteWeb}
            onChange={(e) => handleChange("siteWeb", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="https://www.entreprise-paysage.fr"
          />
        </div>

        <div>
          <label className={labelClassName}>Ville</label>
          <input
            value={form.ville}
            onChange={(e) => handleChange("ville", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="Tours"
          />
        </div>

        <div>
          <label className={labelClassName}>Téléphone</label>
          <input
            value={form.telephone}
            onChange={(e) => handleChange("telephone", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="02 47 00 00 00"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClassName}>Notes / contexte</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            disabled={disabled}
            className={inputClassName}
            placeholder="Contrats d'entretien, taille équipe, spécialités..."
          />
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted">
        <Search className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        L&apos;agent va interroger le registre SIRENE, scraper le site web,
        qualifier via OpenAI et générer un email + LinkedIn personnalisés.
      </p>

      {showSubmitButton && (
        <Button type="submit" variant="accent" disabled={disabled}>
          Lancer l&apos;analyse réelle
        </Button>
      )}
    </form>
  );
}

import { Card, CardHeader } from "@/components/ui/card";

export const CAMPAIGN_EMAIL_STATIC_EXAMPLES = [
  {
    entreprise: "Vert Nature — Lyon",
    subject: "Entretien d'espaces verts à Lyon",
    hook: "J'ai vu que vous proposez l'entretien régulier de parcs et jardins pour les collectivités autour de Lyon.",
    body: `Bonjour,

J'ai vu que vous proposez l'entretien régulier de parcs et jardins pour les collectivités autour de Lyon.

Chez MatoFlow, on aide des entreprises du paysage à simplifier leurs devis, le planning des équipes et le suivi des contrats d'entretien.

Si vous êtes ouvert à échanger 15 minutes, je peux vous montrer comment d'autres paysagistes organisent leurs interventions récurrentes.

Découvrir MatoFlow : https://matoflow.fr

Bonne journée,
Mathis — MatoFlow`,
    analysis: "Site analysé : services entretien espaces verts, zone Lyon.",
  },
  {
    entreprise: "Création Paysagère Dubois — Villeurbanne",
    subject: "Vos aménagements paysagers",
    hook: "Votre site met en avant la création de jardins sur mesure et la plantation d'arbres — c'est exactement le type de chantiers où MatoFlow fait la différence.",
    body: `Bonjour,

Votre site met en avant la création de jardins sur mesure et la plantation d'arbres — c'est exactement le type de chantiers où MatoFlow fait la différence sur le devis et le suivi client.

Nous accompagnons des paysagistes sur la facturation, le planning terrain et l'historique des chantiers.

Seriez-vous disponible pour une courte démo cette semaine ou la suivante ?

Plus d'infos sur https://matoflow.fr

Cordialement,
Mathis — MatoFlow`,
    analysis: "Site analysé : création paysagère, plantation, Villeurbanne.",
  },
] as const;

export function CampaignEmailStaticExamples() {
  return (
    <Card>
      <CardHeader
        title="À quoi ressemblent les emails IA ?"
        description="Exemples illustratifs — le mode générique utilise un modèle unique avec le nom de chaque entreprise"
      />
      <div className="space-y-4">
        {CAMPAIGN_EMAIL_STATIC_EXAMPLES.map((example) => (
          <article
            key={example.entreprise}
            className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {example.entreprise}
            </p>
            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 dark:border-violet-900 dark:bg-violet-950/50">
              <p className="text-xs font-semibold uppercase text-violet-700 dark:text-violet-300">
                Accroche personnalisée
              </p>
              <p className="mt-1 text-sm text-violet-900 dark:text-violet-100">
                « {example.hook} »
              </p>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Objet : {example.subject}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {example.body}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}

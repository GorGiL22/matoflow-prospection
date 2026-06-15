import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prospectService } from "@/modules/prospects/service";
import { ProspectActions } from "@/components/prospects/prospect-actions";
import { ProspectHistory } from "@/components/prospects/prospect-history";
import { ProspectNotes } from "@/components/prospects/prospect-notes";
import { ProspectDeleteButton } from "@/components/prospects/prospect-delete-button";
import { ProspectStatusActions } from "@/components/prospects/prospect-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, getScoreColor } from "@/lib/utils";
import { STATUS_ACTIVE_CLASSES, STATUS_LABELS } from "@/types/prospect";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;

  let detail;
  try {
    detail = await prospectService.getProspectDetail(id);
  } catch {
    notFound();
  }

  const { prospect, notes, activites } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/prospects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux prospects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {prospect.nomEntreprise}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {prospect.ville ?? "Ville non renseignée"} · Ajouté le{" "}
              {formatDate(prospect.dateCreation)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge className={STATUS_ACTIVE_CLASSES[prospect.statut]}>
                {STATUS_LABELS[prospect.statut]}
              </Badge>
              {prospect.scoreIA !== null && (
                <span
                  className={`text-lg font-bold ${getScoreColor(prospect.scoreIA)}`}
                >
                  {prospect.scoreIA}/100
                </span>
              )}
            </div>
            <ProspectDeleteButton
              prospectId={prospect.id}
              prospectName={prospect.nomEntreprise}
              redirectTo="/prospects"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader title="Statut du prospect" />
        <ProspectStatusActions
          prospectId={prospect.id}
          currentStatus={prospect.statut}
        />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Coordonnées" />
          <dl className="space-y-3 text-sm">
            <InfoRow label="SIRET" value={prospect.siret} />
            <InfoRow label="Téléphone" value={prospect.telephone} />
            <InfoRow label="Email" value={prospect.email} />
            <InfoRow
              label="Site web"
              value={prospect.siteWeb}
              isLink={!!prospect.siteWeb}
            />
            <InfoRow label="Ville" value={prospect.ville} />
            <InfoRow
              label="Avis Google"
              value={prospect.avisGoogle > 0 ? String(prospect.avisGoogle) : null}
            />
            <InfoRow label="Description" value={prospect.description} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Qualification IA" />
          {prospect.detailsScoreIA?.reasoning ? (
            <div className="space-y-3 text-sm">
              <p className="text-zinc-600 dark:text-zinc-400">
                {prospect.detailsScoreIA.reasoning}
              </p>
              {prospect.detailsScoreIA.services_detected && (
                <div>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    Services détectés
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prospect.detailsScoreIA.services_detected.map((s) => (
                      <Badge key={s} variant="info">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Pas encore qualifié. Lancez l&apos;analyse IA ci-dessous.
            </p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Notes" description="Notes internes sur ce prospect" />
          <ProspectNotes prospectId={prospect.id} notes={notes} />
        </Card>

        <Card>
          <CardHeader title="Historique" description="Activités et événements" />
          <ProspectHistory activites={activites} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Actions commerciales"
          description="Qualification IA et génération de contenu personnalisé"
        />
        <ProspectActions prospect={prospect} />
      </Card>
    </div>
  );
}

function InfoRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-900 dark:text-zinc-100">
        {isLink && value ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {value}
          </a>
        ) : (
          value ?? "—"
        )}
      </dd>
    </div>
  );
}

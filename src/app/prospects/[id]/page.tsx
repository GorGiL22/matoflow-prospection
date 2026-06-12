import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProspectService } from "@/modules/prospects/service";
import { ProspectActions } from "@/components/prospects/prospect-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { formatDate, getScoreColor } from "@/lib/utils";
import { STATUS_LABELS, SOURCE_LABELS } from "@/types/prospect";

type PageProps = { params: Promise<{ id: string }> };

async function getProspect(id: string) {
  try {
    const supabase = createAdminClient();
    const service = new ProspectService(supabase);
    return await service.getProspect(id);
  } catch {
    return null;
  }
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/prospects"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux prospects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              {prospect.company_name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {prospect.city ?? "Ville non renseignée"} · Ajouté le{" "}
              {formatDate(prospect.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{STATUS_LABELS[prospect.status]}</Badge>
            {prospect.ai_score !== null && (
              <span
                className={`text-lg font-bold ${getScoreColor(prospect.ai_score)}`}
              >
                {prospect.ai_score}/100
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Coordonnées" />
          <dl className="space-y-3 text-sm">
            <InfoRow label="SIRET" value={prospect.siret} />
            <InfoRow label="Téléphone" value={prospect.phone} />
            <InfoRow label="Email" value={prospect.email} />
            <InfoRow
              label="Site web"
              value={prospect.website}
              isLink={!!prospect.website}
            />
            <InfoRow
              label="Avis Google"
              value={String(prospect.google_reviews_count)}
            />
            <InfoRow label="Source" value={SOURCE_LABELS[prospect.source]} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Qualification IA" />
          {prospect.ai_score_details?.reasoning ? (
            <div className="space-y-3 text-sm">
              <p className="text-zinc-600">
                {prospect.ai_score_details.reasoning}
              </p>
              {prospect.ai_score_details.services_detected && (
                <div>
                  <p className="font-medium text-zinc-700">
                    Services détectés
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {prospect.ai_score_details.services_detected.map((s) => (
                      <Badge key={s} variant="info">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">
              Pas encore qualifié. Lancez l&apos;analyse IA ci-dessous.
            </p>
          )}
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
    <div className="flex justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">
        {isLink && value ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline"
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

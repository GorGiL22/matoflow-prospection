"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  addPartnerNoteAction,
  generatePartnerOutreachAction,
  scorePartnerAction,
  updatePartnerStatusAction,
} from "@/actions/partners";
import type { PartnerDetail, PartnerStatus } from "@/types/partner";
import {
  PARTNER_STATUSES,
  PARTNER_STATUS_LABELS,
  PARTNER_TYPE_LABELS,
  PARTNERSHIP_KIND_LABELS,
  scoreEtoilesLabel,
} from "@/types/partner";

export function PartnerDetailPanel({ partner }: { partner: PartnerDetail }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const latestDraft = partner.drafts[0] ?? null;

  function run(label: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.success) {
        setMessage(result.error ?? "Erreur");
        return;
      }
      setMessage(label);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{partner.entreprise}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {PARTNER_TYPE_LABELS[partner.type]}
            {partner.zone ? ` · ${partner.zone}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">{PARTNER_STATUS_LABELS[partner.statut]}</Badge>
            <Badge variant="accent">{scoreEtoilesLabel(partner.scoreEtoiles)}</Badge>
            {partner.partnershipKind ? (
              <Badge>
                {PARTNERSHIP_KIND_LABELS[partner.partnershipKind]}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={partner.statut}
            disabled={pending}
            onChange={(e) =>
              run("Statut mis à jour", () =>
                updatePartnerStatusAction(
                  partner.id,
                  e.target.value as PartnerStatus
                )
              )
            }
          >
            {PARTNER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PARTNER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run("Analyse IA terminée", () => scorePartnerAction(partner.id))
            }
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Scorer
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              run("Messages générés", () =>
                generatePartnerOutreachAction(partner.id)
              )
            }
          >
            <Mail className="h-4 w-4" />
            Messages
          </Button>
        </div>
      </div>

      {message ? (
        <p className="text-sm text-brand">{message}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Coordonnées" />
          <dl className="space-y-2 text-sm">
            <Info label="Site" value={partner.siteWeb} link />
            <Info label="Email" value={partner.email} />
            <Info label="Téléphone" value={partner.telephone} />
            <Info label="Adresse" value={partner.adresse} />
            <Info label="Dirigeant" value={partner.nomDirigeant} />
            <Info label="Fonction" value={partner.fonctionDirigeant} />
            <Info label="LinkedIn entreprise" value={partner.linkedinEntreprise} link />
            <Info label="LinkedIn dirigeant" value={partner.linkedinDirigeant} link />
            <Info label="Taille estimée" value={partner.tailleEstimee} />
            <Info
              label="API"
              value={
                partner.hasApi == null ? null : partner.hasApi ? "Oui" : "Non"
              }
            />
            <Info label="Source" value={partner.sourceRecherche} />
          </dl>
        </Card>

        <Card>
          <CardHeader title="Analyse IA" />
          {partner.analyseIA ? (
            <div className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Pourquoi :</span>{" "}
                {partner.analyseIA.whyInteresting}
              </p>
              <p>
                <span className="font-medium">Bénéfices :</span>{" "}
                {partner.analyseIA.mutualBenefits}
              </p>
              {partner.analyseIA.matoflowModules.length > 0 ? (
                <p>
                  <span className="font-medium">Modules :</span>{" "}
                  {partner.analyseIA.matoflowModules.join(", ")}
                </p>
              ) : null}
              <p className="text-muted-foreground">{partner.analyseIA.reasoning}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pas encore scorée. Cliquez sur « Scorer ».
            </p>
          )}
          {partner.description ? (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              {partner.description}
            </p>
          ) : null}
        </Card>
      </div>

      {latestDraft ? (
        <Card>
          <CardHeader title="Proposition de contact" />
          <div className="space-y-4 text-sm">
            <Block title="Objet" body={latestDraft.emailSubject} />
            <Block title="Email" body={latestDraft.emailBody} />
            <Block title="LinkedIn" body={latestDraft.linkedinMessage} />
            <Block title="Arguments" body={latestDraft.arguments} />
            <Block title="Questions RDV" body={latestDraft.questionsRdv} />
            <Block title="Objections" body={latestDraft.objections} />
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Notes" />
          <div className="mb-3 flex gap-2">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note…"
            />
            <Button
              type="button"
              variant="secondary"
              disabled={pending || !note.trim()}
              onClick={() =>
                run("Note ajoutée", async () => {
                  const result = await addPartnerNoteAction(partner.id, note);
                  if (result.success) setNote("");
                  return result;
                })
              }
            >
              <StickyNote className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
          <ul className="space-y-2 text-sm">
            {partner.notes.length === 0 ? (
              <li className="text-muted-foreground">Aucune note</li>
            ) : (
              partner.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <p>{n.contenu}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.dateCreation).toLocaleString("fr-FR")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Historique" />
          <ul className="space-y-2 text-sm">
            {partner.activites.length === 0 ? (
              <li className="text-muted-foreground">Aucune activité</li>
            ) : (
              partner.activites.map((a) => (
                <li key={a.id} className="border-b border-border/60 pb-2 last:border-0">
                  <p className="font-medium">{a.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.type} · {new Date(a.dateCreation).toLocaleString("fr-FR")}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  link,
}: {
  label: string;
  value: string | null | undefined;
  link?: boolean;
}) {
  if (!value) {
    return (
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{label}</dt>
        <dd>—</dd>
      </div>
    );
  }
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] truncate text-right">
        {link ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted/60 p-3 font-sans text-sm">
        {body}
      </pre>
    </div>
  );
}

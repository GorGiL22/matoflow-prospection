"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Partner } from "@/types/partner";
import {
  PARTNER_STATUS_LABELS,
  PARTNER_TYPE_LABELS,
  PARTNERSHIP_KIND_LABELS,
  scoreEtoilesLabel,
} from "@/types/partner";

export function PartnerTable({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Aucun partenaire. Lancez une recherche ou ajoutez-en manuellement.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Entreprise</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Zone</th>
            <th className="px-4 py-3 font-medium">Score</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Partenariat</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr
              key={partner.id}
              className="border-b border-border/70 last:border-0 hover:bg-surface-muted/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/partenaires/${partner.id}`}
                  className="font-medium text-foreground hover:text-brand"
                >
                  {partner.entreprise}
                </Link>
                {partner.siteWeb ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {partner.siteWeb}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Badge>{PARTNER_TYPE_LABELS[partner.type]}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {partner.zone ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs font-medium">
                  {scoreEtoilesLabel(partner.scoreEtoiles)}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant="info">
                  {PARTNER_STATUS_LABELS[partner.statut]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {partner.partnershipKind
                  ? PARTNERSHIP_KIND_LABELS[partner.partnershipKind]
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

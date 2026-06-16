import Link from "next/link";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PhoneListSummary } from "@/types/phone-list";

interface PhoneListsGridProps {
  lists: PhoneListSummary[];
}

export function PhoneListsGrid({ lists }: PhoneListsGridProps) {
  if (lists.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
        <Phone className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium text-foreground">
          Aucune liste pour l&apos;instant
        </p>
        <p className="mt-1 text-sm text-muted">
          Créez une liste, ajoutez des prospects avec numéro, puis exportez le
          fichier pour votre collègue.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {lists.map((list) => (
        <Link
          key={list.id}
          href={`/prospects/listes-numeros/${list.id}`}
          className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-brand-muted/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {list.nom}
              </p>
              <p className="mt-1 text-xs text-muted">
                Modifiée le{" "}
                {new Date(list.dateModification).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <Badge variant="default">
              {list.itemCount} num.
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

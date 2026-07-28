"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Download,
  Loader2,
  Phone,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import {
  addProspectsToPhoneListAction,
  deletePhoneListAction,
  markPhoneListItemCalledAction,
  removePhoneListItemAction,
  unmarkPhoneListItemCalledAction,
} from "@/actions/phone-lists";
import { downloadPhoneListExport } from "@/modules/phone-lists/export";
import { formatDate, getScoreColor } from "@/lib/utils";
import { STATUS_SHORT_LABELS, type ProspectStatus } from "@/types/prospect";
import type {
  PhoneListDetail,
  PhoneListExportFormat,
  PhoneListItem,
  PhoneListProspectCandidate,
} from "@/types/phone-list";
import { cn } from "@/lib/utils";

type CallFilter = "pending" | "called" | "all";

interface PhoneListDetailPanelProps {
  list: PhoneListDetail;
  candidates: PhoneListProspectCandidate[];
}

export function PhoneListDetailPanel({
  list: initialList,
  candidates,
}: PhoneListDetailPanelProps) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [callFilter, setCallFilter] = useState<CallFilter>("pending");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  const pendingItems = useMemo(
    () => list.items.filter((item) => !item.appele),
    [list.items]
  );
  const calledItems = useMemo(
    () => list.items.filter((item) => item.appele),
    [list.items]
  );

  const visibleItems = useMemo(() => {
    if (callFilter === "pending") return pendingItems;
    if (callFilter === "called") return calledItems;
    return list.items;
  }, [callFilter, list.items, pendingItems, calledItems]);

  const availableCandidates = useMemo(
    () => candidates.filter((candidate) => !candidate.inList),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableCandidates;
    return availableCandidates.filter(
      (candidate) =>
        candidate.nomEntreprise.toLowerCase().includes(q) ||
        candidate.telephone.includes(q) ||
        candidate.ville?.toLowerCase().includes(q)
    );
  }, [availableCandidates, query]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function updateItem(itemId: string, patch: Partial<PhoneListItem>) {
    setList((current) => {
      const items = current.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item
      );
      const pendingCount = items.filter((item) => !item.appele).length;
      return { ...current, items, pendingCount };
    });
  }

  function toggleCandidate(id: string) {
    if (selectedSet.has(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
      return;
    }
    setSelectedIds([...selectedIds, id]);
  }

  function selectAllVisible() {
    setSelectedIds([
      ...new Set([
        ...selectedIds,
        ...filteredCandidates.map((candidate) => candidate.id),
      ]),
    ]);
  }

  function handleExport(format: PhoneListExportFormat) {
    const exportItems =
      pendingItems.length > 0 ? pendingItems : list.items;
    if (exportItems.length === 0) return;
    downloadPhoneListExport(
      { nom: list.nom, items: exportItems },
      format,
      { onlyPending: false }
    );
  }

  function handleAddSelected() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const result = await addProspectsToPhoneListAction(list.id, selectedIds);
      setMessage(
        result.added > 0
          ? `${result.added} numéro${result.added > 1 ? "s" : ""} ajouté${result.added > 1 ? "s" : ""}`
          : "Aucun nouveau numéro à ajouter"
      );
      setSelectedIds([]);
      router.refresh();
    });
  }

  function handleRemoveItem(itemId: string) {
    startTransition(async () => {
      await removePhoneListItemAction(itemId, list.id);
      setList((current) => ({
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
        itemCount: current.itemCount - 1,
        pendingCount: current.items.filter(
          (item) => item.id !== itemId && !item.appele
        ).length,
      }));
      router.refresh();
    });
  }

  function handleMarkCalled(item: PhoneListItem) {
    startTransition(async () => {
      const result = await markPhoneListItemCalledAction(item.id, list.id);
      updateItem(item.id, {
        appele: true,
        dateAppel: result.item.dateAppel,
      });
      router.refresh();
    });
  }

  function handleUnmarkCalled(item: PhoneListItem) {
    startTransition(async () => {
      await unmarkPhoneListItemCalledAction(item.id, list.id);
      updateItem(item.id, { appele: false, dateAppel: null });
      router.refresh();
    });
  }

  function handleDeleteList() {
    if (!confirm(`Supprimer la liste « ${list.nom} » ?`)) return;
    startTransition(async () => {
      await deletePhoneListAction(list.id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Phone className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-semibold text-foreground">{list.nom}</h2>
            <Badge variant="default">
              {pendingItems.length} à appeler
            </Badge>
            {calledItems.length > 0 && (
              <Badge variant="info">{calledItems.length} appelé{calledItems.length > 1 ? "s" : ""}</Badge>
            )}
          </div>
          <p className="text-sm text-muted">
            Marquez chaque contact comme appelé pour éviter les doublons. Les
            exports n&apos;incluent que les numéros restants à appeler.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pendingItems.length === 0}
            onClick={() => handleExport("csv")}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pendingItems.length === 0}
            onClick={() => handleExport("txt-numbers")}
          >
            <Download className="h-4 w-4" />
            Numéros (.txt)
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pendingItems.length === 0}
            onClick={() => handleExport("txt-full")}
          >
            <Download className="h-4 w-4" />
            Complet (.txt)
          </Button>
          <button
            type="button"
            onClick={handleDeleteList}
            disabled={isPending}
            className={buttonVariants({ variant: "danger", size: "sm" })}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Numéros dans la liste
              </h3>
              <p className="text-xs text-muted">
                {pendingItems.length} à appeler · {calledItems.length} appelé
                {calledItems.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex rounded-lg border border-border p-0.5 text-xs">
              {(
                [
                  ["pending", "À appeler"],
                  ["called", "Appelés"],
                  ["all", "Tous"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCallFilter(value)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-medium transition-colors",
                    callFilter === value
                      ? "bg-brand text-white"
                      : "text-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visibleItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              {callFilter === "pending"
                ? "Tous les contacts de cette liste ont été appelés."
                : callFilter === "called"
                  ? "Aucun contact marqué comme appelé pour l'instant."
                  : "Aucun numéro pour l'instant. Ajoutez des prospects depuis le panneau de droite."}
            </p>
          ) : (
            <div className="max-h-[28rem] overflow-auto rounded-xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-surface-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Entreprise</th>
                    <th className="px-3 py-2">Téléphone</th>
                    <th className="px-3 py-2">Ville</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-t border-border",
                        item.appele && "bg-muted/30"
                      )}
                    >
                      <td className="px-3 py-2">
                        <p
                          className={cn(
                            "font-medium",
                            item.appele
                              ? "text-muted line-through"
                              : "text-foreground"
                          )}
                        >
                          {item.nomEntreprise}
                        </p>
                        {item.appele && item.dateAppel && (
                          <p className="mt-0.5 text-xs text-muted">
                            Appelé le {formatDate(item.dateAppel)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-foreground">
                        <a
                          href={`tel:${item.telephone.replace(/\s/g, "")}`}
                          className={cn(
                            item.appele
                              ? "text-muted"
                              : "text-brand hover:underline"
                          )}
                        >
                          {item.telephone}
                        </a>
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {item.ville ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col items-end gap-1.5">
                          {!item.appele ? (
                            <button
                              type="button"
                              onClick={() => handleMarkCalled(item)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              A été appelé
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUnmarkCalled(item)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Réactiver
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isPending}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            Retirer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Ajouter des prospects
              </h3>
              <p className="text-xs text-muted">
                {availableCandidates.length} prospect
                {availableCandidates.length > 1 ? "s" : ""} avec numéro
                disponible{availableCandidates.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.length === 0 || isPending}
              onClick={handleAddSelected}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Ajouter ({selectedIds.length})
            </Button>
          </div>

          {message && (
            <p className="rounded-lg bg-brand-muted px-3 py-2 text-xs text-brand">
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={selectAllVisible}
              className="font-medium text-brand hover:underline"
            >
              Tout sélectionner (filtre)
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="font-medium text-muted hover:underline"
            >
              Tout désélectionner
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une entreprise, ville, numéro…"
              className={cn(inputClassName, "pl-9")}
            />
          </div>

          <div className="max-h-[24rem] space-y-2 overflow-auto">
            {filteredCandidates.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                Aucun prospect avec numéro à ajouter.
              </p>
            ) : (
              filteredCandidates.map((candidate) => {
                const selected = selectedSet.has(candidate.id);
                return (
                  <label
                    key={candidate.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
                      selected
                        ? "border-brand bg-brand-muted/40"
                        : "border-border hover:bg-surface-muted/60"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {candidate.nomEntreprise}
                        </p>
                        <Badge variant="default">
                          {STATUS_SHORT_LABELS[candidate.statut as ProspectStatus]}
                        </Badge>
                        {candidate.scoreIA != null && (
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              getScoreColor(candidate.scoreIA)
                            )}
                          >
                            {candidate.scoreIA}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-xs text-foreground">
                        {candidate.telephone}
                      </p>
                      {candidate.ville && (
                        <p className="text-xs text-muted">{candidate.ville}</p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

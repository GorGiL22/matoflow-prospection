"use client";

import { useRef, useState, useTransition } from "react";
import { Download, Loader2, Phone, Upload, Sheet } from "lucide-react";
import {
  exportProspectsCsvAction,
  exportProspectsWithPhoneCsvAction,
  importProspectsCsvAction,
} from "@/actions/prospects-crm";
import { Button } from "@/components/ui/button";
import { COMMERCIAL_STATUSES } from "@/types/google-sheets";

export function ProspectsCrmPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"export" | "export-phone" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function downloadCsv(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    setError(null);
    setMessage(null);
    setAction("export");
    startTransition(async () => {
      const result = await exportProspectsCsvAction();
      setAction(null);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { content, filename, rowCount } = result.result;
      downloadCsv(content, filename);

      setMessage(
        `${rowCount} prospect${rowCount > 1 ? "s" : ""} exporté${rowCount > 1 ? "s" : ""}. Importez ce fichier dans Google Sheets pour le partager avec votre équipe.`
      );
    });
  }

  function handleExportWithPhone() {
    setError(null);
    setMessage(null);
    setAction("export-phone");
    startTransition(async () => {
      const result = await exportProspectsWithPhoneCsvAction();
      setAction(null);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { content, filename, rowCount } = result.result;
      downloadCsv(content, filename);

      setMessage(
        `${rowCount} prospect${rowCount > 1 ? "s" : ""} avec numéro exporté${rowCount > 1 ? "s" : ""}. Importez le fichier dans Google Sheets pour vos appels.`
      );
    });
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);
    setAction("import");

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await importProspectsCsvAction(formData);
      setAction(null);
      if (!result.success) {
        setError(result.error);
        return;
      }

      const { prospectsUpdated, skippedRows } = result.result;
      setMessage(
        `${prospectsUpdated} prospect${prospectsUpdated > 1 ? "s" : ""} mis à jour${skippedRows > 0 ? ` (${skippedRows} ligne${skippedRows > 1 ? "s" : ""} ignorée${skippedRows > 1 ? "s" : ""})` : ""}.`
      );
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sheet className="h-4 w-4 text-brand" />
            <h3 className="text-sm font-semibold text-foreground">
              CRM Google Sheets (fichier CSV)
            </h3>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Exportez un fichier CSV, importez-le dans Google Sheets, modifiez-le
            avec votre équipe, puis réimportez-le ici pour synchroniser les
            statuts et commentaires.
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Télécharger le CSV ci-dessous</li>
            <li>
              Google Sheets → Fichier → Importer → Téléverser → remplacer la
              feuille
            </li>
            <li>Partager le sheet avec vos commerciaux</li>
            <li>
              Après les appels : Fichier → Télécharger → CSV, puis réimporter
              ici
            </li>
          </ol>
          <p className="text-xs text-muted-foreground">
            Statuts possibles : {COMMERCIAL_STATUSES.join(", ")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="primary"
            onClick={handleExportWithPhone}
            disabled={isPending}
          >
            {action === "export-phone" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            Exporter appels (avec téléphone)
          </Button>
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={isPending}
          >
            {action === "export" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter vers Google Sheets
          </Button>
          <Button
            variant="primary"
            onClick={handleImportClick}
            disabled={isPending}
          >
            {action === "import" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Synchroniser Google Sheets
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          {message}
        </div>
      )}
    </div>
  );
}

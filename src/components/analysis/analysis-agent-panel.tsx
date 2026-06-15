"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Loader2, Play, RotateCcw } from "lucide-react";
import {
  finalizeAnalysisAction,
  getProspectsForAnalysisAction,
  prepareAnalysisAction,
  prepareRealAnalysisAction,
} from "@/actions/analysis";
import { AnalysisConsole } from "./analysis-console";
import { AnalysisResultsTable } from "./analysis-results-table";
import { AnalysisSteps } from "./analysis-steps";
import {
  RealAnalysisForm,
  type RealAnalysisFormData,
} from "./real-analysis-form";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { selectClassName } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  AnalysisLogEvent,
  AnalysisProspectRow,
  AnalysisStep,
  AnalysisStreamEvent,
} from "@/types/analysis";
import { createLogEvent } from "@/types/analysis";

interface ProspectOption {
  id: string;
  nomEntreprise: string;
  ville: string | null;
  scoreIA: number | null;
}

interface AnalysisAgentPanelProps {
  prospects: ProspectOption[];
}

type AnalysisMode = "real" | "existing";

export function AnalysisAgentPanel({
  prospects: initialProspects,
}: AnalysisAgentPanelProps) {
  const [mode, setMode] = useState<AnalysisMode>("real");
  const [prospects, setProspects] = useState(initialProspects);
  const [selectedId, setSelectedId] = useState(initialProspects[0]?.id ?? "");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AnalysisLogEvent[]>([]);
  const [rows, setRows] = useState<AnalysisProspectRow[]>([]);
  const [activeStep, setActiveStep] = useState<AnalysisStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<AnalysisStep>>(
    new Set()
  );
  const [errorStep, setErrorStep] = useState<AnalysisStep | null>(null);

  useEffect(() => {
    setProspects(initialProspects);
    if (initialProspects.length > 0) {
      setSelectedId((current) => current || initialProspects[0].id);
    }
  }, [initialProspects]);

  const resetState = useCallback(() => {
    setLogs([]);
    setRows([]);
    setActiveStep(null);
    setCompletedSteps(new Set());
    setErrorStep(null);
    setError(null);
  }, []);

  const handleStreamEvent = useCallback((event: AnalysisStreamEvent) => {
    switch (event.type) {
      case "log":
        setLogs((prev) => [...prev, event]);
        break;
      case "step":
        if (event.status === "start") {
          setActiveStep(event.step);
        } else if (event.status === "complete") {
          setCompletedSteps((prev) => new Set(prev).add(event.step));
          setActiveStep(null);
        } else if (event.status === "error") {
          setErrorStep(event.step);
          setActiveStep(null);
        }
        break;
      case "prospect":
        setRows([event.prospect]);
        break;
      case "complete":
        setRows((prev) =>
          prev.map((row) =>
            row.id === event.prospectId
              ? { ...row, isComplete: true, stepReached: 7 }
              : row
          )
        );
        break;
      case "error":
        setError(event.message);
        setLogs((prev) => [
          ...prev,
          createLogEvent("sauvegarde", event.message, "error"),
        ]);
        break;
    }
  }, []);

  const consumeStream = useCallback(
    async (prospectId: string) => {
      const response = await fetch("/api/analyse/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });

      if (!response.ok || !response.body) {
        let message = "Impossible de démarrer le flux d'analyse";
        try {
          const data = await response.json();
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as AnalysisStreamEvent;
          handleStreamEvent(event);
        }
      }
    },
    [handleStreamEvent]
  );

  async function runAnalysis(prospectId: string, label: string) {
    resetState();
    setIsRunning(true);
    setError(null);

    try {
      setLogs([
        createLogEvent(
          "recherche",
          `Agent MatoFlow — analyse réelle de ${label}`,
          "info"
        ),
      ]);

      await consumeStream(prospectId);
      await finalizeAnalysisAction(prospectId);

      const refreshed = await getProspectsForAnalysisAction();
      if (refreshed.success) {
        setProspects(refreshed.prospects);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'analyse";
      setError(message);
      setLogs((prev) => [
        ...prev,
        createLogEvent("sauvegarde", message, "error"),
      ]);
    } finally {
      setIsRunning(false);
      setActiveStep(null);
    }
  }

  async function handleLaunchExisting() {
    if (!selectedId || isRunning) return;

    const prepared = await prepareAnalysisAction({ prospectId: selectedId });
    if (!prepared.success) {
      setError(prepared.error);
      return;
    }

    await runAnalysis(selectedId, prepared.prospect.nomEntreprise);
  }

  async function handleLaunchReal(data: RealAnalysisFormData) {
    if (isRunning) return;

    const prepared = await prepareRealAnalysisAction({
      nomEntreprise: data.nomEntreprise,
      siret: data.siret || null,
      siteWeb: data.siteWeb,
      ville: data.ville || null,
      telephone: data.telephone || null,
      email: data.email || null,
      description: data.description || null,
    });

    if (!prepared.success) {
      setError(prepared.error);
      return;
    }

    await runAnalysis(prepared.prospect.id, prepared.prospect.nomEntreprise);
  }

  return (
    <div className="space-y-6">
      <Card className="border-accent-subtle/50 bg-gradient-to-br from-accent-muted/60 to-surface">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Agent IA — analyse réelle
              </h2>
              <p className="text-sm text-muted">
                SIRENE (data.gouv.fr) + scraping site + OpenAI sur données
                réelles.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("real")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "real"
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              Nouvelle entreprise
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                mode === "existing"
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-muted text-muted hover:text-foreground"
              )}
            >
              Prospect en base ({prospects.length})
            </button>
          </div>

          {mode === "real" ? (
            <RealAnalysisForm
              onSubmit={handleLaunchReal}
              disabled={isRunning}
            />
          ) : (
            <div className="space-y-3">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={isRunning || prospects.length === 0}
                className={selectClassName}
              >
                {prospects.length === 0 ? (
                  <option value="">Aucun prospect en base</option>
                ) : (
                  prospects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nomEntreprise}
                      {p.ville ? ` — ${p.ville}` : ""}
                      {p.scoreIA !== null ? ` (score ${p.scoreIA})` : ""}
                    </option>
                  ))
                )}
              </select>

              <Button
                type="button"
                variant="accent"
                onClick={handleLaunchExisting}
                disabled={isRunning || !selectedId}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isRunning ? "Analyse en cours..." : "Lancer l'analyse réelle"}
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={resetState}
            disabled={isRunning}
            className="w-fit"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser la console
          </Button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Progression de l'agent"
          description="Données SIRENE → site web → IA → contenu commercial"
        />
        <AnalysisSteps
          activeStep={activeStep}
          completedSteps={completedSteps}
          errorStep={errorStep}
        />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <AnalysisConsole logs={logs} isRunning={isRunning} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            Résultats progressifs
          </h3>
          <AnalysisResultsTable rows={rows} />
        </div>
      </div>
    </div>
  );
}

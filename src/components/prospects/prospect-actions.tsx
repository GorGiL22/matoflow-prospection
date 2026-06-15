"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Loader2 } from "lucide-react";
import {
  generateContentAction,
  qualifyProspectAction,
} from "@/actions/ai";
import type { Prospect } from "@/types/prospect";

interface ProspectActionsProps {
  prospect: Prospect;
}

export function ProspectActions({ prospect }: ProspectActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"qualify" | "generate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<{
    email: string;
    linkedin: string;
    callScript: string;
  } | null>(
    prospect.emailGenere
      ? {
          email: prospect.emailGenere,
          linkedin: prospect.linkedinGenere ?? "",
          callScript: prospect.scriptAppelGenere ?? "",
        }
      : null
  );

  function handleQualify() {
    setError(null);
    setAction("qualify");
    startTransition(async () => {
      const result = await qualifyProspectAction({ prospectId: prospect.id });
      setAction(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleGenerate() {
    setError(null);
    setAction("generate");
    startTransition(async () => {
      const result = await generateContentAction({ prospectId: prospect.id });
      setAction(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setContent(result.content);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleQualify}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {action === "qualify" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Qualifier avec l&apos;IA
        </button>

        <button
          onClick={handleGenerate}
          disabled={isPending || !prospect.scoreIA}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {action === "generate" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Générer le contenu commercial
        </button>
      </div>

      {content && (
        <div className="space-y-4">
          <ContentBlock title="Email personnalisé" content={content.email} />
          <ContentBlock title="Message LinkedIn" content={content.linkedin} />
          <ContentBlock title="Script d'appel" content={content.callScript} />
        </div>
      )}
    </div>
  );
}

function ContentBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h4>
      <pre className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        {content}
      </pre>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Loader2 } from "lucide-react";
import type { Prospect } from "@/types/prospect";

interface ProspectActionsProps {
  prospect: Prospect;
}

export function ProspectActions({ prospect }: ProspectActionsProps) {
  const router = useRouter();
  const [qualifying, setQualifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [content, setContent] = useState<{
    email: string;
    linkedin: string;
    callScript: string;
  } | null>(
    prospect.generated_email
      ? {
          email: prospect.generated_email,
          linkedin: prospect.generated_linkedin ?? "",
          callScript: prospect.generated_call_script ?? "",
        }
      : null
  );

  async function handleQualify() {
    setQualifying(true);
    try {
      const res = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      if (!res.ok) throw new Error("Erreur qualification");
      router.refresh();
    } catch {
      alert("Erreur lors de la qualification IA");
    } finally {
      setQualifying(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      if (!res.ok) throw new Error("Erreur génération");
      const data = await res.json();
      setContent(data);
      router.refresh();
    } catch {
      alert("Erreur lors de la génération de contenu");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleQualify}
          disabled={qualifying}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {qualifying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Qualifier avec l&apos;IA
        </button>

        <button
          onClick={handleGenerate}
          disabled={generating || !prospect.ai_score}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {generating ? (
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <h4 className="mb-2 text-sm font-semibold text-zinc-900">{title}</h4>
      <pre className="whitespace-pre-wrap text-sm text-zinc-600">{content}</pre>
    </div>
  );
}

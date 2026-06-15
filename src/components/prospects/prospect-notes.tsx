"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addNoteAction } from "@/actions/prospects";
import { formatDate } from "@/lib/utils";
import type { ProspectNote } from "@/types/prospect";

interface ProspectNotesProps {
  prospectId: string;
  notes: ProspectNote[];
}

export function ProspectNotes({ prospectId, notes }: ProspectNotesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const contenu = formData.get("contenu") as string;

    startTransition(async () => {
      const result = await addNoteAction({ prospectId, contenu });
      if (!result.success) {
        setError(result.error);
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <textarea
          name="contenu"
          required
          rows={3}
          placeholder="Ajouter une note..."
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? "Ajout..." : "Ajouter la note"}
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucune note pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {note.contenu}
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(note.dateCreation)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

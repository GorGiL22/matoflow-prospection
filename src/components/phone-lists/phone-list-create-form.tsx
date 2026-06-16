"use client";

import { Loader2, Plus } from "lucide-react";
import { createPhoneListAction } from "@/actions/phone-lists";
import { inputClassName } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Créer la liste
    </Button>
  );
}

export function PhoneListCreateForm() {
  return (
    <form
      action={createPhoneListAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1">
        <label htmlFor="phone-list-name" className="text-sm font-medium text-foreground">
          Nouvelle liste
        </label>
        <input
          id="phone-list-name"
          name="nom"
          required
          maxLength={120}
          placeholder="Ex. Paysagistes Lyon — semaine 24"
          className={inputClassName}
        />
      </div>
      <SubmitButton />
    </form>
  );
}

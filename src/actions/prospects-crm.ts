"use server";

import { revalidatePath } from "next/cache";
import {
  exportAllProspectsCsv,
  exportProspectsWithPhoneCsv,
  importProspectsFromCsv,
} from "@/modules/prospects/crm-csv";

function revalidateProspectPages() {
  revalidatePath("/prospects");
  revalidatePath("/");
}

export async function exportProspectsCsvAction() {
  try {
    const result = await exportAllProspectsCsv();
    return { success: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function exportProspectsWithPhoneCsvAction() {
  try {
    const result = await exportProspectsWithPhoneCsv();
    return { success: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function importProspectsCsvAction(formData: FormData) {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false as const, error: "Fichier CSV requis." };
    }

    const content = await file.text();
    if (!content.trim()) {
      return { success: false as const, error: "Le fichier est vide." };
    }

    const result = await importProspectsFromCsv(content);
    revalidateProspectPages();
    return { success: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

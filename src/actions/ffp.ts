"use server";

import { revalidatePath } from "next/cache";
import {
  cleanupFfpProspectsInDb,
  getFfpConcepteurStats,
  importFfpConcepteurs,
} from "@/modules/scraping/ffp-import";

export async function getFfpConcepteurStatsAction() {
  try {
    const stats = await getFfpConcepteurStats();
    return { success: true as const, stats };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function cleanupFfpConcepteursAction() {
  try {
    const result = await cleanupFfpProspectsInDb();
    revalidatePath("/prospects");
    revalidatePath("/prospects/import-ffp");
    revalidatePath("/prospects/concepteurs-ffp");
    revalidatePath("/campagnes/nouvelle");
    return { success: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function importFfpConcepteursAction() {
  try {
    const result = await importFfpConcepteurs();
    await cleanupFfpProspectsInDb();
    revalidatePath("/prospects");
    revalidatePath("/prospects/import-ffp");
    revalidatePath("/prospects/concepteurs-ffp");
    revalidatePath("/campagnes/nouvelle");
    return { success: true as const, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prospectService } from "@/modules/prospects/service";
import {
  enrichPlaceWithWebsiteEmail,
  searchLandscapersOnGoogleMaps,
} from "@/modules/scraping/google-maps";
import { searchUnepLandscapersInArea } from "@/modules/scraping/unep";
import { unepSearchAreaSchema } from "@/lib/unep-area-schema";
import { UNEP_SEARCH_AREA_IDS } from "@/modules/scraping/unep-areas";
import { UNEP_MAX_RESULTS_PER_RUN } from "@/config/constants";

const searchSchema = z.object({
  ville: z.string().min(1, "Ville requise"),
  maxResults: z.number().int().min(1).max(40).optional(),
  enrichEmails: z.boolean().optional(),
});

const importSchema = z.object({
  places: z.array(
    z.object({
      placeId: z.string(),
      nomEntreprise: z.string(),
      telephone: z.string().nullable(),
      email: z.string().nullable(),
      siteWeb: z.string().nullable(),
      ville: z.string().nullable(),
      adresse: z.string().nullable(),
      avisGoogle: z.number(),
      noteGoogle: z.number().nullable(),
      googleMapsUrl: z.string().nullable(),
    })
  ),
});

export async function searchGoogleMapsAction(
  input: z.infer<typeof searchSchema>
) {
  try {
    const parsed = searchSchema.parse(input);
    let results = await searchLandscapersOnGoogleMaps({
      ville: parsed.ville,
      maxResults: parsed.maxResults ?? 20,
    });

    const saved: { id: string; nomEntreprise: string }[] = [];
    const skipped: string[] = [];
    const enriched: typeof results = [];

    for (const place of results) {
      let current = place;
      if (parsed.enrichEmails && place.siteWeb && !place.email) {
        current = await enrichPlaceWithWebsiteEmail(place);
      }

      try {
        const prospect = await prospectService.importGoogleMapsPlace(current);
        saved.push({ id: prospect.id, nomEntreprise: prospect.nomEntreprise });
      } catch {
        skipped.push(current.nomEntreprise);
      }

      enriched.push(current);
    }

    results = enriched;

    revalidatePath("/");
    revalidatePath("/prospects");
    revalidatePath("/prospects/recherche");

    return {
      success: true as const,
      results,
      savedCount: saved.length,
      skippedCount: skipped.length,
    };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Données invalides"
        : error instanceof Error
          ? error.message
          : "Erreur serveur";
    return { success: false as const, error: message, results: [] };
  }
}

export async function importGoogleMapsPlacesAction(
  input: z.infer<typeof importSchema>
) {
  try {
    const { places } = importSchema.parse(input);
    const imported: { id: string; nomEntreprise: string }[] = [];
    const skipped: string[] = [];

    for (const place of places) {
      try {
        const prospect = await prospectService.importGoogleMapsPlace(place);
        imported.push({ id: prospect.id, nomEntreprise: prospect.nomEntreprise });
      } catch {
        skipped.push(place.nomEntreprise);
      }
    }

    revalidatePath("/");
    revalidatePath("/prospects");
    revalidatePath("/prospects/recherche");

    return {
      success: true as const,
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

const unepSearchSchema = z.object({
  area: unepSearchAreaSchema.optional(),
  maxResults: z.number().int().min(0).max(UNEP_MAX_RESULTS_PER_RUN).optional(),
  startPage: z.number().int().min(1).optional(),
  includeMetropole: z.boolean().optional(),
  excludeExisting: z.boolean().optional(),
});

const nullableString = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().nullable()
);

const unepImportSchema = z.object({
  companies: z.array(
    z.object({
      unepId: z.string().min(1),
      nomEntreprise: z.string().min(1),
      telephone: nullableString,
      email: nullableString,
      siteWeb: nullableString,
      ville: nullableString,
      adresse: nullableString,
      codePostal: nullableString,
      activites: z.array(z.string()),
      unepUrl: z.string().min(1),
    })
  ),
});

export async function searchUnepLyonAction(
  input: z.infer<typeof unepSearchSchema> = {}
) {
  try {
    const parsed = unepSearchSchema.parse(input);
    const results = await searchUnepLandscapersInArea(parsed.area ?? "lyon", {
      maxResults: parsed.maxResults ?? 50,
      startPage: parsed.startPage ?? 1,
      includeMetropole: parsed.includeMetropole ?? false,
      excludeExisting: parsed.excludeExisting ?? true,
    });

    return { success: true as const, results };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Données invalides"
        : error instanceof Error
          ? error.message
          : "Erreur serveur";
    return { success: false as const, error: message, results: [] };
  }
}

export async function importUnepCompaniesAction(
  input: z.infer<typeof unepImportSchema>
) {
  try {
    const { companies } = unepImportSchema.parse(input);
    const imported: { id: string; nomEntreprise: string }[] = [];
    const skipped: { nomEntreprise: string; reason: string }[] = [];

    for (const company of companies) {
      try {
        const prospect = await prospectService.importUnepCompany(company);
        imported.push({ id: prospect.id, nomEntreprise: prospect.nomEntreprise });
      } catch (error) {
        skipped.push({
          nomEntreprise: company.nomEntreprise,
          reason: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/prospects");
    revalidatePath("/prospects/recherche-unep");
    for (const area of UNEP_SEARCH_AREA_IDS) {
      revalidatePath(`/prospects/recherche-unep/${area}`);
    }

    return {
      success: true as const,
      importedCount: imported.length,
      skippedCount: skipped.length,
      imported,
      skipped,
    };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Données invalides"
        : error instanceof Error
          ? error.message
          : "Erreur serveur";
    return { success: false as const, error: message };
  }
}


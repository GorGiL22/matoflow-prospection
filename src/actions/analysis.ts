"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prepareRealProspectForAnalysis } from "@/modules/analysis/prepare-prospect";
import { prospectService } from "@/modules/prospects/service";

const prospectIdSchema = z.object({
  prospectId: z.string().min(1, "Sélectionnez un prospect"),
});

const realAnalysisSchema = z.object({
  nomEntreprise: z.string().min(1, "Nom de l'entreprise requis"),
  siret: z.string().optional().nullable(),
  siteWeb: z.string().min(1, "Site web requis pour une analyse réelle"),
  ville: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  email: z
    .string()
    .email("Email invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z.string().optional().nullable(),
});

export async function getProspectsForAnalysisAction() {
  try {
    const prospects = await prospectService.listProspects();
    return {
      success: true as const,
      prospects: prospects.map((p) => ({
        id: p.id,
        nomEntreprise: p.nomEntreprise,
        ville: p.ville,
        scoreIA: p.scoreIA,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message, prospects: [] };
  }
}

export async function prepareAnalysisAction(
  input: z.infer<typeof prospectIdSchema>
) {
  try {
    const { prospectId } = prospectIdSchema.parse(input);
    const prospect = await prospectService.getProspect(prospectId);

    return {
      success: true as const,
      prospect: {
        id: prospect.id,
        nomEntreprise: prospect.nomEntreprise,
        ville: prospect.ville,
        siteWeb: prospect.siteWeb,
      },
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

export async function prepareRealAnalysisAction(
  input: z.infer<typeof realAnalysisSchema>
) {
  try {
    const parsed = realAnalysisSchema.parse(input);
    const { prospect } = await prepareRealProspectForAnalysis({
      ...parsed,
      email: parsed.email || null,
    });

    return {
      success: true as const,
      prospect: {
        id: prospect.id,
        nomEntreprise: prospect.nomEntreprise,
        ville: prospect.ville,
        siteWeb: prospect.siteWeb,
        siret: prospect.siret,
      },
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

export async function finalizeAnalysisAction(prospectId: string) {
  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath("/analyse");
  revalidatePath(`/prospects/${prospectId}`);
  return { success: true as const };
}

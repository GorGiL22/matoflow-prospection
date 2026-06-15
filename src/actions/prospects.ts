"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prospectService } from "@/modules/prospects/service";
import { PROSPECT_STATUSES } from "@/types/prospect";

const createProspectSchema = z.object({
  nomEntreprise: z.string().min(1, "Nom requis"),
  siret: z.string().optional().nullable(),
  telephone: z.string().optional().nullable(),
  email: z
    .string()
    .email("Email invalide")
    .optional()
    .nullable()
    .or(z.literal("")),
  siteWeb: z.string().optional().nullable(),
  ville: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  avisGoogle: z.number().int().min(0).optional(),
});

const noteSchema = z.object({
  prospectId: z.string().min(1),
  contenu: z.string().min(1, "Note requise"),
});

const statusSchema = z.object({
  prospectId: z.string().min(1),
  statut: z.enum(PROSPECT_STATUSES),
});

function revalidateProspectPages(prospectId?: string) {
  revalidatePath("/");
  revalidatePath("/prospects");
  if (prospectId) {
    revalidatePath(`/prospects/${prospectId}`);
  }
}

export async function createProspectAction(input: z.infer<typeof createProspectSchema>) {
  try {
    const parsed = createProspectSchema.parse(input);
    const prospect = await prospectService.createOrUpdateProspect({
      ...parsed,
      email: parsed.email || null,
    });
    revalidateProspectPages(prospect.id);
    return { success: true as const, prospect };
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

export async function addNoteAction(input: z.infer<typeof noteSchema>) {
  try {
    const parsed = noteSchema.parse(input);
    const note = await prospectService.addNote(parsed.prospectId, parsed.contenu);
    revalidateProspectPages(parsed.prospectId);
    return { success: true as const, note };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function updateStatusAction(input: z.infer<typeof statusSchema>) {
  try {
    const parsed = statusSchema.parse(input);
    const prospect = await prospectService.updateProspectStatus(
      parsed.prospectId,
      parsed.statut
    );
    revalidateProspectPages(parsed.prospectId);
    return { success: true as const, prospect };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

const deleteProspectSchema = z.object({
  prospectId: z.string().min(1),
});

export async function deleteProspectAction(prospectId: string) {
  try {
    const { prospectId: id } = deleteProspectSchema.parse({ prospectId });
    await prospectService.deleteProspect(id);
    revalidateProspectPages();
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

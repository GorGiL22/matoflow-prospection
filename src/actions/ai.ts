"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { contentService } from "@/modules/content/service";
import { qualificationService } from "@/modules/qualification/service";

const qualifySchema = z.object({
  prospectId: z.string().min(1),
  websiteContent: z.string().optional().nullable(),
});

const generateSchema = z.object({
  prospectId: z.string().min(1),
});

function revalidateProspect(prospectId: string) {
  revalidatePath("/");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
}

export async function qualifyProspectAction(
  input: z.infer<typeof qualifySchema>
) {
  try {
    const parsed = qualifySchema.parse(input);
    const prospect = await qualificationService.qualifyProspect(
      parsed.prospectId,
      parsed.websiteContent
    );
    revalidateProspect(parsed.prospectId);
    return { success: true as const, prospect };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function generateContentAction(
  input: z.infer<typeof generateSchema>
) {
  try {
    const parsed = generateSchema.parse(input);
    const content = await contentService.generateForProspect(parsed.prospectId);
    revalidateProspect(parsed.prospectId);
    return { success: true as const, content };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

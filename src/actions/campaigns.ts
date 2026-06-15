"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { campaignService } from "@/modules/campaigns/service";
import { CAMPAIGN_DEFAULTS, CAMPAIGN_TEMPLATE_PLACEHOLDERS } from "@/config/constants";

const createCampaignSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  dailyLimit: z.number().int().min(1).max(100).default(CAMPAIGN_DEFAULTS.dailyLimit),
  minDelayMinutes: z.number().int().min(1).max(60).default(CAMPAIGN_DEFAULTS.minDelayMinutes),
  maxDelayMinutes: z.number().int().min(2).max(120).default(CAMPAIGN_DEFAULTS.maxDelayMinutes),
  minScore: z.number().int().min(0).max(100).optional(),
  limit: z.number().int().min(1).max(500).optional(),
  prospectIds: z.array(z.string().min(1)).optional(),
  selectionMode: z.enum(["auto", "manual"]).default("auto"),
  contentMode: z.enum(["ai", "generic"]).default("ai"),
  genericSubjectTemplate: z.string().optional(),
  genericBodyTemplate: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.selectionMode === "manual" && (!data.prospectIds || data.prospectIds.length === 0)) {
    ctx.addIssue({
      code: "custom",
      message: "Sélectionnez au moins un prospect",
      path: ["prospectIds"],
    });
  }
});

function revalidateCampaign(campaignId?: string) {
  revalidatePath("/campagnes");
  if (campaignId) revalidatePath(`/campagnes/${campaignId}`);
}

export async function createCampaignAction(
  input: z.infer<typeof createCampaignSchema>
) {
  try {
    const parsed = createCampaignSchema.parse(input);
    const result = await campaignService.createCampaign(parsed);
    revalidateCampaign(result.campaign.id);
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function generateCampaignEmailsAction(campaignId: string) {
  try {
    const result = await campaignService.generateEmailsBatch(campaignId, 5);
    revalidateCampaign(campaignId);
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function startCampaignAction(campaignId: string) {
  try {
    const campaign = await campaignService.prepareAndStart(campaignId);
    revalidateCampaign(campaignId);
    return { success: true as const, campaign };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function pauseCampaignAction(campaignId: string) {
  try {
    const campaign = await campaignService.pauseCampaign(campaignId);
    revalidateCampaign(campaignId);
    return { success: true as const, campaign };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function resumeCampaignAction(campaignId: string) {
  try {
    const campaign = await campaignService.resumeCampaign(campaignId);
    revalidateCampaign(campaignId);
    return { success: true as const, campaign };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function markEmailRepliedAction(emailId: string, campaignId: string) {
  try {
    await campaignService.markReplied(emailId);
    revalidateCampaign(campaignId);
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function processCampaignQueueAction() {
  try {
    const result = await campaignService.processQueue();
    revalidatePath("/campagnes");
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

export async function resetCampaignForRetestAction(campaignId: string) {
  try {
    const result = await campaignService.resetCampaignForRetest(campaignId);
    revalidateCampaign(campaignId);
    revalidatePath("/prospects");
    revalidatePath("/campagnes/nouvelle");
    return { success: true as const, ...result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

const updateEmailSchema = z.object({
  emailId: z.string().min(1),
  campaignId: z.string().min(1),
  subject: z.string().min(1, "Objet requis"),
  body: z.string().min(1, "Corps requis"),
});

export async function updateCampaignEmailAction(
  input: z.infer<typeof updateEmailSchema>
) {
  try {
    const parsed = updateEmailSchema.parse(input);
    await campaignService.updateCampaignEmailContent(parsed.emailId, {
      subject: parsed.subject,
      body: parsed.body,
    });
    revalidateCampaign(parsed.campaignId);
    return { success: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

const updateTemplatesSchema = z.object({
  campaignId: z.string().min(1),
  genericSubjectTemplate: z.string().min(1, "Objet modèle requis"),
  genericBodyTemplate: z.string().min(1, "Corps modèle requis"),
});

export async function updateCampaignTemplatesAction(
  input: z.infer<typeof updateTemplatesSchema>
) {
  try {
    const parsed = updateTemplatesSchema.parse(input);
    const campaign = await campaignService.updateCampaignTemplates(
      parsed.campaignId,
      {
        genericSubjectTemplate: parsed.genericSubjectTemplate,
        genericBodyTemplate: parsed.genericBodyTemplate,
      }
    );
    revalidateCampaign(parsed.campaignId);
    return { success: true as const, campaign };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

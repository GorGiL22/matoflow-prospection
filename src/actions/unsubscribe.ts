"use server";

import { revalidatePath } from "next/cache";
import { unsubscribeProspectFromCampaignEmail } from "@/modules/campaigns/unsubscribe-service";

export async function confirmUnsubscribeAction(
  campaignEmailId: string,
  token: string
) {
  try {
    const result = await unsubscribeProspectFromCampaignEmail(
      campaignEmailId,
      token
    );
    if (result.success) {
      revalidatePath("/prospects");
      revalidatePath("/campagnes");
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return { success: false as const, error: message };
  }
}

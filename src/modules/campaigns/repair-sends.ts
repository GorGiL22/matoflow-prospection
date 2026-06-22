import { prisma } from "@/lib/prisma";
import {
  extractResendEmailIdFromError,
  storeResendEmailIdSafely,
} from "@/modules/campaigns/resend-id";

export async function repairMisclassifiedCampaignSends(campaignId?: string): Promise<{
  scanned: number;
  repaired: number;
}> {
  const emails = await prisma.campaignEmail.findMany({
    where: {
      statut: "FAILED",
      errorMessage: { contains: "resendEmailId" },
      ...(campaignId ? { campaignId } : {}),
    },
    select: {
      id: true,
      campaignId: true,
      errorMessage: true,
      sentAt: true,
    },
  });

  let repaired = 0;
  const campaignIds = new Set<string>();

  for (const email of emails) {
    const resendEmailId = extractResendEmailIdFromError(email.errorMessage);
    if (!resendEmailId) continue;

    await prisma.campaignEmail.update({
      where: { id: email.id },
      data: {
        statut: "SENT",
        sentAt: email.sentAt ?? new Date(),
        errorMessage: null,
      },
    });

    await storeResendEmailIdSafely(email.id, resendEmailId);
    campaignIds.add(email.campaignId);
    repaired += 1;
  }

  const { campaignRepository } = await import("@/modules/campaigns/repository");
  for (const campaignId of campaignIds) {
    await campaignRepository.maybeCompleteCampaign(campaignId);
  }

  return { scanned: emails.length, repaired };
}

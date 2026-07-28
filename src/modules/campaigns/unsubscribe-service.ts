import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/modules/campaigns/unsubscribe";

export async function unsubscribeProspectFromCampaignEmail(
  campaignEmailId: string,
  token: string
): Promise<{ success: true; nomEntreprise: string } | { success: false; error: string }> {
  if (!verifyUnsubscribeToken(campaignEmailId, token)) {
    return { success: false, error: "Lien de désabonnement invalide ou expiré." };
  }

  const campaignEmail = await prisma.campaignEmail.findUnique({
    where: { id: campaignEmailId },
    include: { prospect: true },
  });

  if (!campaignEmail) {
    return { success: false, error: "Email introuvable." };
  }

  const prospect = campaignEmail.prospect;

  if (!prospect.emailDesabonne) {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: {
        emailDesabonne: true,
        emailDesabonneAt: new Date(),
      },
    });

    await prisma.activite.create({
      data: {
        prospectId: prospect.id,
        type: "campagne_email",
        description: "Désabonnement des emails de campagne",
        metadata: JSON.stringify({ campaignEmailId }),
      },
    });
  }

  await prisma.campaignEmail.updateMany({
    where: {
      prospectId: prospect.id,
      statut: { in: ["DRAFT", "SCHEDULED", "SENDING"] },
    },
    data: {
      statut: "FAILED",
      errorMessage: "Prospect désabonné",
    },
  });

  return { success: true, nomEntreprise: prospect.nomEntreprise };
}

export async function getUnsubscribePreview(
  campaignEmailId: string,
  token: string
): Promise<{ valid: true; nomEntreprise: string; alreadyUnsubscribed: boolean } | { valid: false; error: string }> {
  if (!verifyUnsubscribeToken(campaignEmailId, token)) {
    return { valid: false, error: "Lien de désabonnement invalide ou expiré." };
  }

  const campaignEmail = await prisma.campaignEmail.findUnique({
    where: { id: campaignEmailId },
    include: {
      prospect: {
        select: {
          nomEntreprise: true,
          emailDesabonne: true,
        },
      },
    },
  });

  if (!campaignEmail) {
    return { valid: false, error: "Email introuvable." };
  }

  return {
    valid: true,
    nomEntreprise: campaignEmail.prospect.nomEntreprise,
    alreadyUnsubscribed: campaignEmail.prospect.emailDesabonne,
  };
}

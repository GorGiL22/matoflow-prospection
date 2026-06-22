import { prisma } from "@/lib/prisma";

/** Enregistre l'ID Resend sans dépendre du client Prisma (migration en attente). */
export async function storeResendEmailIdSafely(
  campaignEmailId: string,
  resendEmailId: string
): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "CampaignEmail"
      SET "resendEmailId" = ${resendEmailId}
      WHERE "id" = ${campaignEmailId}
    `;
  } catch {
    // Colonne absente ou schéma non migré — l'envoi reste valide.
  }
}

export function extractResendEmailIdFromError(errorMessage: string | null): string | null {
  if (!errorMessage) return null;
  const match = errorMessage.match(/resendEmailId:\s*"([^"]+)"/);
  return match?.[1] ?? null;
}

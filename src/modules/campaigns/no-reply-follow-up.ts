import { prisma } from "@/lib/prisma";
import { toProspect } from "@/lib/mappers/prospect";
import { hasValidProspectPhone } from "@/lib/utils";
import { phoneListRepository } from "@/modules/phone-lists/repository";

export function buildCampaignNoReplyPhoneListName(campaignName: string): string {
  const name = campaignName.trim() || "Campagne";
  const suffix = " — pas de réponse";
  const maxLength = 120;
  if (name.length + suffix.length <= maxLength) {
    return `${name}${suffix}`;
  }
  return `${name.slice(0, maxLength - suffix.length)}${suffix}`;
}

export async function populateNoReplyCallList(campaignId: string): Promise<{
  listId: string;
  listName: string;
  total: number;
  added: number;
  skipped: number;
  withoutPhone: number;
}> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign) {
    throw new Error("Campagne introuvable");
  }

  const emails = await prisma.campaignEmail.findMany({
    where: {
      campaignId,
      statut: { in: ["SENT", "OPENED"] },
    },
    select: { prospectId: true },
  });

  const prospectIds = [...new Set(emails.map((email) => email.prospectId))];
  const listName = buildCampaignNoReplyPhoneListName(campaign.nom);
  const list = await phoneListRepository.getOrCreateByName(listName);

  let added = 0;
  let skipped = 0;

  for (const prospectId of prospectIds) {
    const result = await phoneListRepository.addProspectIfHasPhone(
      list.id,
      prospectId
    );
    if (result.added) added += 1;
    else skipped += 1;
  }

  const prospects = await prisma.prospect.findMany({
    where: { id: { in: prospectIds } },
  });

  const withoutPhoneIds = prospects
    .map((record) => toProspect(record))
    .filter((prospect) => !hasValidProspectPhone(prospect))
    .map((prospect) => prospect.id);

  if (withoutPhoneIds.length > 0) {
    await prisma.prospect.updateMany({
      where: { id: { in: withoutPhoneIds } },
      data: {
        statutCommercial: "À appeler",
        commentaireCommercial: `Campagne « ${campaign.nom} » terminée — pas de réponse email`,
      },
    });
  }

  return {
    listId: list.id,
    listName: list.nom,
    total: prospectIds.length,
    added,
    skipped,
    withoutPhone: withoutPhoneIds.length,
  };
}

export async function countNoReplyProspects(campaignId: string): Promise<number> {
  const emails = await prisma.campaignEmail.findMany({
    where: {
      campaignId,
      statut: { in: ["SENT", "OPENED"] },
    },
    select: { prospectId: true },
  });
  return new Set(emails.map((email) => email.prospectId)).size;
}

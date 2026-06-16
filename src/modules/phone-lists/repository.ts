import { prisma } from "@/lib/prisma";
import {
  formatPhoneDisplay,
  hasValidProspectPhone,
} from "@/lib/utils";
import {
  toPhoneListItem,
  toPhoneListSummary,
} from "@/lib/mappers/phone-list";
import type {
  PhoneListDetail,
  PhoneListProspectCandidate,
  PhoneListSummary,
} from "@/types/phone-list";
import { toProspect } from "@/lib/mappers/prospect";

export class PhoneListRepository {
  async findAll(): Promise<PhoneListSummary[]> {
    const lists = await prisma.phoneList.findMany({
      orderBy: { dateModification: "desc" },
      include: { _count: { select: { items: true } } },
    });
    return lists.map(toPhoneListSummary);
  }

  async findById(id: string): Promise<PhoneListDetail | null> {
    const list = await prisma.phoneList.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true } },
        items: { orderBy: { dateAjout: "desc" } },
      },
    });
    if (!list) return null;

    return {
      ...toPhoneListSummary(list),
      items: list.items.map(toPhoneListItem),
    };
  }

  async create(nom: string): Promise<PhoneListSummary> {
    const list = await prisma.phoneList.create({
      data: { nom: nom.trim() },
      include: { _count: { select: { items: true } } },
    });
    return toPhoneListSummary(list);
  }

  async delete(id: string): Promise<void> {
    await prisma.phoneList.delete({ where: { id } });
  }

  async addProspects(listId: string, prospectIds: string[]): Promise<number> {
    if (prospectIds.length === 0) return 0;

    const prospects = await prisma.prospect.findMany({
      where: { id: { in: prospectIds } },
    });

    const existing = await prisma.phoneListItem.findMany({
      where: { listId, prospectId: { in: prospectIds } },
      select: { prospectId: true },
    });
    const existingIds = new Set(
      existing.map((item) => item.prospectId).filter(Boolean)
    );

    const toCreate = prospects
      .map((record) => toProspect(record))
      .filter((prospect) => hasValidProspectPhone(prospect))
      .filter((prospect) => !existingIds.has(prospect.id))
      .map((prospect) => ({
        listId,
        prospectId: prospect.id,
        nomEntreprise: prospect.nomEntreprise,
        telephone: formatPhoneDisplay(prospect.telephone)!,
        ville: prospect.ville,
      }));

    if (toCreate.length === 0) return 0;

    const result = await prisma.phoneListItem.createMany({ data: toCreate });
    await prisma.phoneList.update({
      where: { id: listId },
      data: { dateModification: new Date() },
    });

    return result.count;
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await prisma.phoneListItem.delete({ where: { id: itemId } });
    await prisma.phoneList.update({
      where: { id: item.listId },
      data: { dateModification: new Date() },
    });
  }

  async listProspectCandidates(listId: string): Promise<PhoneListProspectCandidate[]> {
    const [prospects, listItems] = await Promise.all([
      prisma.prospect.findMany({
        where: { telephone: { not: null } },
        orderBy: { nomEntreprise: "asc" },
      }),
      prisma.phoneListItem.findMany({
        where: { listId },
        select: { prospectId: true },
      }),
    ]);

    const inListIds = new Set(
      listItems.map((item) => item.prospectId).filter(Boolean)
    );

    return prospects
      .map((record) => toProspect(record))
      .filter((prospect) => hasValidProspectPhone(prospect))
      .map((prospect) => ({
        id: prospect.id,
        nomEntreprise: prospect.nomEntreprise,
        telephone: formatPhoneDisplay(prospect.telephone)!,
        ville: prospect.ville,
        statut: prospect.statut,
        scoreIA: prospect.scoreIA,
        inList: inListIds.has(prospect.id),
      }));
  }
}

export const phoneListRepository = new PhoneListRepository();

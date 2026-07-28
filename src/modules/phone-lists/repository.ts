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
  PhoneListItem,
  PhoneListProspectCandidate,
  PhoneListSummary,
} from "@/types/phone-list";
import { toProspect } from "@/lib/mappers/prospect";

export class PhoneListRepository {
  private async pendingCountByListIds(
    listIds: string[]
  ): Promise<Map<string, number>> {
    if (listIds.length === 0) return new Map();

    const rows = await prisma.phoneListItem.groupBy({
      by: ["listId"],
      where: { listId: { in: listIds }, appele: false },
      _count: { _all: true },
    });

    return new Map(rows.map((row) => [row.listId, row._count._all]));
  }

  async findAll(): Promise<PhoneListSummary[]> {
    const lists = await prisma.phoneList.findMany({
      orderBy: { dateModification: "desc" },
      include: { _count: { select: { items: true } } },
    });
    const pendingByList = await this.pendingCountByListIds(
      lists.map((list) => list.id)
    );

    return lists.map((list) =>
      toPhoneListSummary({
        ...list,
        pendingCount: pendingByList.get(list.id) ?? 0,
      })
    );
  }

  async findById(id: string): Promise<PhoneListDetail | null> {
    const list = await prisma.phoneList.findUnique({
      where: { id },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: [{ appele: "asc" }, { dateAjout: "desc" }],
        },
      },
    });
    if (!list) return null;

    const pendingCount = list.items.filter((item) => !item.appele).length;

    return {
      ...toPhoneListSummary({ ...list, pendingCount }),
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

  async findByName(nom: string) {
    return prisma.phoneList.findFirst({
      where: { nom },
      include: { _count: { select: { items: true } } },
    });
  }

  async getOrCreateByName(nom: string): Promise<PhoneListSummary> {
    const existing = await this.findByName(nom);
    if (existing) return toPhoneListSummary(existing);
    return this.create(nom);
  }

  async addProspectIfHasPhone(
    listId: string,
    prospectId: string
  ): Promise<{ added: boolean; reason?: string }> {
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });
    if (!prospect) return { added: false, reason: "Prospect introuvable" };

    const mapped = toProspect(prospect);
    if (!hasValidProspectPhone(mapped)) {
      return { added: false, reason: "Pas de numéro de téléphone" };
    }

    const existing = await prisma.phoneListItem.findFirst({
      where: { listId, prospectId },
    });
    if (existing) {
      if (existing.appele) {
        return { added: false, reason: "Déjà appelé dans cette liste" };
      }
      return { added: false, reason: "Déjà dans la liste" };
    }

    await prisma.phoneListItem.create({
      data: {
        listId,
        prospectId,
        nomEntreprise: mapped.nomEntreprise,
        telephone: formatPhoneDisplay(mapped.telephone)!,
        ville: mapped.ville,
      },
    });
    await prisma.phoneList.update({
      where: { id: listId },
      data: { dateModification: new Date() },
    });

    return { added: true };
  }

  async removeItem(itemId: string): Promise<void> {
    const item = await prisma.phoneListItem.delete({ where: { id: itemId } });
    await prisma.phoneList.update({
      where: { id: item.listId },
      data: { dateModification: new Date() },
    });
  }

  async markItemCalled(itemId: string): Promise<PhoneListItem> {
    const item = await prisma.phoneListItem.findUnique({
      where: { id: itemId },
      include: { list: { select: { nom: true } } },
    });
    if (!item) {
      throw new Error("Contact introuvable");
    }
    if (item.appele) {
      return toPhoneListItem(item);
    }

    const now = new Date();
    const updated = await prisma.phoneListItem.update({
      where: { id: itemId },
      data: { appele: true, dateAppel: now },
    });

    if (item.prospectId) {
      await prisma.prospect.update({
        where: { id: item.prospectId },
        data: { dateDernierAppel: now },
      });
      await prisma.activite.create({
        data: {
          prospectId: item.prospectId,
          type: "appel",
          description: `Marqué comme appelé — liste « ${item.list.nom} »`,
        },
      });
    }

    await prisma.phoneList.update({
      where: { id: item.listId },
      data: { dateModification: now },
    });

    return toPhoneListItem(updated);
  }

  async unmarkItemCalled(itemId: string): Promise<PhoneListItem> {
    const item = await prisma.phoneListItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error("Contact introuvable");
    }

    const updated = await prisma.phoneListItem.update({
      where: { id: itemId },
      data: { appele: false, dateAppel: null },
    });

    await prisma.phoneList.update({
      where: { id: item.listId },
      data: { dateModification: new Date() },
    });

    return toPhoneListItem(updated);
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

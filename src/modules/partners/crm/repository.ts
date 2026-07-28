import { prisma } from "@/lib/prisma";
import {
  extractDomainFromUrl,
  normalizePartnerName,
  parsePartnerAnalysis,
  toPartnerStatus,
  toPartnerType,
  toPartnershipKind,
  toPrismaPartnerStatus,
  toPrismaPartnerType,
  toPrismaPartnershipKind,
} from "@/lib/mappers/partner";
import type {
  Partner,
  PartnerActivite,
  PartnerAnalysis,
  PartnerDashboardStats,
  PartnerDetail,
  PartnerNote,
  PartnerOutreachDraft,
  PartnerStatus,
  PartnerType,
  PartnershipKind,
} from "@/types/partner";
import { PARTNER_STATUSES, PARTNER_TYPES } from "@/types/partner";

function toPartner(record: {
  id: string;
  nom: string;
  entreprise: string;
  type: Parameters<typeof toPartnerType>[0];
  siteWeb: string | null;
  linkedinEntreprise: string | null;
  linkedinDirigeant: string | null;
  nomDirigeant: string | null;
  fonctionDirigeant: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  zone: string | null;
  departementsCouverture: string | null;
  tailleEstimee: string | null;
  description: string | null;
  servicesProposes: string | null;
  hasApi: boolean | null;
  scoreEtoiles: number | null;
  analyseIA: string | null;
  partnershipKind: Parameters<typeof toPartnershipKind>[0];
  statut: Parameters<typeof toPartnerStatus>[0];
  sourceRecherche: string | null;
  domaineNormalise: string | null;
  nomNormalise: string | null;
  dateCreation: Date;
  dateModification: Date;
}): Partner {
  return {
    id: record.id,
    nom: record.nom,
    entreprise: record.entreprise,
    type: toPartnerType(record.type),
    siteWeb: record.siteWeb,
    linkedinEntreprise: record.linkedinEntreprise,
    linkedinDirigeant: record.linkedinDirigeant,
    nomDirigeant: record.nomDirigeant,
    fonctionDirigeant: record.fonctionDirigeant,
    email: record.email,
    telephone: record.telephone,
    adresse: record.adresse,
    zone: record.zone,
    departementsCouverture: record.departementsCouverture,
    tailleEstimee: record.tailleEstimee,
    description: record.description,
    servicesProposes: record.servicesProposes,
    hasApi: record.hasApi,
    scoreEtoiles: record.scoreEtoiles,
    analyseIA: parsePartnerAnalysis(record.analyseIA),
    partnershipKind: toPartnershipKind(record.partnershipKind),
    statut: toPartnerStatus(record.statut),
    sourceRecherche: record.sourceRecherche,
    domaineNormalise: record.domaineNormalise,
    nomNormalise: record.nomNormalise,
    dateCreation: record.dateCreation.toISOString(),
    dateModification: record.dateModification.toISOString(),
  };
}

export type UpsertPartnerInput = {
  nom: string;
  entreprise: string;
  type: PartnerType;
  siteWeb?: string | null;
  linkedinEntreprise?: string | null;
  linkedinDirigeant?: string | null;
  nomDirigeant?: string | null;
  fonctionDirigeant?: string | null;
  email?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  zone?: string | null;
  departementsCouverture?: string | null;
  tailleEstimee?: string | null;
  description?: string | null;
  servicesProposes?: string | null;
  hasApi?: boolean | null;
  sourceRecherche?: string | null;
};

class PartnerRepository {
  async list(options?: {
    statut?: PartnerStatus;
    type?: PartnerType;
    minScore?: number;
    search?: string;
  }): Promise<Partner[]> {
    const search = options?.search?.trim();
    const records = await prisma.partner.findMany({
      where: {
        ...(options?.statut
          ? { statut: toPrismaPartnerStatus(options.statut) }
          : {}),
        ...(options?.type ? { type: toPrismaPartnerType(options.type) } : {}),
        ...(options?.minScore !== undefined
          ? { scoreEtoiles: { gte: options.minScore } }
          : {}),
        ...(search
          ? {
              OR: [
                { nom: { contains: search } },
                { entreprise: { contains: search } },
                { description: { contains: search } },
                { zone: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ scoreEtoiles: "desc" }, { dateCreation: "desc" }],
    });
    return records.map(toPartner);
  }

  async getById(id: string): Promise<PartnerDetail | null> {
    const record = await prisma.partner.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { dateCreation: "desc" } },
        activites: { orderBy: { dateCreation: "desc" }, take: 50 },
        drafts: { orderBy: { dateCreation: "desc" }, take: 5 },
      },
    });
    if (!record) return null;

    return {
      ...toPartner(record),
      notes: record.notes.map(
        (n): PartnerNote => ({
          id: n.id,
          partnerId: n.partnerId,
          contenu: n.contenu,
          dateCreation: n.dateCreation.toISOString(),
        })
      ),
      activites: record.activites.map(
        (a): PartnerActivite => ({
          id: a.id,
          partnerId: a.partnerId,
          type: a.type,
          description: a.description,
          metadata: a.metadata,
          dateCreation: a.dateCreation.toISOString(),
        })
      ),
      drafts: record.drafts.map(
        (d): PartnerOutreachDraft => ({
          id: d.id,
          partnerId: d.partnerId,
          emailSubject: d.emailSubject,
          emailBody: d.emailBody,
          linkedinMessage: d.linkedinMessage,
          arguments: d.arguments,
          questionsRdv: d.questionsRdv,
          objections: d.objections,
          dateCreation: d.dateCreation.toISOString(),
          dateModification: d.dateModification.toISOString(),
        })
      ),
    };
  }

  async upsertFromSearch(input: UpsertPartnerInput): Promise<{
    partner: Partner;
    created: boolean;
  }> {
    const domaineNormalise = extractDomainFromUrl(input.siteWeb);
    const nomNormalise = normalizePartnerName(input.entreprise || input.nom);

    const existing = domaineNormalise
      ? await prisma.partner.findUnique({ where: { domaineNormalise } })
      : await prisma.partner.findFirst({
          where: { nomNormalise },
        });

    if (existing) {
      const updated = await prisma.partner.update({
        where: { id: existing.id },
        data: {
          nom: input.nom || existing.nom,
          entreprise: input.entreprise || existing.entreprise,
          type: toPrismaPartnerType(input.type),
          siteWeb: input.siteWeb ?? existing.siteWeb,
          telephone: input.telephone ?? existing.telephone,
          adresse: input.adresse ?? existing.adresse,
          zone: input.zone ?? existing.zone,
          description: input.description ?? existing.description,
          email: input.email ?? existing.email,
          sourceRecherche: input.sourceRecherche ?? existing.sourceRecherche,
          domaineNormalise: domaineNormalise ?? existing.domaineNormalise,
          nomNormalise,
        },
      });
      return { partner: toPartner(updated), created: false };
    }

    const created = await prisma.partner.create({
      data: {
        nom: input.nom,
        entreprise: input.entreprise,
        type: toPrismaPartnerType(input.type),
        siteWeb: input.siteWeb ?? null,
        telephone: input.telephone ?? null,
        adresse: input.adresse ?? null,
        zone: input.zone ?? null,
        description: input.description ?? null,
        email: input.email ?? null,
        sourceRecherche: input.sourceRecherche ?? null,
        domaineNormalise,
        nomNormalise,
        statut: "DECOUVERT",
      },
    });

    await prisma.partnerActivite.create({
      data: {
        partnerId: created.id,
        type: "decouverte",
        description: `Partenaire découvert via ${input.sourceRecherche ?? "recherche"}`,
      },
    });

    return { partner: toPartner(created), created: true };
  }

  async updateStatus(id: string, statut: PartnerStatus): Promise<Partner> {
    const previous = await prisma.partner.findUnique({ where: { id } });
    const updated = await prisma.partner.update({
      where: { id },
      data: { statut: toPrismaPartnerStatus(statut) },
    });
    if (previous && toPartnerStatus(previous.statut) !== statut) {
      await prisma.partnerActivite.create({
        data: {
          partnerId: id,
          type: "changement_statut",
          description: `Statut : ${statut}`,
          metadata: JSON.stringify({
            ancien: toPartnerStatus(previous.statut),
            nouveau: statut,
          }),
        },
      });
    }
    return toPartner(updated);
  }

  async updateFields(
    id: string,
    data: Partial<{
      nom: string;
      entreprise: string;
      type: PartnerType;
      siteWeb: string | null;
      linkedinEntreprise: string | null;
      linkedinDirigeant: string | null;
      nomDirigeant: string | null;
      fonctionDirigeant: string | null;
      email: string | null;
      telephone: string | null;
      adresse: string | null;
      zone: string | null;
      departementsCouverture: string | null;
      tailleEstimee: string | null;
      description: string | null;
      servicesProposes: string | null;
      hasApi: boolean | null;
      scoreEtoiles: number | null;
      analyseIA: PartnerAnalysis | null;
      partnershipKind: PartnershipKind | null;
    }>
  ): Promise<Partner> {
    const updated = await prisma.partner.update({
      where: { id },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.entreprise !== undefined && { entreprise: data.entreprise }),
        ...(data.type !== undefined && {
          type: toPrismaPartnerType(data.type),
        }),
        ...(data.siteWeb !== undefined && { siteWeb: data.siteWeb }),
        ...(data.linkedinEntreprise !== undefined && {
          linkedinEntreprise: data.linkedinEntreprise,
        }),
        ...(data.linkedinDirigeant !== undefined && {
          linkedinDirigeant: data.linkedinDirigeant,
        }),
        ...(data.nomDirigeant !== undefined && {
          nomDirigeant: data.nomDirigeant,
        }),
        ...(data.fonctionDirigeant !== undefined && {
          fonctionDirigeant: data.fonctionDirigeant,
        }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.telephone !== undefined && { telephone: data.telephone }),
        ...(data.adresse !== undefined && { adresse: data.adresse }),
        ...(data.zone !== undefined && { zone: data.zone }),
        ...(data.departementsCouverture !== undefined && {
          departementsCouverture: data.departementsCouverture,
        }),
        ...(data.tailleEstimee !== undefined && {
          tailleEstimee: data.tailleEstimee,
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.servicesProposes !== undefined && {
          servicesProposes: data.servicesProposes,
        }),
        ...(data.hasApi !== undefined && { hasApi: data.hasApi }),
        ...(data.scoreEtoiles !== undefined && {
          scoreEtoiles: data.scoreEtoiles,
        }),
        ...(data.analyseIA !== undefined && {
          analyseIA: data.analyseIA ? JSON.stringify(data.analyseIA) : null,
        }),
        ...(data.partnershipKind !== undefined && {
          partnershipKind: toPrismaPartnershipKind(data.partnershipKind),
        }),
        domaineNormalise:
          data.siteWeb !== undefined
            ? extractDomainFromUrl(data.siteWeb)
            : undefined,
        nomNormalise:
          data.entreprise !== undefined || data.nom !== undefined
            ? normalizePartnerName(
                data.entreprise ??
                  data.nom ??
                  (await prisma.partner.findUnique({ where: { id } }))
                    ?.entreprise ??
                  ""
              )
            : undefined,
      },
    });
    return toPartner(updated);
  }

  async addNote(partnerId: string, contenu: string): Promise<PartnerNote> {
    const note = await prisma.partnerNote.create({
      data: { partnerId, contenu },
    });
    await prisma.partnerActivite.create({
      data: {
        partnerId,
        type: "note",
        description: "Note ajoutée",
      },
    });
    return {
      id: note.id,
      partnerId: note.partnerId,
      contenu: note.contenu,
      dateCreation: note.dateCreation.toISOString(),
    };
  }

  async saveOutreachDraft(
    partnerId: string,
    draft: {
      emailSubject: string;
      emailBody: string;
      linkedinMessage: string;
      arguments: string;
      questionsRdv: string;
      objections: string;
    }
  ): Promise<PartnerOutreachDraft> {
    const created = await prisma.partnerOutreachDraft.create({
      data: {
        partnerId,
        emailSubject: draft.emailSubject,
        emailBody: draft.emailBody,
        linkedinMessage: draft.linkedinMessage,
        arguments: draft.arguments,
        questionsRdv: draft.questionsRdv,
        objections: draft.objections,
      },
    });
    await prisma.partnerActivite.create({
      data: {
        partnerId,
        type: "outreach",
        description: "Messages de contact générés par l'IA",
      },
    });
    return {
      id: created.id,
      partnerId: created.partnerId,
      emailSubject: created.emailSubject,
      emailBody: created.emailBody,
      linkedinMessage: created.linkedinMessage,
      arguments: created.arguments,
      questionsRdv: created.questionsRdv,
      objections: created.objections,
      dateCreation: created.dateCreation.toISOString(),
      dateModification: created.dateModification.toISOString(),
    };
  }

  async getDashboardStats(): Promise<PartnerDashboardStats> {
    const partners = await prisma.partner.findMany({
      select: { statut: true, type: true, scoreEtoiles: true },
    });

    const parStatut = Object.fromEntries(
      PARTNER_STATUSES.map((s) => [s, 0])
    ) as Record<PartnerStatus, number>;
    const parType: Partial<Record<PartnerType, number>> = {};

    for (const p of partners) {
      const statut = toPartnerStatus(p.statut);
      const type = toPartnerType(p.type);
      parStatut[statut] += 1;
      parType[type] = (parType[type] ?? 0) + 1;
    }

    const actifs =
      parStatut.a_contacter +
      parStatut.premier_contact +
      parStatut.rendez_vous +
      parStatut.en_discussion +
      parStatut.partenariat_signe;

    return {
      total: partners.length,
      actifs,
      rendezVous: parStatut.rendez_vous,
      partenariats: parStatut.partenariat_signe,
      clientsGeneres: 0,
      mrrGenere: 0,
      commissionsVersees: 0,
      valeurTotale: 0,
      parStatut,
      parType,
    };
  }

  async listForAgent(limit = 80): Promise<Partner[]> {
    const records = await prisma.partner.findMany({
      orderBy: [{ scoreEtoiles: "desc" }, { dateCreation: "desc" }],
      take: limit,
    });
    return records.map(toPartner);
  }
}

export const partnerRepository = new PartnerRepository();

export function isPartnerType(value: string): value is PartnerType {
  return (PARTNER_TYPES as readonly string[]).includes(value);
}

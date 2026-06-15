import { prisma } from "@/lib/prisma";
import {
  stringifyJson,
  toProspect,
  toProspectActivity,
  toProspectNote,
  toProspectQualification,
  toPrismaStatut,
} from "@/lib/mappers/prospect";
import {
  normalizeEmail,
  normalizeSiret,
  normalizeWebsiteDomain,
} from "@/lib/utils";
import {
  extractDeduplicationKeys,
  mergeProspectData,
} from "@/modules/prospects/deduplication";
import type {
  DashboardStats,
  Prospect,
  ProspectActivity,
  ProspectInsert,
  ProspectNote,
  ProspectQualification,
  ProspectStatus,
  ProspectUpdate,
} from "@/types/prospect";
import type { UnepCompanyResult } from "@/types/scraping";
import { extractUnepSlug } from "@/lib/unep-api";
import { PRIORITY_SCORE_THRESHOLD } from "@/config/constants";

export interface ProspectDeduplicationIndex {
  unepIds: Set<string>;
  unepSlugs: Set<string>;
  emails: Set<string>;
  domains: Set<string>;
  sirets: Set<string>;
  totalProspects: number;
}

function buildUnepDescription(company: UnepCompanyResult): string {
  return [
    company.adresse,
    company.activites.length > 0
      ? `Activités: ${company.activites.join(", ")}`
      : null,
    `UNEP:${company.unepId}`,
    `UNEP: ${company.unepUrl}`,
  ]
    .filter(Boolean)
    .join(" — ");
}

async function getNormalizedConflicts(
  prospectId: string,
  normalized: {
    siretNormalise: string | null;
    emailNormalise: string | null;
    domaineSite: string | null;
  }
) {
  return {
    email: normalized.emailNormalise
      ? Boolean(
          await prisma.prospect.findFirst({
            where: {
              emailNormalise: normalized.emailNormalise,
              NOT: { id: prospectId },
            },
          })
        )
      : false,
    domain: normalized.domaineSite
      ? Boolean(
          await prisma.prospect.findFirst({
            where: {
              domaineSite: normalized.domaineSite,
              NOT: { id: prospectId },
            },
          })
        )
      : false,
    siret: normalized.siretNormalise
      ? Boolean(
          await prisma.prospect.findFirst({
            where: {
              siretNormalise: normalized.siretNormalise,
              NOT: { id: prospectId },
            },
          })
        )
      : false,
  };
}

function buildNormalizedFields(data: ProspectInsert | ProspectUpdate) {
  return {
    siretNormalise: normalizeSiret(data.siret),
    emailNormalise: normalizeEmail(data.email),
    domaineSite: normalizeWebsiteDomain(data.siteWeb),
  };
}

function buildProspectData(data: ProspectUpdate) {
  const normalized = buildNormalizedFields(data);

  return {
    ...(data.nomEntreprise !== undefined && {
      nomEntreprise: data.nomEntreprise.trim(),
    }),
    ...(data.siret !== undefined && { siret: data.siret }),
    ...(data.telephone !== undefined && { telephone: data.telephone }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.siteWeb !== undefined && { siteWeb: data.siteWeb }),
    ...(data.ville !== undefined && { ville: data.ville }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.unepId !== undefined && { unepId: data.unepId }),
    ...(data.unepSlug !== undefined && { unepSlug: data.unepSlug }),
    ...(data.avisGoogle !== undefined &&
      Number.isFinite(data.avisGoogle) && { avisGoogle: data.avisGoogle }),
    ...(data.scoreIA !== undefined && { scoreIA: data.scoreIA }),
    ...(data.statut !== undefined && { statut: toPrismaStatut(data.statut) }),
    ...(data.detailsScoreIA !== undefined && {
      detailsScoreIA: stringifyJson(data.detailsScoreIA),
    }),
    ...(data.emailGenere !== undefined && { emailGenere: data.emailGenere }),
    ...(data.linkedinGenere !== undefined && {
      linkedinGenere: data.linkedinGenere,
    }),
    ...(data.scriptAppelGenere !== undefined && {
      scriptAppelGenere: data.scriptAppelGenere,
    }),
    ...normalized,
  };
}

export class ProspectRepository {
  async findAll(options?: {
    statut?: ProspectStatus;
    minScore?: number;
    limit?: number;
  }): Promise<Prospect[]> {
    const records = await prisma.prospect.findMany({
      where: {
        ...(options?.statut && { statut: toPrismaStatut(options.statut) }),
        ...(options?.minScore !== undefined && {
          scoreIA: { gte: options.minScore },
        }),
      },
      orderBy: { dateCreation: "desc" },
      ...(options?.limit && { take: options.limit }),
    });

    return records.map(toProspect);
  }

  async findById(id: string): Promise<Prospect | null> {
    const record = await prisma.prospect.findUnique({ where: { id } });
    return record ? toProspect(record) : null;
  }

  async backfillUnepReferences(): Promise<number> {
    const records = await prisma.prospect.findMany({
      where: {
        OR: [{ unepId: null }, { unepSlug: null }],
        description: { contains: "UNEP:" },
      },
      select: { id: true, description: true, unepId: true, unepSlug: true },
    });

    let updated = 0;

    for (const record of records) {
      if (!record.description) continue;

      const idMatch = record.description.match(/UNEP:(\d+)/);
      const slugMatch = record.description.match(
        /localiser-un-paysagiste\/([^/\s—]+)/i
      );

      const unepId = record.unepId ?? idMatch?.[1] ?? null;
      const unepSlug = record.unepSlug ?? slugMatch?.[1] ?? null;

      if (!unepId && !unepSlug) continue;
      if (record.unepId === unepId && record.unepSlug === unepSlug) continue;

      try {
        await prisma.prospect.update({
          where: { id: record.id },
          data: {
            ...(unepId ? { unepId } : {}),
            ...(unepSlug ? { unepSlug } : {}),
          },
        });
        updated += 1;
      } catch {
        // Ignore unique constraint conflicts on unepId.
      }
    }

    return updated;
  }

  async getDeduplicationIndex(): Promise<ProspectDeduplicationIndex> {
    const records = await prisma.prospect.findMany({
      select: {
        description: true,
        emailNormalise: true,
        domaineSite: true,
        siretNormalise: true,
        unepId: true,
        unepSlug: true,
      },
    });

    const unepIds = new Set<string>();
    const unepSlugs = new Set<string>();
    const emails = new Set<string>();
    const domains = new Set<string>();
    const sirets = new Set<string>();

    for (const record of records) {
      if (record.unepId) unepIds.add(record.unepId);
      if (record.unepSlug) unepSlugs.add(record.unepSlug);
      if (record.emailNormalise) emails.add(record.emailNormalise);
      if (record.domaineSite) domains.add(record.domaineSite);
      if (record.siretNormalise) sirets.add(record.siretNormalise);

      if (record.description) {
        for (const match of record.description.matchAll(/UNEP:(\d+)/g)) {
          unepIds.add(match[1]);
        }

        const slugMatch = record.description.match(
          /localiser-un-paysagiste\/([^/\s—]+)/i
        );
        if (slugMatch?.[1]) unepSlugs.add(slugMatch[1]);
      }
    }

    return {
      unepIds,
      unepSlugs,
      emails,
      domains,
      sirets,
      totalProspects: records.length,
    };
  }

  async upsert(data: ProspectInsert): Promise<Prospect> {
    const keys = extractDeduplicationKeys(data);
    const orConditions = [
      keys.siretNormalized
        ? { siretNormalise: keys.siretNormalized }
        : null,
      keys.emailNormalized
        ? { emailNormalise: keys.emailNormalized }
        : null,
      keys.websiteDomain ? { domaineSite: keys.websiteDomain } : null,
    ].filter(Boolean) as Array<
      | { siretNormalise: string }
      | { emailNormalise: string }
      | { domaineSite: string }
    >;

    const existing =
      orConditions.length > 0
        ? await prisma.prospect.findFirst({ where: { OR: orConditions } })
        : null;

    if (existing) {
      const merged = mergeProspectData(toProspect(existing), data);
      return this.update(existing.id, merged);
    }

    const record = await prisma.prospect.create({
      data: {
        nomEntreprise: data.nomEntreprise.trim(),
        siret: data.siret ?? null,
        telephone: data.telephone ?? null,
        email: data.email ?? null,
        siteWeb: data.siteWeb ?? null,
        ville: data.ville ?? null,
        description: data.description ?? null,
        avisGoogle: data.avisGoogle ?? 0,
        scoreIA: data.scoreIA ?? null,
        statut: toPrismaStatut(data.statut ?? "nouveau"),
        detailsScoreIA: stringifyJson(data.detailsScoreIA ?? {}),
        ...buildNormalizedFields(data),
      },
    });

    await this.createActivity(record.id, "creation", "Prospect créé");

    return toProspect(record);
  }

  async update(id: string, data: ProspectUpdate): Promise<Prospect> {
    const existing = await prisma.prospect.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Prospect introuvable");
    }

    const prospectData = { ...buildProspectData(data) } as Record<string, unknown>;
    const conflicts = await getNormalizedConflicts(
      id,
      buildNormalizedFields(data)
    );

    if (conflicts.email) {
      delete prospectData.email;
      delete prospectData.emailNormalise;
    }
    if (conflicts.domain) {
      delete prospectData.siteWeb;
      delete prospectData.domaineSite;
    }
    if (conflicts.siret) {
      delete prospectData.siret;
      delete prospectData.siretNormalise;
    }

    const record = await prisma.prospect.update({
      where: { id },
      data: prospectData as Parameters<typeof prisma.prospect.update>[0]["data"],
    });

    if (data.statut && toProspect(existing).statut !== data.statut) {
      await this.createActivity(
        id,
        "changement_statut",
        `Statut changé : ${data.statut}`,
        { ancienStatut: toProspect(existing).statut, nouveauStatut: data.statut }
      );
    } else if (!data.statut) {
      await this.createActivity(id, "mise_a_jour", "Prospect mis à jour");
    }

    return toProspect(record);
  }

  async upsertFromUnep(company: UnepCompanyResult): Promise<Prospect> {
    const unepId = company.unepId;
    const unepSlug = extractUnepSlug(company.unepUrl) ?? company.unepUrl;
    const description = buildUnepDescription(company);

    const payload: ProspectInsert = {
      nomEntreprise: company.nomEntreprise.trim(),
      telephone: company.telephone,
      email: company.email,
      siteWeb: company.siteWeb,
      ville: company.ville,
      description,
      unepId,
      unepSlug,
    };

    const existingByUnepId = await prisma.prospect.findUnique({
      where: { unepId },
    });
    if (existingByUnepId) {
      return this.update(existingByUnepId.id, payload);
    }

    const keys = extractDeduplicationKeys(payload);
    const orConditions = [
      keys.siretNormalized
        ? { siretNormalise: keys.siretNormalized }
        : null,
      keys.emailNormalized
        ? { emailNormalise: keys.emailNormalized }
        : null,
      keys.websiteDomain ? { domaineSite: keys.websiteDomain } : null,
    ].filter(Boolean) as Array<
      | { siretNormalise: string }
      | { emailNormalise: string }
      | { domaineSite: string }
    >;

    const existingByKeys =
      orConditions.length > 0
        ? await prisma.prospect.findFirst({ where: { OR: orConditions } })
        : null;

    if (existingByKeys) {
      const merged = mergeProspectData(toProspect(existingByKeys), payload);
      return this.update(existingByKeys.id, {
        ...merged,
        unepId,
        unepSlug,
      });
    }

    const record = await prisma.prospect.create({
      data: {
        nomEntreprise: payload.nomEntreprise,
        telephone: payload.telephone ?? null,
        email: payload.email ?? null,
        siteWeb: payload.siteWeb ?? null,
        ville: payload.ville ?? null,
        description: payload.description ?? null,
        unepId,
        unepSlug,
        avisGoogle: 0,
        statut: toPrismaStatut("nouveau"),
        detailsScoreIA: stringifyJson({}),
        ...buildNormalizedFields(payload),
      },
    });

    await this.createActivity(record.id, "creation", "Prospect importé depuis UNEP");
    return toProspect(record);
  }

  async delete(id: string): Promise<void> {
    await prisma.prospect.delete({ where: { id } });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalProspects,
      nouveaux,
      contactes,
      relances,
      rdv,
      clients,
      refuses,
      prioritaires,
      scoreAggregate,
    ] = await Promise.all([
      prisma.prospect.count(),
      prisma.prospect.count({ where: { statut: "NOUVEAU" } }),
      prisma.prospect.count({ where: { statut: "CONTACTE" } }),
      prisma.prospect.count({ where: { statut: "RELANCE" } }),
      prisma.prospect.count({ where: { statut: "RDV" } }),
      prisma.prospect.count({ where: { statut: "CLIENT" } }),
      prisma.prospect.count({ where: { statut: "REFUSE" } }),
      prisma.prospect.count({
        where: {
          scoreIA: { gte: PRIORITY_SCORE_THRESHOLD },
          statut: { in: ["NOUVEAU", "CONTACTE", "INTERESSE", "CHAUD"] },
        },
      }),
      prisma.prospect.aggregate({
        _avg: { scoreIA: true },
        where: { scoreIA: { not: null } },
      }),
    ]);

    const tauxConversion =
      totalProspects > 0
        ? Math.round((clients / totalProspects) * 1000) / 10
        : 0;

    return {
      totalProspects,
      nouveaux,
      contactes,
      relances,
      rdv,
      clients,
      refuses,
      prioritaires,
      tauxConversion,
      scoreMoyen: scoreAggregate._avg.scoreIA
        ? Math.round(scoreAggregate._avg.scoreIA * 10) / 10
        : null,
    };
  }

  async getPriorityProspects(limit = 10): Promise<Prospect[]> {
    return this.findAll({ minScore: PRIORITY_SCORE_THRESHOLD, limit });
  }

  async getNotes(prospectId: string): Promise<ProspectNote[]> {
    const notes = await prisma.note.findMany({
      where: { prospectId },
      orderBy: { dateCreation: "desc" },
    });
    return notes.map(toProspectNote);
  }

  async addNote(prospectId: string, contenu: string): Promise<ProspectNote> {
    const note = await prisma.note.create({
      data: { prospectId, contenu },
    });

    await this.createActivity(
      prospectId,
      "note",
      "Note ajoutée",
      { contenu: contenu.slice(0, 120) }
    );

    return toProspectNote(note);
  }

  async getActivities(prospectId: string): Promise<ProspectActivity[]> {
    const activities = await prisma.activite.findMany({
      where: { prospectId },
      orderBy: { dateCreation: "desc" },
    });
    return activities.map(toProspectActivity);
  }

  async createActivity(
    prospectId: string,
    type: string,
    description: string,
    metadata?: Record<string, unknown>
  ): Promise<ProspectActivity> {
    const activity = await prisma.activite.create({
      data: {
        prospectId,
        type,
        description,
        metadata: stringifyJson(metadata),
      },
    });
    return toProspectActivity(activity);
  }

  async addQualification(
    prospectId: string,
    data: {
      score: number;
      criteres: ProspectQualification["criteres"];
      analyseSite?: Record<string, unknown>;
      versionModele?: string;
    }
  ): Promise<ProspectQualification> {
    const qualification = await prisma.qualificationIA.create({
      data: {
        prospectId,
        score: data.score,
        criteres: stringifyJson(data.criteres) ?? "{}",
        analyseSite: stringifyJson(data.analyseSite),
        versionModele: data.versionModele ?? "gpt-4o-mini",
      },
    });

    await this.createActivity(
      prospectId,
      "qualification",
      `Qualification IA : score ${data.score}/100`,
      { score: data.score }
    );

    return toProspectQualification(qualification);
  }
}

import {
  dedupeFfpConcepteursByAgency,
  normalizeFfpAgencyKey,
  sanitizeFfpConcepteur,
  sanitizeFfpEmail,
} from "@/modules/scraping/ffp-dedup";
import {
  enrichFfpConcepteursBatch,
  fetchFfpAnnuaireAgences,
  type FfpImportProgress,
} from "@/modules/scraping/ffp-concepteurs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizeWebsiteDomain } from "@/lib/utils";
import { toPrismaCategorie } from "@/lib/mappers/prospect";
import { ProspectRepository } from "@/modules/prospects/repository";

const repository = new ProspectRepository();

export interface FfpImportResult {
  annuaireCount: number;
  enrichedCount: number;
  imported: number;
  updated: number;
  errors: string[];
}

export async function importFfpConcepteurs(options?: {
  onProgress?: (progress: FfpImportProgress) => void;
}): Promise<FfpImportResult> {
  options?.onProgress?.({
    phase: "annuaire",
    total: 0,
    processed: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  });

  const entries = await fetchFfpAnnuaireAgences();

  options?.onProgress?.({
    phase: "annuaire",
    total: entries.length,
    processed: entries.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  });

  const { results, errors } = await enrichFfpConcepteursBatch(entries, {
    onProgress: options?.onProgress,
  });

  const deduped = dedupeFfpConcepteursByAgency(
    results.map((company) => sanitizeFfpConcepteur(company))
  );

  let imported = 0;
  let updated = 0;

  for (const [index, company] of deduped.entries()) {
    try {
      const { created } = await repository.upsertFromFfp(company);
      if (created) imported += 1;
      else updated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      errors.push(`${company.ffpSlug}: ${message}`);
    }

    options?.onProgress?.({
      phase: "import",
      total: deduped.length,
      processed: index + 1,
      imported,
      updated,
      skipped: 0,
      errors: errors.length,
      current: company.nomEntreprise,
    });
  }

  options?.onProgress?.({
    phase: "done",
    total: deduped.length,
    processed: deduped.length,
    imported,
    updated,
    skipped: 0,
    errors: errors.length,
  });

  return {
    annuaireCount: entries.length,
    enrichedCount: deduped.length,
    imported,
    updated,
    errors,
  };
}

export async function cleanupFfpProspectsInDb(): Promise<{
  emailsFixed: number;
  merged: number;
  deleted: number;
  remaining: number;
}> {
  const records = await prisma.prospect.findMany({
    where: { description: { contains: "FFP:" } },
    orderBy: { dateCreation: "asc" },
  });

  const groups = new Map<string, typeof records>();

  let emailsFixed = 0;

  for (const record of records) {
    const fixedEmail = sanitizeFfpEmail(record.email);
    if (fixedEmail && fixedEmail !== record.email) {
      await prisma.prospect.update({
        where: { id: record.id },
        data: {
          email: fixedEmail,
          emailNormalise: fixedEmail,
        },
      });
      record.email = fixedEmail;
      record.emailNormalise = fixedEmail;
      emailsFixed += 1;
    } else if (!fixedEmail && record.email) {
      await prisma.prospect.update({
        where: { id: record.id },
        data: {
          email: null,
          emailNormalise: null,
        },
      });
      record.email = null;
      record.emailNormalise = null;
    }

    const key = normalizeFfpAgencyKey(record.nomEntreprise, record.ville);
    const bucket = groups.get(key) ?? [];
    bucket.push(record);
    groups.set(key, bucket);
  }

  let merged = 0;
  let deleted = 0;

  for (const members of groups.values()) {
    if (members.length <= 1) continue;

    const sorted = [...members].sort((a, b) => {
      const score = (r: (typeof members)[number]) =>
        (sanitizeFfpEmail(r.email) ? 100 : 0) +
        (r.telephone?.trim() ? 40 : 0) +
        (r.siteWeb?.trim() ? 20 : 0);
      return score(b) - score(a);
    });

    const primary = sorted[0];
    const extras = sorted.slice(1);

    const mergedEmail = sanitizeFfpEmail(primary.email);
    const mergedPhone = primary.telephone ?? extras.find((e) => e.telephone)?.telephone ?? null;
    const mergedSite = primary.siteWeb ?? extras.find((e) => e.siteWeb)?.siteWeb ?? null;
    const mergedDescription = [
      primary.description,
      ...extras.map((e) => e.description).filter(Boolean),
    ]
      .filter(Boolean)
      .join(" — ");

    await prisma.prospect.update({
      where: { id: primary.id },
      data: {
        email: mergedEmail,
        emailNormalise: mergedEmail,
        telephone: mergedPhone,
        siteWeb: mergedSite,
        domaineSite: normalizeWebsiteDomain(mergedSite),
        description: mergedDescription,
        categorie: toPrismaCategorie("concepteur_ffp"),
      },
    });

    for (const extra of extras) {
      await prisma.prospect.delete({ where: { id: extra.id } });
      deleted += 1;
    }

    merged += extras.length;
  }

  const remaining = await prisma.prospect.count({
    where: { description: { contains: "FFP:" } },
  });

  return {
    emailsFixed,
    merged,
    deleted,
    remaining,
  };
}

export async function getFfpConcepteurStats() {
  const count = await repository.countByCategorie("concepteur_ffp");
  return { count };
}

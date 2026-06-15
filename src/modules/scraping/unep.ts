import {
  fetchUnepCompanyDetails,
  listUnepCompaniesByRegion,
  type UnepCompanySummary,
} from "@/lib/unep-api";
import { isProspectInIndex, isUnepSummaryKnown, registerCompanyInIndex } from "@/modules/prospects/deduplication";
import { ProspectRepository } from "@/modules/prospects/repository";
import type { ProspectDeduplicationIndex } from "@/modules/prospects/repository";
import {
  getUnepAreaDefinition,
  type UnepSearchArea,
} from "@/modules/scraping/unep-areas";
import {
  createUnepLogEvent,
  createUnepStepEvent,
  type UnepSearchStreamEvent,
} from "@/types/unep-search";
import { UNEP_MAX_RESULTS_PER_RUN } from "@/config/constants";

export interface UnepSearchConfig {
  maxResults?: number;
  /** Page de départ dans l'annuaire régional (1 = début). */
  startPage?: number;
  includeMetropole?: boolean;
  excludeExisting?: boolean;
  shouldStop?: () => boolean;
}

export type { UnepCompanyResult } from "@/types/scraping";
import type { UnepCompanyResult } from "@/types/scraping";

type UnepSearchEmitter = (event: UnepSearchStreamEvent) => void | Promise<void>;

const LIST_PAGE_SIZE = 100;

const prospectRepository = new ProspectRepository();

function hasReachedMax(matches: UnepCompanyResult[], maxResults: number): boolean {
  return maxResults > 0 && matches.length >= maxResults;
}

function resolveMaxResults(maxResults: number | undefined): number {
  if (maxResults === 0) return 0;
  if (maxResults === undefined) return 50;
  return Math.min(maxResults, UNEP_MAX_RESULTS_PER_RUN);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichCompany(
  summary: UnepCompanySummary
): Promise<UnepCompanyResult | null> {
  const details = await fetchUnepCompanyDetails(summary.link);
  if (!details) return null;

  return {
    unepId: String(summary.id),
    nomEntreprise: details.nomEntreprise || summary.nomEntreprise,
    telephone: details.telephone,
    email: details.email,
    siteWeb: details.siteWeb,
    ville: details.ville,
    adresse: details.adresse,
    codePostal: details.codePostal,
    activites: summary.activites,
    unepUrl: summary.link,
  };
}

async function enrichUntilAreaMatches(
  summaries: UnepCompanySummary[],
  config: {
    area: UnepSearchArea;
    maxResults: number;
    includeMetropole: boolean;
    excludeExisting: boolean;
    existingIndex: ProspectDeduplicationIndex | null;
    matches: UnepCompanyResult[];
    scanned: { value: number };
    skipped: { value: number };
    totalCompanies: number;
    page: number;
    totalPages: number;
    emit?: UnepSearchEmitter;
    shouldStop?: () => boolean;
  }
): Promise<{ stoppedEarly: boolean; cancelled?: boolean }> {
  const areaDefinition = getUnepAreaDefinition(config.area);
  const concurrency = 5;

  for (let index = 0; index < summaries.length; index += concurrency) {
    if (config.shouldStop?.()) {
      return { stoppedEarly: true, cancelled: true };
    }

    if (hasReachedMax(config.matches, config.maxResults)) {
      return { stoppedEarly: true };
    }

    const chunk = summaries.slice(index, index + concurrency);
    const toEnrich: UnepCompanySummary[] = [];
    let chunkSkipped = 0;

    for (const summary of chunk) {
      if (config.shouldStop?.()) {
        return { stoppedEarly: true, cancelled: true };
      }

      if (hasReachedMax(config.matches, config.maxResults)) {
        return { stoppedEarly: true };
      }

      config.scanned.value += 1;

      if (
        config.excludeExisting &&
        config.existingIndex &&
        isUnepSummaryKnown(summary, config.existingIndex)
      ) {
        config.skipped.value += 1;
        chunkSkipped += 1;
        continue;
      }

      toEnrich.push(summary);
    }

    if (chunkSkipped > 0 && config.emit) {
      await config.emit(
        createUnepLogEvent(
          "enrichissement",
          `${chunkSkipped} fiche(s) déjà en base — téléchargement ignoré`,
          "warning"
        )
      );
    }

    if (toEnrich.length === 0) continue;

    const enriched = await Promise.all(toEnrich.map((item) => enrichCompany(item)));

    for (const company of enriched) {
      if (!company) continue;

      if (config.shouldStop?.()) {
        return { stoppedEarly: true, cancelled: true };
      }

      if (hasReachedMax(config.matches, config.maxResults)) {
        return { stoppedEarly: true };
      }

      if (
        !areaDefinition.matchesLocation(
          company.ville,
          company.codePostal,
          config.includeMetropole
        )
      ) {
        if (config.emit && config.scanned.value % 25 === 0) {
          await config.emit(
            createUnepLogEvent(
              "enrichissement",
              `Progression : ${config.scanned.value}/${config.totalCompanies} fiches analysées (${config.matches.length} nouveaux sur ${areaDefinition.areaName})`,
              "info"
            )
          );
        }
        continue;
      }

      if (
        config.excludeExisting &&
        config.existingIndex &&
        isProspectInIndex(
          {
            unepId: company.unepId,
            email: company.email,
            siteWeb: company.siteWeb,
          },
          config.existingIndex
        )
      ) {
        config.skipped.value += 1;
        if (config.emit) {
          await config.emit(
            createUnepLogEvent(
              "filtrage",
              `Doublon détecté — ignoré : ${company.nomEntreprise}${company.email ? ` (${company.email})` : ""}`,
              "warning"
            )
          );
        }
        continue;
      }

      try {
        await prospectRepository.upsertFromUnep(company);
        if (config.existingIndex) {
          registerCompanyInIndex(company, config.existingIndex);
        }
      } catch (error) {
        if (config.emit) {
          await config.emit(
            createUnepLogEvent(
              "filtrage",
              `Erreur enregistrement : ${company.nomEntreprise} — ${
                error instanceof Error ? error.message : "Erreur inconnue"
              }`,
              "error"
            )
          );
        }
        continue;
      }

      config.matches.push(company);

      if (config.emit) {
        await config.emit(
          createUnepLogEvent(
            "filtrage",
            `Enregistré en base : ${company.nomEntreprise} — ${company.ville ?? "?"} ${company.codePostal ?? ""}${company.email ? ` (${company.email})` : ""}`,
            "success"
          )
        );
        await config.emit({
          type: "company",
          company: {
            unepId: company.unepId,
            nomEntreprise: company.nomEntreprise,
            ville: company.ville,
            codePostal: company.codePostal,
            email: company.email,
          },
        });
        await config.emit({
          type: "results",
          results: [...config.matches],
        });
        await config.emit({
          type: "progress",
          page: config.page,
          totalPages: config.totalPages,
          matchesFound: config.matches.length,
          scanned: config.scanned.value,
          skipped: config.skipped.value,
          nextPage: config.page,
          exhausted: false,
        });
      }
    }

    if (index + concurrency < summaries.length) {
      await delay(120);
    }
  }

  if (config.emit) {
    await config.emit(
      createUnepLogEvent(
        "enrichissement",
        `Page ${config.page}/${config.totalPages} terminée — ${config.matches.length} nouveau(x), ${config.skipped.value} ignoré(s)`,
        "info"
      )
    );
  }

  return { stoppedEarly: false };
}

export async function searchUnepLandscapersInArea(
  area: UnepSearchArea,
  config: UnepSearchConfig = {},
  emit?: UnepSearchEmitter
): Promise<UnepCompanyResult[]> {
  const areaDefinition = getUnepAreaDefinition(area);
  const maxResults = resolveMaxResults(config.maxResults);
  const startPage = Math.max(1, config.startPage ?? 1);
  const includeMetropole = config.includeMetropole ?? false;
  const excludeExisting = config.excludeExisting ?? true;
  const matches: UnepCompanyResult[] = [];
  let page = startPage;
  let totalPages = 1;
  let totalCompanies = 0;
  const scanned = { value: 0 };
  const skipped = { value: 0 };
  let resumeNextPage = startPage;
  let resumeExhausted = false;

  const emitEvent = async (event: UnepSearchStreamEvent) => {
    if (emit) await emit(event);
  };

  const emitProgress = async (
    currentPage: number,
    stoppedEarly: boolean
  ) => {
    const limitReached = hasReachedMax(matches, maxResults);
    const exhausted =
      currentPage >= totalPages && !stoppedEarly && !limitReached;
    const nextPage = stoppedEarly || limitReached ? currentPage : currentPage + 1;

    resumeNextPage = exhausted ? 1 : nextPage;
    resumeExhausted = exhausted;

    await emitEvent({
      type: "progress",
      page: currentPage,
      totalPages,
      matchesFound: matches.length,
      scanned: scanned.value,
      skipped: skipped.value,
      nextPage: resumeNextPage,
      exhausted,
    });
  };

  let existingIndex: ProspectDeduplicationIndex | null = null;

  await emitEvent(createUnepStepEvent("initialisation", "start"));
  await emitEvent(
    createUnepLogEvent(
      "initialisation",
      "Connexion à l'annuaire UNEP (lesentreprisesdupaysage.fr)...",
      "info"
    )
  );

  const limitLabel =
    maxResults === 0 ? "sans limite" : `max ${maxResults} nouveaux résultats`;

  await emitEvent(
    createUnepLogEvent(
      "initialisation",
      `Zone cible : ${areaDefinition.areaName}${includeMetropole ? " + métropole" : ""} — ${limitLabel}`,
      "info"
    )
  );

  if (startPage > 1) {
    await emitEvent(
      createUnepLogEvent(
        "initialisation",
        `Reprise du parcours à la page ${startPage}`,
        "info"
      )
    );
  }

  if (excludeExisting) {
    const backfilled = await prospectRepository.backfillUnepReferences();
    existingIndex = await prospectRepository.getDeduplicationIndex();
    await emitEvent(
      createUnepLogEvent(
        "initialisation",
        `${existingIndex.totalProspects} prospect(s) en base — ${existingIndex.unepIds.size} réf. UNEP indexées${backfilled > 0 ? ` (${backfilled} rétro-indexés)` : ""}`,
        "info"
      )
    );
    await emitEvent(
      createUnepLogEvent(
        "initialisation",
        "Les fiches déjà en base ne seront pas retéléchargées — les nouveaux prospects seront enregistrés automatiquement",
        "info"
      )
    );
  }

  await emitEvent(createUnepStepEvent("initialisation", "complete"));

  await emitEvent(createUnepStepEvent("liste_region", "start"));
  await emitEvent(
    createUnepLogEvent(
      "liste_region",
      `Récupération des adhérents ${areaDefinition.regionName}...`,
      "info"
    )
  );

  const metaList = await listUnepCompaniesByRegion(
    areaDefinition.regionId,
    1,
    LIST_PAGE_SIZE
  );
  totalPages = metaList.totalPages;
  totalCompanies = metaList.total;

  await emitEvent(
    createUnepLogEvent(
      "liste_region",
      `${totalCompanies} entreprises référencées en ${areaDefinition.regionName} (${totalPages} pages)`,
      "success"
    )
  );
  await emitEvent(createUnepStepEvent("liste_region", "complete"));

  await emitEvent(createUnepStepEvent("enrichissement", "start"));
  await emitEvent(
    createUnepLogEvent(
      "enrichissement",
      "Lecture des fiches entreprises (email, téléphone, adresse)...",
      "info"
    )
  );
  await emitEvent(createUnepStepEvent("filtrage", "start"));

  let cancelled = false;

  while (page <= totalPages && !hasReachedMax(matches, maxResults)) {
    if (config.shouldStop?.()) {
      cancelled = true;
      break;
    }

    const list = await listUnepCompaniesByRegion(
      areaDefinition.regionId,
      page,
      LIST_PAGE_SIZE
    );

    await emitEvent(
      createUnepLogEvent(
        "liste_region",
        `Page ${page}/${totalPages} — ${list.items.length} entreprises chargées`,
        "info"
      )
    );

    const enrichResult = await enrichUntilAreaMatches(list.items, {
      area,
      maxResults,
      includeMetropole,
      excludeExisting,
      existingIndex,
      matches,
      scanned,
      skipped,
      totalCompanies,
      page,
      totalPages,
      emit,
      shouldStop: config.shouldStop,
    });

    if (enrichResult.cancelled) {
      cancelled = true;
      await emitProgress(page, true);
      break;
    }

    await emitProgress(page, enrichResult.stoppedEarly);

    if (enrichResult.stoppedEarly || hasReachedMax(matches, maxResults)) {
      break;
    }

    page += 1;
  }

  await emitEvent(createUnepStepEvent("enrichissement", "complete"));
  await emitEvent(createUnepStepEvent("filtrage", "complete"));

  await emitEvent(createUnepStepEvent("termine", "start"));

  const limitReached = hasReachedMax(matches, maxResults);
  const resumeHint = cancelled
    ? " Analyse arrêtée — les résultats trouvés jusqu'ici sont conservés."
    : resumeExhausted
      ? " Région entièrement parcourue — prochaine recherche repartira du début."
      : limitReached || resumeNextPage > startPage
        ? ` Relancez pour continuer à partir de la page ${resumeNextPage}.`
        : "";

  await emitEvent(
    createUnepLogEvent(
      "termine",
      cancelled
        ? `Analyse arrêtée : ${matches.length} résultat(s) conservé(s) sur ${areaDefinition.areaName}.`
        : `Recherche terminée : ${matches.length} nouveau(x) sur ${areaDefinition.areaName}, ${skipped.value} doublon(s) ignoré(s).${resumeHint}`,
      matches.length > 0 ? "success" : cancelled ? "warning" : "warning"
    )
  );
  await emitEvent(createUnepStepEvent("termine", "complete"));
  await emitEvent({
    type: "results",
    results: matches,
  });
  await emitEvent({
    type: "complete",
    resultsCount: matches.length,
    resume: {
      nextPage: resumeNextPage,
      totalPages,
      exhausted: resumeExhausted,
    },
  });

  return matches;
}

export async function searchUnepLandscapersInLyon(
  config: UnepSearchConfig = {},
  emit?: UnepSearchEmitter
): Promise<UnepCompanyResult[]> {
  return searchUnepLandscapersInArea("lyon", config, emit);
}

export async function searchUnepLandscapersInParis(
  config: UnepSearchConfig = {},
  emit?: UnepSearchEmitter
): Promise<UnepCompanyResult[]> {
  return searchUnepLandscapersInArea("paris", config, emit);
}

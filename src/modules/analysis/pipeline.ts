import { ProspectRepository } from "@/modules/prospects/repository";
import { fetchCompanyBySiret } from "@/modules/enrichment/sirene";
import { analyzeProspect } from "@/modules/qualification/analyzer";
import { computeAiScore } from "@/modules/qualification/scorer";
import {
  generateEmailContent,
  generateLinkedInContent,
} from "@/modules/content/generator";
import {
  analyzeWebsite,
  formatWebsiteAnalysisForAI,
} from "./website-analyzer";
import { sleep } from "./utils";
import type { Prospect } from "@/types/prospect";
import type { WebsiteAnalysis } from "./website-analyzer";
import type {
  AnalysisProspectRow,
  AnalysisStep,
  AnalysisStreamEvent,
} from "@/types/analysis";
import {
  ANALYSIS_STEPS,
  createLogEvent,
  createStepEvent,
} from "@/types/analysis";

const repository = new ProspectRepository();

type EmitFn = (event: AnalysisStreamEvent) => void | Promise<void>;
type AnalysisLogEvent = import("@/types/analysis").AnalysisLogEvent;

function stepIndex(step: AnalysisStep): number {
  return ANALYSIS_STEPS.indexOf(step) + 1;
}

function toRow(
  prospect: Prospect,
  stepReached: number,
  isComplete = false
): AnalysisProspectRow {
  return {
    id: prospect.id,
    nomEntreprise: prospect.nomEntreprise,
    telephone: prospect.telephone,
    siteWeb: prospect.siteWeb,
    ville: prospect.ville,
    avisGoogle: prospect.avisGoogle,
    scoreIA: prospect.scoreIA,
    emailGenere: prospect.emailGenere,
    linkedinGenere: prospect.linkedinGenere,
    statut: prospect.statut,
    stepReached,
    isComplete,
  };
}

async function emitLog(
  emit: EmitFn,
  step: AnalysisStep,
  message: string,
  level: AnalysisLogEvent["level"] = "info"
) {
  await emit(createLogEvent(step, message, level));
  await sleep(80);
}

async function runStep(
  emit: EmitFn,
  step: AnalysisStep,
  fn: () => Promise<void>
) {
  await emit(createStepEvent(step, "start"));
  await emitLog(emit, step, `${stepLabel(step)} — démarrage...`);

  try {
    await fn();
    await emit(createStepEvent(step, "complete"));
    await emitLog(emit, step, `${stepLabel(step)} — terminé`, "success");
  } catch (error) {
    await emit(createStepEvent(step, "error"));
    throw error;
  }
}

function stepLabel(step: AnalysisStep): string {
  const labels: Record<AnalysisStep, string> = {
    recherche: "Recherche du prospect",
    analyse_site: "Analyse du site web",
    qualification: "Qualification IA",
    score: "Attribution du score",
    email: "Génération de l'email",
    linkedin: "Génération LinkedIn",
    sauvegarde: "Sauvegarde SQLite",
  };
  return labels[step];
}

export async function runAnalysisPipeline(
  prospectId: string,
  emit: EmitFn
): Promise<Prospect> {
  let prospect!: Prospect;
  let websiteAnalysis: WebsiteAnalysis | null = null;
  let criteria: Prospect["detailsScoreIA"] = {};
  let score = 0;

  await runStep(emit, "recherche", async () => {
    await emitLog(emit, "recherche", "Connexion à la base SQLite locale...");

    const found = await repository.findById(prospectId);
    if (!found) {
      throw new Error("Prospect introuvable dans la base SQLite");
    }

    prospect = found;
    await emitLog(
      emit,
      "recherche",
      `Prospect identifié : ${prospect.nomEntreprise}`,
      "success"
    );

    if (prospect.siret) {
      await emitLog(
        emit,
        "recherche",
        `Vérification SIRET ${prospect.siret} via API Entreprises (data.gouv.fr)...`
      );
      const sirene = await fetchCompanyBySiret(prospect.siret);
      if (sirene) {
        await emitLog(
          emit,
          "recherche",
          `Données officielles : ${sirene.activiteLibelle ?? sirene.activitePrincipale} — ${sirene.ville ?? ""}`,
          sirene.estPaysagiste ? "success" : "info"
        );

        const updates: {
          ville?: string | null;
          description?: string | null;
        } = {};
        if (!prospect.ville && sirene.ville) updates.ville = sirene.ville;
        if (
          !prospect.description &&
          (sirene.activiteLibelle || sirene.adresse)
        ) {
          updates.description = [
            sirene.activiteLibelle,
            sirene.adresse,
            sirene.effectif ? `Effectif INSEE : ${sirene.effectif}` : null,
          ]
            .filter(Boolean)
            .join(" — ");
        }

        if (Object.keys(updates).length > 0) {
          prospect = await repository.update(prospect.id, updates);
          await emitLog(emit, "recherche", "Fiche enrichie avec les données SIRENE", "success");
        }
      } else {
        await emitLog(
          emit,
          "recherche",
          "SIRET non trouvé dans le registre — analyse avec les données saisies",
          "warning"
        );
      }
    }

    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("recherche")),
    });
  });

  await runStep(emit, "analyse_site", async () => {
    if (!prospect.siteWeb) {
      await emitLog(
        emit,
        "analyse_site",
        "Aucun site web — qualification basée sur SIRET et description",
        "warning"
      );
      return;
    }

    await emitLog(
      emit,
      "analyse_site",
      `Scraping du site réel : ${prospect.siteWeb}`
    );

    websiteAnalysis = await analyzeWebsite(prospect.siteWeb);

    if (websiteAnalysis) {
      if (websiteAnalysis.title) {
        await emitLog(
          emit,
          "analyse_site",
          `Titre détecté : « ${websiteAnalysis.title} »`,
          "success"
        );
      }
      if (websiteAnalysis.metaDescription) {
        await emitLog(
          emit,
          "analyse_site",
          `Meta : ${websiteAnalysis.metaDescription.slice(0, 100)}...`
        );
      }
      if (websiteAnalysis.headings.length) {
        await emitLog(
          emit,
          "analyse_site",
          `Services/rubriques : ${websiteAnalysis.headings.slice(0, 4).join(", ")}`
        );
      }
      if (websiteAnalysis.emails.length) {
        await emitLog(
          emit,
          "analyse_site",
          `Email(s) extrait(s) : ${websiteAnalysis.emails.join(", ")}`,
          "success"
        );
        if (!prospect.email) {
          prospect = await repository.update(prospect.id, {
            email: websiteAnalysis.emails[0],
          });
        }
      }
      if (websiteAnalysis.phones.length && !prospect.telephone) {
        prospect = await repository.update(prospect.id, {
          telephone: websiteAnalysis.phones[0],
        });
        await emitLog(
          emit,
          "analyse_site",
          `Téléphone extrait : ${websiteAnalysis.phones[0]}`,
          "success"
        );
      }
      await emitLog(
        emit,
        "analyse_site",
        `${websiteAnalysis.wordCount} mots analysés sur le site`,
        "success"
      );
    } else {
      await emitLog(
        emit,
        "analyse_site",
        "Site inaccessible — qualification sur données SIRET/description",
        "warning"
      );
    }

    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("analyse_site")),
    });
  });

  const websiteContent = formatWebsiteAnalysisForAI(websiteAnalysis);

  await runStep(emit, "qualification", async () => {
    await emitLog(
      emit,
      "qualification",
      "Envoi des données réelles à OpenAI (gpt-4o-mini)..."
    );

    criteria = await analyzeProspect({
      companyName: prospect.nomEntreprise,
      website: prospect.siteWeb,
      city: prospect.ville,
      description: prospect.description,
      websiteContent,
    });

    await emitLog(
      emit,
      "qualification",
      criteria.reasoning?.slice(0, 150) ?? "Analyse terminée",
      "success"
    );

    if (criteria.keywords_found?.length) {
      await emitLog(
        emit,
        "qualification",
        `Mots-clés : ${criteria.keywords_found.slice(0, 6).join(", ")}`
      );
    }
  });

  await runStep(emit, "score", async () => {
    score = computeAiScore(criteria);
    await emitLog(emit, "score", `Score calculé : ${score}/100`);

    if (criteria.services_detected?.length) {
      await emitLog(
        emit,
        "score",
        `Services identifiés : ${criteria.services_detected.join(", ")}`,
        "success"
      );
    }

    prospect = await repository.update(prospect.id, {
      scoreIA: score,
      detailsScoreIA: criteria,
    });

    await repository.addQualification(prospect.id, {
      score,
      criteres: criteria,
      analyseSite: websiteAnalysis
        ? {
            url: websiteAnalysis.url,
            title: websiteAnalysis.title,
            wordCount: websiteAnalysis.wordCount,
            headings: websiteAnalysis.headings,
          }
        : { website_content_length: 0 },
    });

    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("score")),
    });
  });

  await runStep(emit, "email", async () => {
    await emitLog(
      emit,
      "email",
      `Rédaction personnalisée pour ${prospect.nomEntreprise}...`
    );
    const email = await generateEmailContent(prospect);
    await emitLog(
      emit,
      "email",
      `Email prêt (${email.length} car.) basé sur l'analyse réelle`,
      "success"
    );

    prospect = await repository.update(prospect.id, { emailGenere: email });
    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("email")),
    });
  });

  await runStep(emit, "linkedin", async () => {
    await emitLog(emit, "linkedin", "Message LinkedIn adapté au profil réel...");
    const linkedin = await generateLinkedInContent(prospect);
    await emitLog(
      emit,
      "linkedin",
      `LinkedIn prêt (${linkedin.length} car.)`,
      "success"
    );

    prospect = await repository.update(prospect.id, {
      linkedinGenere: linkedin,
    });
    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("linkedin")),
    });
  });

  await runStep(emit, "sauvegarde", async () => {
    await emitLog(emit, "sauvegarde", "Persistance SQLite — score, contenu, historique");
    await repository.createActivity(
      prospect.id,
      "contenu",
      `Analyse réelle terminée — score ${score}/100`
    );
    await emitLog(
      emit,
      "sauvegarde",
      "Prospect sauvegardé avec toutes les données enrichies",
      "success"
    );

    prospect = (await repository.findById(prospect.id))!;
    await emit({
      type: "prospect",
      prospect: toRow(prospect, stepIndex("sauvegarde"), true),
    });
  });

  await emit({ type: "complete", prospectId: prospect.id });
  return prospect;
}

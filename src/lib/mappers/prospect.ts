import type {
  Activite,
  Note,
  Prospect as PrismaProspect,
  ProspectCategorie as PrismaProspectCategorie,
  QualificationIA,
  StatutProspect,
} from "@prisma/client";
import type {
  AiScoreDetails,
  Prospect,
  ProspectActivity,
  ProspectCategorie,
  ProspectNote,
  ProspectQualification,
  ProspectStatus,
} from "@/types/prospect";

const STATUT_TO_DOMAIN: Record<StatutProspect, ProspectStatus> = {
  NOUVEAU: "nouveau",
  CONTACTE: "contacte",
  RELANCE: "relance",
  INTERESSE: "interesse",
  CHAUD: "chaud",
  RDV: "rdv",
  CLIENT: "client",
  REFUSE: "refuse",
};

const STATUT_TO_PRISMA: Record<ProspectStatus, StatutProspect> = {
  nouveau: "NOUVEAU",
  contacte: "CONTACTE",
  relance: "RELANCE",
  interesse: "INTERESSE",
  chaud: "CHAUD",
  rdv: "RDV",
  client: "CLIENT",
  refuse: "REFUSE",
};

const CATEGORIE_TO_DOMAIN: Record<PrismaProspectCategorie, ProspectCategorie> = {
  PAYSAGISTE: "paysagiste",
  CONCEPTEUR_FFP: "concepteur_ffp",
};

const CATEGORIE_TO_PRISMA: Record<ProspectCategorie, PrismaProspectCategorie> = {
  paysagiste: "PAYSAGISTE",
  concepteur_ffp: "CONCEPTEUR_FFP",
};

export function toProspectCategorie(
  categorie: PrismaProspectCategorie
): ProspectCategorie {
  return CATEGORIE_TO_DOMAIN[categorie];
}

export function toPrismaCategorie(
  categorie: ProspectCategorie
): PrismaProspectCategorie {
  return CATEGORIE_TO_PRISMA[categorie];
}

function inferProspectCategorie(record: PrismaProspect): ProspectCategorie {
  if (record.categorie) {
    return toProspectCategorie(record.categorie);
  }
  if (record.ffpSlug || record.description?.includes("FFP:")) {
    return "concepteur_ffp";
  }
  return "paysagiste";
}

export function toProspectStatus(statut: StatutProspect): ProspectStatus {
  return STATUT_TO_DOMAIN[statut];
}

export function toPrismaStatut(statut: ProspectStatus): StatutProspect {
  return STATUT_TO_PRISMA[statut];
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toProspect(record: PrismaProspect): Prospect {
  return {
    id: record.id,
    nomEntreprise: record.nomEntreprise,
    siret: record.siret,
    telephone: record.telephone,
    email: record.email,
    siteWeb: record.siteWeb,
    ville: record.ville,
    description: record.description,
    avisGoogle: record.avisGoogle,
    scoreIA: record.scoreIA,
    statut: toProspectStatus(record.statut),
    dateCreation: record.dateCreation.toISOString(),
    dateModification: record.dateModification.toISOString(),
    siretNormalise: record.siretNormalise,
    emailNormalise: record.emailNormalise,
    domaineSite: record.domaineSite,
    detailsScoreIA: parseJson<AiScoreDetails>(record.detailsScoreIA, {}),
    emailGenere: record.emailGenere,
    linkedinGenere: record.linkedinGenere,
    scriptAppelGenere: record.scriptAppelGenere,
    commentaireCommercial: record.commentaireCommercial,
    categorie: inferProspectCategorie(record),
    ffpSlug: record.ffpSlug,
  };
}

export function toProspectNote(record: Note): ProspectNote {
  return {
    id: record.id,
    prospectId: record.prospectId,
    contenu: record.contenu,
    dateCreation: record.dateCreation.toISOString(),
  };
}

export function toProspectActivity(record: Activite): ProspectActivity {
  return {
    id: record.id,
    prospectId: record.prospectId,
    type: record.type,
    description: record.description,
    metadata: parseJson<Record<string, unknown> | null>(record.metadata, null),
    dateCreation: record.dateCreation.toISOString(),
  };
}

export function toProspectQualification(
  record: QualificationIA
): ProspectQualification {
  return {
    id: record.id,
    prospectId: record.prospectId,
    score: record.score,
    criteres: parseJson<AiScoreDetails>(record.criteres, {}),
    analyseSite: parseJson<Record<string, unknown> | null>(
      record.analyseSite,
      null
    ),
    versionModele: record.versionModele,
    dateCreation: record.dateCreation.toISOString(),
  };
}

export function stringifyJson(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

import type {
  PartnerStatus as PrismaPartnerStatus,
  PartnerType as PrismaPartnerType,
  PartnershipKind as PrismaPartnershipKind,
} from "@prisma/client";
import type {
  PartnerAnalysis,
  PartnerStatus,
  PartnerType,
  PartnershipKind,
} from "@/types/partner";

const TYPE_TO_DOMAIN: Record<PrismaPartnerType, PartnerType> = {
  COOPERATIVE: "cooperative",
  CABINET_COMPTABLE: "cabinet_comptable",
  CONSULTANT: "consultant",
  REVENDEUR: "revendeur",
  DISTRIBUTEUR: "distributeur",
  PEPINIERE: "pepiniere",
  FOURNISSEUR: "fournisseur",
  ORGANISME_SAP: "organisme_sap",
  CENTRE_FORMATION: "centre_formation",
  FEDERATION: "federation",
  RESEAU_PRO: "reseau_pro",
  AUTRE: "autre",
};

const TYPE_TO_PRISMA: Record<PartnerType, PrismaPartnerType> = {
  cooperative: "COOPERATIVE",
  cabinet_comptable: "CABINET_COMPTABLE",
  consultant: "CONSULTANT",
  revendeur: "REVENDEUR",
  distributeur: "DISTRIBUTEUR",
  pepiniere: "PEPINIERE",
  fournisseur: "FOURNISSEUR",
  organisme_sap: "ORGANISME_SAP",
  centre_formation: "CENTRE_FORMATION",
  federation: "FEDERATION",
  reseau_pro: "RESEAU_PRO",
  autre: "AUTRE",
};

const STATUS_TO_DOMAIN: Record<PrismaPartnerStatus, PartnerStatus> = {
  DECOUVERT: "decouvert",
  A_CONTACTER: "a_contacter",
  PREMIER_CONTACT: "premier_contact",
  RENDEZ_VOUS: "rendez_vous",
  EN_DISCUSSION: "en_discussion",
  PARTENARIAT_SIGNE: "partenariat_signe",
  REFUS: "refus",
  SUSPENDU: "suspendu",
};

const STATUS_TO_PRISMA: Record<PartnerStatus, PrismaPartnerStatus> = {
  decouvert: "DECOUVERT",
  a_contacter: "A_CONTACTER",
  premier_contact: "PREMIER_CONTACT",
  rendez_vous: "RENDEZ_VOUS",
  en_discussion: "EN_DISCUSSION",
  partenariat_signe: "PARTENARIAT_SIGNE",
  refus: "REFUS",
  suspendu: "SUSPENDU",
};

const KIND_TO_DOMAIN: Record<PrismaPartnershipKind, PartnershipKind> = {
  APPORTEUR_AFFAIRES: "apporteur_affaires",
  REVENDEUR: "revendeur",
  INTEGRATION_API: "integration_api",
  STRATEGIQUE: "strategique",
  OFFRE_ADHERENTS: "offre_adherents",
  CO_MARKETING: "co_marketing",
};

const KIND_TO_PRISMA: Record<PartnershipKind, PrismaPartnershipKind> = {
  apporteur_affaires: "APPORTEUR_AFFAIRES",
  revendeur: "REVENDEUR",
  integration_api: "INTEGRATION_API",
  strategique: "STRATEGIQUE",
  offre_adherents: "OFFRE_ADHERENTS",
  co_marketing: "CO_MARKETING",
};

export function toPartnerType(value: PrismaPartnerType): PartnerType {
  return TYPE_TO_DOMAIN[value];
}

export function toPrismaPartnerType(value: PartnerType): PrismaPartnerType {
  return TYPE_TO_PRISMA[value];
}

export function toPartnerStatus(value: PrismaPartnerStatus): PartnerStatus {
  return STATUS_TO_DOMAIN[value];
}

export function toPrismaPartnerStatus(value: PartnerStatus): PrismaPartnerStatus {
  return STATUS_TO_PRISMA[value];
}

export function toPartnershipKind(
  value: PrismaPartnershipKind | null | undefined
): PartnershipKind | null {
  if (!value) return null;
  return KIND_TO_DOMAIN[value];
}

export function toPrismaPartnershipKind(
  value: PartnershipKind | null | undefined
): PrismaPartnershipKind | null {
  if (!value) return null;
  return KIND_TO_PRISMA[value];
}

export function parsePartnerAnalysis(
  raw: string | null | undefined
): PartnerAnalysis | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PartnerAnalysis;
  } catch {
    return null;
  }
}

export function normalizePartnerName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractDomainFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
    return host || null;
  } catch {
    return null;
  }
}

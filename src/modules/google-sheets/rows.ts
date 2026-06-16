import type { Prospect as PrismaProspect } from "@prisma/client";
import {
  COMMERCIAL_STATUSES,
  SHEET_HEADERS,
  type CommercialStatus,
} from "@/types/google-sheets";

export const HEADER_COUNT = SHEET_HEADERS.length;
export const DATA_COLUMN_COUNT = 12;

const COL = Object.fromEntries(
  SHEET_HEADERS.map((header, index) => [header, index])
) as Record<(typeof SHEET_HEADERS)[number], number>;

function isEmptyCell(value: string | undefined | null): boolean {
  return !value?.trim();
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return "";
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = value.getFullYear();
  return `${day}/${month}/${year}`;
}

export function parseSheetDate(value: string | undefined | null): Date | null {
  if (!value?.trim()) return null;

  const trimmed = value.trim();

  const frenchMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (frenchMatch) {
    const [, day, month, year] = frenchMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoParsed = new Date(trimmed);
  if (!Number.isNaN(isoParsed.getTime())) {
    return isoParsed;
  }

  const serial = Number(trimmed);
  if (Number.isFinite(serial) && serial > 0) {
    const utcDays = Math.floor(serial - 25569);
    const parsed = new Date(utcDays * 86400000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function extractSiren(prospect: PrismaProspect): string {
  if (prospect.siren?.trim()) return prospect.siren.trim();
  const siret = prospect.siretNormalise ?? prospect.siret?.replace(/\D/g, "");
  if (!siret || siret.length < 9) return "";
  return siret.slice(0, 9);
}

function extractAdresse(prospect: PrismaProspect): string {
  if (prospect.adresse?.trim()) return prospect.adresse.trim();
  if (!prospect.description) return "";

  const firstPart = prospect.description.split(" — ")[0]?.trim() ?? "";
  if (!firstPart || firstPart.startsWith("UNEP:")) return "";
  return firstPart;
}

export function prospectToDataCells(prospect: PrismaProspect): string[] {
  return [
    prospect.id,
    prospect.nomEntreprise,
    prospect.telephone ?? "",
    prospect.email ?? "",
    prospect.siteWeb ?? "",
    prospect.ville ?? "",
    extractAdresse(prospect),
    extractSiren(prospect),
    prospect.effectif ?? "",
    prospect.chiffreAffaires ?? "",
    prospect.scoreIA != null ? String(prospect.scoreIA) : "",
    formatDate(prospect.dateCreation),
  ];
}

export function prospectToCommercialCells(prospect: PrismaProspect): string[] {
  return [
    prospect.statutCommercial?.trim() || "À appeler",
    prospect.commentaireCommercial ?? "",
    formatDate(prospect.dateDernierAppel),
    formatDate(prospect.dateRappel),
    prospect.commercialAssigne ?? "",
  ];
}

export function prospectToRow(prospect: PrismaProspect): string[] {
  return [...prospectToDataCells(prospect), ...prospectToCommercialCells(prospect)];
}

export function padRow(row: string[] | undefined): string[] {
  const padded = [...(row ?? [])];
  while (padded.length < HEADER_COUNT) {
    padded.push("");
  }
  return padded.slice(0, HEADER_COUNT);
}

export function mergeExportRow(
  existingRow: string[] | undefined,
  prospect: PrismaProspect
): string[] {
  const current = padRow(existingRow);
  const dataCells = prospectToDataCells(prospect);
  const commercialCells = prospectToCommercialCells(prospect);

  const merged = [...current];

  for (let index = 0; index < DATA_COLUMN_COUNT; index += 1) {
    if (isEmptyCell(current[index]) && !isEmptyCell(dataCells[index])) {
      merged[index] = dataCells[index];
    }
  }

  for (let index = 0; index < commercialCells.length; index += 1) {
    const colIndex = DATA_COLUMN_COUNT + index;
    if (isEmptyCell(current[colIndex])) {
      merged[colIndex] = commercialCells[index];
    }
  }

  if (isEmptyCell(merged[COL["Statut"]])) {
    merged[COL["Statut"]] = "À appeler";
  }

  return merged;
}

export function isValidCommercialStatus(value: string): value is CommercialStatus {
  return (COMMERCIAL_STATUSES as readonly string[]).includes(value);
}

export function readCommercialFieldsFromRow(row: string[] | undefined) {
  const current = padRow(row);
  const statut = current[COL["Statut"]]?.trim();

  return {
    statutCommercial:
      statut && isValidCommercialStatus(statut) ? statut : statut || null,
    commentaireCommercial: current[COL["Commentaire"]]?.trim() || null,
    dateDernierAppel: parseSheetDate(current[COL["Date dernier appel"]]),
    dateRappel: parseSheetDate(current[COL["Date de rappel"]]),
    commercialAssigne: current[COL["Commercial assigné"]]?.trim() || null,
  };
}

export function readDataFieldsFromRow(row: string[] | undefined) {
  const current = padRow(row);
  return {
    adresse: current[COL["Adresse"]]?.trim() || null,
    siren: current[COL["SIREN"]]?.trim() || null,
    effectif: current[COL["Effectif"]]?.trim() || null,
    chiffreAffaires: current[COL["Chiffre d'affaires"]]?.trim() || null,
  };
}

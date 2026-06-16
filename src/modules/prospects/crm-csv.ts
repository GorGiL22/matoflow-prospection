import type { Prospect as PrismaProspect } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasValidProspectPhone } from "@/lib/utils";
import {
  HEADER_COUNT,
  padRow,
  prospectToRow,
  readCommercialFieldsFromRow,
  readDataFieldsFromRow,
} from "@/modules/google-sheets/rows";
import { SHEET_HEADERS } from "@/types/google-sheets";

function escapeCsv(value: string): string {
  if (/[",\n\r;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildProspectsCsv(prospects: PrismaProspect[]): string {
  const header = SHEET_HEADERS.join(",");
  const rows = prospects.map((prospect) =>
    prospectToRow(prospect).map(escapeCsv).join(",")
  );
  return `\uFEFF${[header, ...rows].join("\n")}`;
}

export function detectDelimiter(headerLine: string): "," | ";" {
  const commas = (headerLine.match(/,/g) ?? []).length;
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function parseCsv(content: string): string[][] {
  const text = content.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text.split(/\r?\n/)[0] ?? "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      cell = "";
      if (char === "\r") index += 1;
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.trim())) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export async function exportAllProspectsCsv() {
  const prospects = await prisma.prospect.findMany({
    orderBy: { dateCreation: "asc" },
  });

  const date = new Date().toISOString().slice(0, 10);
  return {
    content: buildProspectsCsv(prospects),
    filename: `matoflow-prospects-${date}.csv`,
    rowCount: prospects.length,
  };
}

export async function exportProspectsWithPhoneCsv() {
  const prospects = await prisma.prospect.findMany({
    where: { telephone: { not: null } },
    orderBy: { dateCreation: "asc" },
  });

  const withPhone = prospects.filter((prospect) =>
    hasValidProspectPhone(prospect)
  );

  const date = new Date().toISOString().slice(0, 10);
  return {
    content: buildProspectsCsv(withPhone),
    filename: `matoflow-appels-${date}.csv`,
    rowCount: withPhone.length,
  };
}

export interface CsvImportResult {
  rowsProcessed: number;
  prospectsUpdated: number;
  skippedRows: number;
}

export async function importProspectsFromCsv(content: string): Promise<CsvImportResult> {
  const rows = parseCsv(content);
  if (rows.length <= 1) {
    return { rowsProcessed: 0, prospectsUpdated: 0, skippedRows: 0 };
  }

  const headerRow = rows[0].map(String);
  const normalizedHeaders = headerRow.map(normalizeHeader);
  const idColumnIndex = normalizedHeaders.indexOf(normalizeHeader("ID"));

  if (idColumnIndex === -1) {
    throw new Error(
      "Colonne « ID » introuvable. Utilisez le fichier exporté depuis MatoFlow sans modifier la première ligne."
    );
  }

  let prospectsUpdated = 0;
  let skippedRows = 0;

  for (let index = 1; index < rows.length; index += 1) {
    const row = padRow(rows[index]?.map(String));
    const prospectId = row[idColumnIndex]?.trim();

    if (!prospectId) {
      skippedRows += 1;
      continue;
    }

    const existing = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!existing) {
      skippedRows += 1;
      continue;
    }

    const commercial = readCommercialFieldsFromRow(row);
    const dataFields = readDataFieldsFromRow(row);

    await prisma.prospect.update({
      where: { id: prospectId },
      data: {
        statutCommercial: commercial.statutCommercial,
        commentaireCommercial: commercial.commentaireCommercial,
        dateDernierAppel: commercial.dateDernierAppel,
        dateRappel: commercial.dateRappel,
        commercialAssigne: commercial.commercialAssigne,
        ...(dataFields.adresse && !existing.adresse
          ? { adresse: dataFields.adresse }
          : {}),
        ...(dataFields.siren && !existing.siren ? { siren: dataFields.siren } : {}),
        ...(dataFields.effectif && !existing.effectif
          ? { effectif: dataFields.effectif }
          : {}),
        ...(dataFields.chiffreAffaires && !existing.chiffreAffaires
          ? { chiffreAffaires: dataFields.chiffreAffaires }
          : {}),
      },
    });

    prospectsUpdated += 1;
  }

  return {
    rowsProcessed: rows.length - 1,
    prospectsUpdated,
    skippedRows,
  };
}

export function validateCsvHeaders(content: string): boolean {
  const rows = parseCsv(content);
  if (rows.length === 0) return false;
  const headers = rows[0].map(normalizeHeader);
  return headers.includes(normalizeHeader("ID")) && headers.length >= HEADER_COUNT - 2;
}

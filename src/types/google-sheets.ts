export const COMMERCIAL_STATUSES = [
  "À appeler",
  "Intéressé",
  "Très intéressé",
  "Démo programmée",
  "À rappeler",
  "Pas intéressé",
  "Ne répond pas",
  "Numéro invalide",
  "Client",
] as const;

export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];

export const SHEET_HEADERS = [
  "ID",
  "Nom entreprise",
  "Téléphone",
  "Email",
  "Site internet",
  "Ville",
  "Adresse",
  "SIREN",
  "Effectif",
  "Chiffre d'affaires",
  "Score IA",
  "Date d'ajout",
  "Statut",
  "Commentaire",
  "Date dernier appel",
  "Date de rappel",
  "Commercial assigné",
] as const;

export type SheetHeader = (typeof SHEET_HEADERS)[number];

export interface GoogleSheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  created: boolean;
  totalProspects: number;
  rowsAdded: number;
  rowsUpdated: number;
  sheetRowCount: number;
}

export interface GoogleSheetsSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  rowsProcessed: number;
  prospectsUpdated: number;
  skippedRows: number;
}

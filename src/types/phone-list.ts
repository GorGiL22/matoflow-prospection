export interface PhoneListSummary {
  id: string;
  nom: string;
  dateCreation: string;
  dateModification: string;
  itemCount: number;
}

export interface PhoneListItem {
  id: string;
  listId: string;
  prospectId: string | null;
  nomEntreprise: string;
  telephone: string;
  ville: string | null;
  dateAjout: string;
}

export interface PhoneListDetail extends PhoneListSummary {
  items: PhoneListItem[];
}

export interface PhoneListProspectCandidate {
  id: string;
  nomEntreprise: string;
  telephone: string;
  ville: string | null;
  statut: string;
  scoreIA: number | null;
  inList: boolean;
}

export type PhoneListExportFormat = "csv" | "txt-numbers" | "txt-full";

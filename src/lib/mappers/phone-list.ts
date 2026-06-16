import type { PhoneListItem, PhoneListSummary } from "@/types/phone-list";

export function toPhoneListSummary(record: {
  id: string;
  nom: string;
  dateCreation: Date;
  dateModification: Date;
  _count: { items: number };
}): PhoneListSummary {
  return {
    id: record.id,
    nom: record.nom,
    dateCreation: record.dateCreation.toISOString(),
    dateModification: record.dateModification.toISOString(),
    itemCount: record._count.items,
  };
}

export function toPhoneListItem(record: {
  id: string;
  listId: string;
  prospectId: string | null;
  nomEntreprise: string;
  telephone: string;
  ville: string | null;
  dateAjout: Date;
}): PhoneListItem {
  return {
    id: record.id,
    listId: record.listId,
    prospectId: record.prospectId,
    nomEntreprise: record.nomEntreprise,
    telephone: record.telephone,
    ville: record.ville,
    dateAjout: record.dateAjout.toISOString(),
  };
}

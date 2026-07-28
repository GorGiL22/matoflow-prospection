import type { PartnerSearchCandidate, PartnerType } from "@/types/partner";
import { PARTNER_TYPE_LABELS } from "@/types/partner";

export interface PartnerSearchProvider {
  readonly name: string;
  search(input: {
    zone: string;
    type: PartnerType;
    limit: number;
  }): Promise<PartnerSearchCandidate[]>;
}

export function buildSearchQueries(zone: string, type: PartnerType): string[] {
  const label = PARTNER_TYPE_LABELS[type];
  const zoneLabel = zone.trim() || "France";
  const base = [
    `${label} paysage ${zoneLabel}`,
    `${label} entreprises du paysage ${zoneLabel}`,
    `${label} espaces verts ${zoneLabel}`,
  ];

  switch (type) {
    case "cooperative":
      return [
        `coopérative paysage ${zoneLabel}`,
        `coopérative horticulture ${zoneLabel}`,
        `CUMA paysage ${zoneLabel}`,
      ];
    case "cabinet_comptable":
      return [
        `cabinet comptable entreprises paysage ${zoneLabel}`,
        `expert comptable paysagistes ${zoneLabel}`,
        `comptable métiers verts ${zoneLabel}`,
      ];
    case "organisme_sap":
      return [
        `organisme SAP jardinage ${zoneLabel}`,
        `plateforme service à la personne jardin ${zoneLabel}`,
        `CESU jardinage ${zoneLabel}`,
      ];
    case "federation":
      return [
        `fédération entreprises paysage ${zoneLabel}`,
        `UNEP ${zoneLabel}`,
        `fédération horticulture ${zoneLabel}`,
      ];
    case "reseau_pro":
      return [
        `réseau professionnels paysage ${zoneLabel}`,
        `réseau paysagistes ${zoneLabel}`,
        `club entreprises espaces verts ${zoneLabel}`,
      ];
    case "pepiniere":
      return [
        `pépinière professionnelle ${zoneLabel}`,
        `pépiniériste grossiste ${zoneLabel}`,
      ];
    case "centre_formation":
      return [
        `centre formation paysage ${zoneLabel}`,
        `formation paysagiste ${zoneLabel}`,
        `CFA horticulture ${zoneLabel}`,
      ];
    default:
      return base;
  }
}

export function guessTypeFromText(
  text: string,
  fallback: PartnerType
): PartnerType {
  const lower = text.toLowerCase();
  if (lower.includes("coopérative") || lower.includes("cooperative")) {
    return "cooperative";
  }
  if (lower.includes("comptable") || lower.includes("expertise comptable")) {
    return "cabinet_comptable";
  }
  if (lower.includes("consultant") || lower.includes("conseil")) {
    return "consultant";
  }
  if (lower.includes("revendeur") || lower.includes("reseller")) {
    return "revendeur";
  }
  if (lower.includes("distributeur") || lower.includes("grossiste")) {
    return "distributeur";
  }
  if (lower.includes("pépini") || lower.includes("pepini")) {
    return "pepiniere";
  }
  if (lower.includes("fournisseur")) return "fournisseur";
  if (lower.includes("sap") || lower.includes("cesu")) return "organisme_sap";
  if (lower.includes("formation") || lower.includes("cfa")) {
    return "centre_formation";
  }
  if (lower.includes("fédération") || lower.includes("federation") || lower.includes("unep")) {
    return "federation";
  }
  if (lower.includes("réseau") || lower.includes("reseau")) return "reseau_pro";
  return fallback;
}

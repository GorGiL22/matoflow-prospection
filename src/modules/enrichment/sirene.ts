import { normalizeSiret } from "@/lib/utils";

export interface SireneCompanyData {
  nomEntreprise: string;
  siret: string;
  siren: string;
  ville: string | null;
  codePostal: string | null;
  adresse: string | null;
  activitePrincipale: string | null;
  activiteLibelle: string | null;
  effectif: string | null;
  dateCreation: string | null;
  estPaysagiste: boolean;
}

const PAYSAGE_NAF_PREFIXES = ["81.30", "02.10", "43.12", "81.21", "81.22"];

function isLandscapingActivity(code: string | null | undefined): boolean {
  if (!code) return false;
  return PAYSAGE_NAF_PREFIXES.some((prefix) => code.startsWith(prefix));
}

function mapNafLabel(code: string | null): string | null {
  if (!code) return null;
  if (code.startsWith("81.30")) return "Services d'aménagement paysager";
  if (code.startsWith("81.21")) return "Entretien espaces verts";
  if (code.startsWith("43.12")) return "Travaux de terrassement / aménagement";
  return `Activité NAF ${code}`;
}

export async function fetchCompanyBySiret(
  siret: string | null | undefined
): Promise<SireneCompanyData | null> {
  const normalized = normalizeSiret(siret);
  if (!normalized) return null;

  try {
    const response = await fetch(
      `https://recherche-entreprises.api.gouv.fr/search?q=${normalized}&per_page=1`,
      {
        signal: AbortSignal.timeout(8_000),
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const result = data.results?.[0];
    if (!result) return null;

    const etablissement = result.matching_etablissements?.[0] ?? result.siege;
    const siretMatch =
      etablissement?.siret === normalized
        ? etablissement
        : result.matching_etablissements?.find(
            (e: { siret: string }) => e.siret === normalized
          ) ?? etablissement;

    const activite =
      siretMatch?.activite_principale ?? result.activite_principale ?? null;

    return {
      nomEntreprise:
        result.nom_complet ??
        result.nom_raison_sociale ??
        "Entreprise inconnue",
      siret: siretMatch?.siret ?? normalized,
      siren: result.siren,
      ville: siretMatch?.libelle_commune ?? result.siege?.libelle_commune ?? null,
      codePostal: siretMatch?.code_postal ?? result.siege?.code_postal ?? null,
      adresse: siretMatch?.adresse ?? result.siege?.adresse ?? null,
      activitePrincipale: activite,
      activiteLibelle: mapNafLabel(activite),
      effectif:
        siretMatch?.tranche_effectif_salarie ??
        result.tranche_effectif_salarie ??
        null,
      dateCreation: siretMatch?.date_creation ?? result.date_creation ?? null,
      estPaysagiste: isLandscapingActivity(activite),
    };
  } catch {
    return null;
  }
}

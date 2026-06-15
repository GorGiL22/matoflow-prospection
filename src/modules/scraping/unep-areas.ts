import {
  UNEP_REGION_AUVERGNE_RHONE_ALPES,
  UNEP_REGION_BRETAGNE,
  UNEP_REGION_CENTRE,
  UNEP_REGION_GRAND_EST,
  UNEP_REGION_ILE_DE_FRANCE,
  UNEP_REGION_NORMANDIE,
  UNEP_REGION_NOUVELLE_AQUITAINE,
  UNEP_REGION_OCCITANIE,
  UNEP_REGION_PACA,
  UNEP_REGION_PAYS_DE_LA_LOIRE,
} from "@/lib/unep-api";

export const UNEP_SEARCH_AREA_IDS = [
  "lyon",
  "paris",
  "marseille",
  "nice",
  "toulon",
  "avignon",
  "aix-en-provence",
  "bordeaux",
  "la-rochelle",
  "poitiers",
  "limoges",
  "pau",
  "bayonne",
  "toulouse",
  "montpellier",
  "nimes",
  "perpignan",
  "beziers",
  "nantes",
  "angers",
  "le-mans",
  "rennes",
  "brest",
  "lorient",
  "vannes",
  "strasbourg",
  "lille",
  "metz",
  "nancy",
  "mulhouse",
  "besancon",
  "tours",
  "orleans",
  "bourges",
  "grenoble",
  "saint-etienne",
  "clermont-ferrand",
  "valence",
  "annecy",
  "chambery",
  "dijon",
  "reims",
  "troyes",
  "amiens",
  "rouen",
  "le-havre",
  "caen",
  "dunkerque",
  "calais",
  "saint-brieuc",
  "quimper",
  "saint-nazaire",
  "la-roche-sur-yon",
  "niort",
  "angouleme",
  "perigueux",
  "agen",
  "cannes",
  "albi",
  "carcassonne",
  "tarbes",
  "colmar",
  "cherbourg",
  "evreux",
  "chartres",
  "blois",
  "bourg-en-bresse",
  "rodez",
] as const;

export type UnepSearchArea = (typeof UNEP_SEARCH_AREA_IDS)[number];

export interface UnepAreaDefinition {
  regionId: number;
  regionName: string;
  zoneLabel: string;
  areaName: string;
  approximateCount: number;
  defaultImportVille: string;
  metropoleCheckboxLabel: string;
  includeMetropoleDefault: boolean;
  narrowWithoutMetroHint?: string;
  matchesLocation: (
    ville: string | null,
    codePostal: string | null,
    includeMetropole: boolean
  ) => boolean;
}

function normalizeCity(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

const LYON_POSTAL_CODES = new Set([
  "69001",
  "69002",
  "69003",
  "69004",
  "69005",
  "69006",
  "69007",
  "69008",
  "69009",
]);

const LYON_METROPOLE_POSTAL_PREFIXES = [
  "691",
  "692",
  "693",
  "694",
  "695",
  "696",
  "697",
  "698",
  "699",
];

const LYON_METROPOLE_CITIES = new Set([
  "LYON",
  "VILLEURBANNE",
  "CALUIRE ET CUIRE",
  "ECULLY",
  "TASSIN LA DEMI LUNE",
  "OULLINS",
  "BRON",
  "VENISSIEUX",
  "SAINT PRIEST",
  "DECINES CHARPIEU",
  "MEYZIEU",
  "RILLIEUX LA PAPE",
  "VAULX EN VELIN",
  "SAINT GENIS LAVAL",
  "FRANCHEVILLE",
]);

const PARIS_POSTAL_CODES = new Set(
  Array.from({ length: 20 }, (_, index) =>
    `750${String(index + 1).padStart(2, "0")}`
  ).concat("75116")
);

const PARIS_METROPOLE_CITIES = new Set([
  "PARIS",
  "BOULOGNE BILLANCOURT",
  "NEUILLY SUR SEINE",
  "LEVALLOIS PERRET",
  "CLICHY",
  "ISSY LES MOULINEAUX",
  "MONTREUIL",
  "SAINT DENIS",
  "VINCENNES",
  "NANTERRE",
  "RUEIL MALMAISON",
  "COURBEVOIE",
  "ASNIERES SUR SEINE",
  "COLOMBES",
  "PUTEAUX",
  "SURESNES",
  "CLAMART",
  "MONTROUGE",
  "MALAKOFF",
  "ANTONY",
  "CRETEIL",
  "NOISY LE GRAND",
  "VITRY SUR SEINE",
]);

const IDF_POSTAL_PREFIXES = ["75", "77", "78", "91", "92", "93", "94", "95"];

function matchesIdfPostal(codePostal: string | null): boolean {
  const postal = codePostal?.trim() ?? "";
  return (
    postal.length === 5 &&
    IDF_POSTAL_PREFIXES.some((prefix) => postal.startsWith(prefix))
  );
}

function matchesByPostalAndCity(
  ville: string | null,
  codePostal: string | null,
  includeMetropole: boolean,
  config: {
    cityPostalCodes: Set<string>;
    cityName: string;
    metropolePostalPrefixes: string[];
    metropoleCities: Set<string>;
  }
): boolean {
  const normalizedCity = normalizeCity(ville);
  const postal = codePostal?.trim() ?? "";

  if (postal && config.cityPostalCodes.has(postal)) return true;
  if (
    normalizedCity === config.cityName ||
    normalizedCity.startsWith(`${config.cityName} `)
  ) {
    return true;
  }

  if (!includeMetropole) return false;

  if (
    postal.length === 5 &&
    config.metropolePostalPrefixes.some((prefix) => postal.startsWith(prefix))
  ) {
    return true;
  }

  return config.metropoleCities.has(normalizedCity);
}

function createDepartmentCityArea(options: {
  regionId: number;
  regionName: string;
  areaName: string;
  cityName: string;
  departmentPrefix: string;
  approximateCount: number;
  includeMetropoleDefault?: boolean;
  metroLabel?: string;
}): UnepAreaDefinition {
  const normalizedCity = normalizeCity(options.cityName);

  return {
    regionId: options.regionId,
    regionName: options.regionName,
    zoneLabel: `${options.areaName} (${options.departmentPrefix})`,
    areaName: options.areaName,
    approximateCount: options.approximateCount,
    defaultImportVille: options.areaName,
    includeMetropoleDefault: options.includeMetropoleDefault ?? true,
    metropoleCheckboxLabel:
      options.metroLabel ??
      `Inclure tout le département ${options.departmentPrefix}`,
    narrowWithoutMetroHint: `Sans le département entier, seule la ville de ${options.areaName} est conservée — peu de résultats.`,
    matchesLocation: (ville, codePostal, includeMetropole) => {
      const postal = codePostal?.trim() ?? "";
      const normalizedVille = normalizeCity(ville);

      if (
        postal.length === 5 &&
        postal.startsWith(options.departmentPrefix)
      ) {
        if (includeMetropole) return true;
        return (
          normalizedVille === normalizedCity ||
          normalizedVille.startsWith(`${normalizedCity} `)
        );
      }

      return (
        normalizedVille === normalizedCity ||
        normalizedVille.startsWith(`${normalizedCity} `)
      );
    },
  };
}

export const UNEP_AREA_DEFINITIONS: Record<UnepSearchArea, UnepAreaDefinition> =
  {
    lyon: {
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      zoneLabel: "Lyon (69)",
      areaName: "Lyon",
      approximateCount: 468,
      defaultImportVille: "Lyon",
      includeMetropoleDefault: false,
      metropoleCheckboxLabel:
        "Inclure la métropole lyonnaise (Villeurbanne, Caluire, Écully…)",
      narrowWithoutMetroHint:
        "Sans la métropole, seuls Lyon intra-muros et communes proches sont conservés.",
      matchesLocation: (ville, codePostal, includeMetropole) =>
        matchesByPostalAndCity(ville, codePostal, includeMetropole, {
          cityPostalCodes: LYON_POSTAL_CODES,
          cityName: "LYON",
          metropolePostalPrefixes: LYON_METROPOLE_POSTAL_PREFIXES,
          metropoleCities: LYON_METROPOLE_CITIES,
        }),
    },
    paris: {
      regionId: UNEP_REGION_ILE_DE_FRANCE,
      regionName: "Île-de-France",
      zoneLabel: "Paris & Île-de-France",
      areaName: "Paris / IDF",
      approximateCount: 507,
      defaultImportVille: "Paris",
      includeMetropoleDefault: true,
      metropoleCheckboxLabel:
        "Inclure toute l'Île-de-France (92, 93, 94, 77, 78, 91, 95…)",
      narrowWithoutMetroHint:
        "Sans l'Île-de-France, seuls les codes postaux parisiens (75) sont conservés — souvent une vingtaine de résultats.",
      matchesLocation: (ville, codePostal, includeMetropole) => {
        if (includeMetropole) {
          if (matchesIdfPostal(codePostal)) return true;
          const normalizedCity = normalizeCity(ville);
          if (
            PARIS_METROPOLE_CITIES.has(normalizedCity) ||
            normalizedCity === "PARIS" ||
            normalizedCity.startsWith("PARIS ")
          ) {
            return true;
          }
          return !codePostal?.trim();
        }

        return matchesByPostalAndCity(ville, codePostal, false, {
          cityPostalCodes: PARIS_POSTAL_CODES,
          cityName: "PARIS",
          metropolePostalPrefixes: ["92", "93", "94"],
          metropoleCities: PARIS_METROPOLE_CITIES,
        });
      },
    },
    marseille: createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Marseille",
      cityName: "MARSEILLE",
      departmentPrefix: "13",
      approximateCount: 336,
    }),
    nice: createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Nice",
      cityName: "NICE",
      departmentPrefix: "06",
      approximateCount: 336,
    }),
    toulon: createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Toulon",
      cityName: "TOULON",
      departmentPrefix: "83",
      approximateCount: 336,
    }),
    bordeaux: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Bordeaux",
      cityName: "BORDEAUX",
      departmentPrefix: "33",
      approximateCount: 490,
    }),
    toulouse: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Toulouse",
      cityName: "TOULOUSE",
      departmentPrefix: "31",
      approximateCount: 378,
    }),
    montpellier: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Montpellier",
      cityName: "MONTPELLIER",
      departmentPrefix: "34",
      approximateCount: 378,
    }),
    nimes: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Nîmes",
      cityName: "NIMES",
      departmentPrefix: "30",
      approximateCount: 378,
    }),
    nantes: createDepartmentCityArea({
      regionId: UNEP_REGION_PAYS_DE_LA_LOIRE,
      regionName: "Pays de la Loire",
      areaName: "Nantes",
      cityName: "NANTES",
      departmentPrefix: "44",
      approximateCount: 407,
    }),
    rennes: createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Rennes",
      cityName: "RENNES",
      departmentPrefix: "35",
      approximateCount: 400,
    }),
    strasbourg: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Strasbourg",
      cityName: "STRASBOURG",
      departmentPrefix: "67",
      approximateCount: 301,
    }),
    lille: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Lille",
      cityName: "LILLE",
      departmentPrefix: "59",
      approximateCount: 301,
    }),
    tours: createDepartmentCityArea({
      regionId: UNEP_REGION_CENTRE,
      regionName: "Centre-Val de Loire",
      areaName: "Tours",
      cityName: "TOURS",
      departmentPrefix: "37",
      approximateCount: 241,
    }),
    orleans: createDepartmentCityArea({
      regionId: UNEP_REGION_CENTRE,
      regionName: "Centre-Val de Loire",
      areaName: "Orléans",
      cityName: "ORLEANS",
      departmentPrefix: "45",
      approximateCount: 241,
    }),
    grenoble: createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Grenoble",
      cityName: "GRENOBLE",
      departmentPrefix: "38",
      approximateCount: 468,
    }),
    "saint-etienne": createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Saint-Étienne",
      cityName: "SAINT ETIENNE",
      departmentPrefix: "42",
      approximateCount: 468,
    }),
    "clermont-ferrand": createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Clermont-Ferrand",
      cityName: "CLERMONT FERRAND",
      departmentPrefix: "63",
      approximateCount: 468,
    }),
    angers: createDepartmentCityArea({
      regionId: UNEP_REGION_PAYS_DE_LA_LOIRE,
      regionName: "Pays de la Loire",
      areaName: "Angers",
      cityName: "ANGERS",
      departmentPrefix: "49",
      approximateCount: 407,
    }),
    dijon: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Dijon",
      cityName: "DIJON",
      departmentPrefix: "21",
      approximateCount: 301,
    }),
    reims: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Reims",
      cityName: "REIMS",
      departmentPrefix: "51",
      approximateCount: 301,
    }),
    rouen: createDepartmentCityArea({
      regionId: UNEP_REGION_NORMANDIE,
      regionName: "Normandie",
      areaName: "Rouen",
      cityName: "ROUEN",
      departmentPrefix: "76",
      approximateCount: 389,
    }),
    "le-havre": createDepartmentCityArea({
      regionId: UNEP_REGION_NORMANDIE,
      regionName: "Normandie",
      areaName: "Le Havre",
      cityName: "LE HAVRE",
      departmentPrefix: "76",
      approximateCount: 389,
      metroLabel: "Inclure toute la Seine-Maritime (76)",
    }),
    caen: createDepartmentCityArea({
      regionId: UNEP_REGION_NORMANDIE,
      regionName: "Normandie",
      areaName: "Caen",
      cityName: "CAEN",
      departmentPrefix: "14",
      approximateCount: 389,
    }),
    avignon: createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Avignon",
      cityName: "AVIGNON",
      departmentPrefix: "84",
      approximateCount: 336,
    }),
    "aix-en-provence": createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Aix-en-Provence",
      cityName: "AIX EN PROVENCE",
      departmentPrefix: "13",
      approximateCount: 336,
      metroLabel: "Inclure tout le département des Bouches-du-Rhône (13)",
    }),
    "la-rochelle": createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "La Rochelle",
      cityName: "LA ROCHELLE",
      departmentPrefix: "17",
      approximateCount: 490,
    }),
    poitiers: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Poitiers",
      cityName: "POITIERS",
      departmentPrefix: "86",
      approximateCount: 490,
    }),
    limoges: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Limoges",
      cityName: "LIMOGES",
      departmentPrefix: "87",
      approximateCount: 490,
    }),
    pau: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Pau",
      cityName: "PAU",
      departmentPrefix: "64",
      approximateCount: 490,
    }),
    bayonne: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Bayonne",
      cityName: "BAYONNE",
      departmentPrefix: "64",
      approximateCount: 490,
      metroLabel: "Inclure les Pyrénées-Atlantiques (64)",
    }),
    perpignan: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Perpignan",
      cityName: "PERPIGNAN",
      departmentPrefix: "66",
      approximateCount: 378,
    }),
    beziers: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Béziers",
      cityName: "BEZIERS",
      departmentPrefix: "34",
      approximateCount: 378,
      metroLabel: "Inclure l'Hérault (34)",
    }),
    "le-mans": createDepartmentCityArea({
      regionId: UNEP_REGION_PAYS_DE_LA_LOIRE,
      regionName: "Pays de la Loire",
      areaName: "Le Mans",
      cityName: "LE MANS",
      departmentPrefix: "72",
      approximateCount: 407,
    }),
    brest: createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Brest",
      cityName: "BREST",
      departmentPrefix: "29",
      approximateCount: 400,
    }),
    lorient: createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Lorient",
      cityName: "LORIENT",
      departmentPrefix: "56",
      approximateCount: 400,
    }),
    vannes: createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Vannes",
      cityName: "VANNES",
      departmentPrefix: "56",
      approximateCount: 400,
      metroLabel: "Inclure le Morbihan (56)",
    }),
    metz: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Metz",
      cityName: "METZ",
      departmentPrefix: "57",
      approximateCount: 301,
    }),
    nancy: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Nancy",
      cityName: "NANCY",
      departmentPrefix: "54",
      approximateCount: 301,
    }),
    mulhouse: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Mulhouse",
      cityName: "MULHOUSE",
      departmentPrefix: "68",
      approximateCount: 301,
    }),
    besancon: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Besançon",
      cityName: "BESANCON",
      departmentPrefix: "25",
      approximateCount: 301,
    }),
    troyes: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Troyes",
      cityName: "TROYES",
      departmentPrefix: "10",
      approximateCount: 301,
    }),
    amiens: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Amiens",
      cityName: "AMIENS",
      departmentPrefix: "80",
      approximateCount: 301,
    }),
    bourges: createDepartmentCityArea({
      regionId: UNEP_REGION_CENTRE,
      regionName: "Centre-Val de Loire",
      areaName: "Bourges",
      cityName: "BOURGES",
      departmentPrefix: "18",
      approximateCount: 241,
    }),
    valence: createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Valence",
      cityName: "VALENCE",
      departmentPrefix: "26",
      approximateCount: 468,
    }),
    annecy: createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Annecy",
      cityName: "ANNECY",
      departmentPrefix: "74",
      approximateCount: 468,
    }),
    chambery: createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Chambéry",
      cityName: "CHAMBERY",
      departmentPrefix: "73",
      approximateCount: 468,
    }),
    dunkerque: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Dunkerque",
      cityName: "DUNKERQUE",
      departmentPrefix: "59",
      approximateCount: 301,
      metroLabel: "Inclure le Nord (59)",
    }),
    calais: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Calais",
      cityName: "CALAIS",
      departmentPrefix: "62",
      approximateCount: 301,
    }),
    "saint-brieuc": createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Saint-Brieuc",
      cityName: "SAINT BRIEUC",
      departmentPrefix: "22",
      approximateCount: 400,
    }),
    quimper: createDepartmentCityArea({
      regionId: UNEP_REGION_BRETAGNE,
      regionName: "Bretagne",
      areaName: "Quimper",
      cityName: "QUIMPER",
      departmentPrefix: "29",
      approximateCount: 400,
      metroLabel: "Inclure le Finistère (29)",
    }),
    "saint-nazaire": createDepartmentCityArea({
      regionId: UNEP_REGION_PAYS_DE_LA_LOIRE,
      regionName: "Pays de la Loire",
      areaName: "Saint-Nazaire",
      cityName: "SAINT NAZAIRE",
      departmentPrefix: "44",
      approximateCount: 407,
      metroLabel: "Inclure la Loire-Atlantique (44)",
    }),
    "la-roche-sur-yon": createDepartmentCityArea({
      regionId: UNEP_REGION_PAYS_DE_LA_LOIRE,
      regionName: "Pays de la Loire",
      areaName: "La Roche-sur-Yon",
      cityName: "LA ROCHE SUR YON",
      departmentPrefix: "85",
      approximateCount: 407,
    }),
    niort: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Niort",
      cityName: "NIORT",
      departmentPrefix: "79",
      approximateCount: 490,
    }),
    angouleme: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Angoulême",
      cityName: "ANGOULEME",
      departmentPrefix: "16",
      approximateCount: 490,
    }),
    perigueux: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Périgueux",
      cityName: "PERIGUEUX",
      departmentPrefix: "24",
      approximateCount: 490,
    }),
    agen: createDepartmentCityArea({
      regionId: UNEP_REGION_NOUVELLE_AQUITAINE,
      regionName: "Nouvelle-Aquitaine",
      areaName: "Agen",
      cityName: "AGEN",
      departmentPrefix: "47",
      approximateCount: 490,
    }),
    cannes: createDepartmentCityArea({
      regionId: UNEP_REGION_PACA,
      regionName: "Provence-Alpes-Côte d'Azur",
      areaName: "Cannes",
      cityName: "CANNES",
      departmentPrefix: "06",
      approximateCount: 336,
      metroLabel: "Inclure les Alpes-Maritimes (06)",
    }),
    albi: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Albi",
      cityName: "ALBI",
      departmentPrefix: "81",
      approximateCount: 378,
    }),
    carcassonne: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Carcassonne",
      cityName: "CARCASSONNE",
      departmentPrefix: "11",
      approximateCount: 378,
    }),
    tarbes: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Tarbes",
      cityName: "TARBES",
      departmentPrefix: "65",
      approximateCount: 378,
    }),
    colmar: createDepartmentCityArea({
      regionId: UNEP_REGION_GRAND_EST,
      regionName: "Grand Est",
      areaName: "Colmar",
      cityName: "COLMAR",
      departmentPrefix: "68",
      approximateCount: 301,
      metroLabel: "Inclure le Haut-Rhin (68)",
    }),
    cherbourg: createDepartmentCityArea({
      regionId: UNEP_REGION_NORMANDIE,
      regionName: "Normandie",
      areaName: "Cherbourg-en-Cotentin",
      cityName: "CHERBOURG EN COTENTIN",
      departmentPrefix: "50",
      approximateCount: 389,
    }),
    evreux: createDepartmentCityArea({
      regionId: UNEP_REGION_NORMANDIE,
      regionName: "Normandie",
      areaName: "Évreux",
      cityName: "EVREUX",
      departmentPrefix: "27",
      approximateCount: 389,
    }),
    chartres: createDepartmentCityArea({
      regionId: UNEP_REGION_CENTRE,
      regionName: "Centre-Val de Loire",
      areaName: "Chartres",
      cityName: "CHARTRES",
      departmentPrefix: "28",
      approximateCount: 241,
    }),
    blois: createDepartmentCityArea({
      regionId: UNEP_REGION_CENTRE,
      regionName: "Centre-Val de Loire",
      areaName: "Blois",
      cityName: "BLOIS",
      departmentPrefix: "41",
      approximateCount: 241,
    }),
    "bourg-en-bresse": createDepartmentCityArea({
      regionId: UNEP_REGION_AUVERGNE_RHONE_ALPES,
      regionName: "Auvergne-Rhône-Alpes",
      areaName: "Bourg-en-Bresse",
      cityName: "BOURG EN BRESSE",
      departmentPrefix: "01",
      approximateCount: 468,
    }),
    rodez: createDepartmentCityArea({
      regionId: UNEP_REGION_OCCITANIE,
      regionName: "Occitanie",
      areaName: "Rodez",
      cityName: "RODEZ",
      departmentPrefix: "12",
      approximateCount: 378,
    }),
  };

export function getUnepAreaDefinition(area: UnepSearchArea): UnepAreaDefinition {
  return UNEP_AREA_DEFINITIONS[area];
}

export function isUnepSearchArea(value: string): value is UnepSearchArea {
  return value in UNEP_AREA_DEFINITIONS;
}

export function getUnepAreaHref(area: UnepSearchArea): string {
  return `/prospects/recherche-unep/${area}`;
}

export const UNEP_CITY_CATALOG = UNEP_SEARCH_AREA_IDS.map((id) => ({
  id,
  ...getUnepAreaDefinition(id),
}));

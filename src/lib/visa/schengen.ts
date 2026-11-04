/**
 * Schengen members, static, as of 2026 (Bulgaria and Romania included).
 * One list for the visa chip, the home-card rule's country check, and the
 * entry-source filter. Microstates outside the area are not included.
 */

export const SCHENGEN_CODES: ReadonlySet<string> = new Set([
  "AT",
  "BE",
  "BG",
  "CH",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IS",
  "IT",
  "LI",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
]);

const NOT_COUNTRIES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"]);

/** Names DisplayNames does not return, folded. */
const ALIASES: Readonly<Record<string, string>> = {
  czechrepublic: "CZ",
  czechia: "CZ",
  tchequie: "CZ",
  holland: "NL",
  thenetherlands: "NL",
  hellas: "GR",
  greek: "GR",
  hellenicrepublic: "GR",
  uk: "GB",
  greatbritain: "GB",
  unitedkingdom: "GB",
  uae: "AE",
  usa: "US",
};

/**
 * Cities whose country must still resolve when the model puts the island
 * name in the country field, or leaves a country we cannot read.
 * Folded city → ISO code. Capitals and resorts absent from the hotel place list.
 */
const CITY_COUNTRY: Readonly<Record<string, string>> = {
  santorini: "GR",
  santorin: "GR",
  thira: "GR",
  fira: "GR",
  oia: "GR",
  mykonos: "GR",
  athens: "GR",
  athenes: "GR",
  rhodes: "GR",
  rodos: "GR",
  corfu: "GR",
  crete: "GR",
  heraklion: "GR",
  chania: "GR",
  thessaloniki: "GR",
  zakynthos: "GR",
  vienna: "AT",
  vienne: "AT",
  salzburg: "AT",
  sofia: "BG",
  zagreb: "HR",
  dubrovnik: "HR",
  split: "HR",
  prague: "CZ",
  praha: "CZ",
  copenhagen: "DK",
  tallinn: "EE",
  helsinki: "FI",
  berlin: "DE",
  munich: "DE",
  munchen: "DE",
  frankfurt: "DE",
  hamburg: "DE",
  budapest: "HU",
  reykjavik: "IS",
  venice: "IT",
  venise: "IT",
  florence: "IT",
  firenze: "IT",
  naples: "IT",
  riga: "LV",
  vilnius: "LT",
  luxembourg: "LU",
  valletta: "MT",
  oslo: "NO",
  warsaw: "PL",
  varsovie: "PL",
  krakow: "PL",
  cracow: "PL",
  bucharest: "RO",
  bratislava: "SK",
  ljubljana: "SI",
  stockholm: "SE",
  bern: "CH",
  geneva: "CH",
  geneve: "CH",
  zurich: "CH",
};

/** Airports missing from the hotel place list. Santorini is JTR. */
const IATA_COUNTRY: Readonly<Record<string, string>> = {
  JTR: "GR",
  ATH: "GR",
  JMK: "GR",
  RHO: "GR",
  CFU: "GR",
  HER: "GR",
  CHQ: "GR",
  SKG: "GR",
  ZTH: "GR",
  VIE: "AT",
  SZG: "AT",
  SOF: "BG",
  ZAG: "HR",
  DBV: "HR",
  SPU: "HR",
  PRG: "CZ",
  CPH: "DK",
  TLL: "EE",
  HEL: "FI",
  BER: "DE",
  MUC: "DE",
  FRA: "DE",
  HAM: "DE",
  BUD: "HU",
  KEF: "IS",
  VCE: "IT",
  FLR: "IT",
  NAP: "IT",
  RIX: "LV",
  VNO: "LT",
  LUX: "LU",
  MLA: "MT",
  OSL: "NO",
  WAW: "PL",
  KRK: "PL",
  OTP: "RO",
  BTS: "SK",
  LJU: "SI",
  ARN: "SE",
  BRN: "CH",
  GVA: "CH",
  ZRH: "CH",
};

export function foldPlace(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

let countryNames: Map<string, string> | null = null;

function namesByFold(): Map<string, string> {
  if (countryNames) return countryNames;
  const map = new Map<string, string>();
  const display = ["en", "fr"].map((locale) => new Intl.DisplayNames([locale], { type: "region" }));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      if (NOT_COUNTRIES.has(code)) continue;
      for (const d of display) {
        const name = d.of(code);
        if (!name || name === code) continue;
        const key = foldPlace(name);
        if (key.length > 3 && !map.has(key)) map.set(key, code);
      }
    }
  }
  for (const [alias, code] of Object.entries(ALIASES)) map.set(alias, code);
  countryNames = map;
  return map;
}

export function isSchengenCode(code: string | null | undefined): boolean {
  return !!code && SCHENGEN_CODES.has(code.toUpperCase());
}

/** English, French or Arabic name of an ISO country. */
export function countryName(code: string, locale: "en" | "fr" | "ar"): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function codeFromCountryName(country: string): string | null {
  const folded = foldPlace(country);
  if (!folded) return null;
  if (/^[a-z]{2}$/.test(folded)) {
    const code = folded.toUpperCase();
    if (SCHENGEN_CODES.has(code) || namesByFold().has(folded)) return code;
  }
  return namesByFold().get(folded) ?? null;
}

export type DestinationLike = { city: string; country: string; iata: string };

/**
 * ISO country of a destination the model just named.
 * The country string wins; the airport and a static city list fill the gaps.
 */
export function countryCodeOf(destination: DestinationLike | null): string | null {
  if (!destination) return null;
  const named = codeFromCountryName(destination.country);
  if (named) return named;
  const iata = destination.iata?.toUpperCase() ?? "";
  if (iata && IATA_COUNTRY[iata]) return IATA_COUNTRY[iata];
  const city = foldPlace(destination.city);
  if (city && CITY_COUNTRY[city]) return CITY_COUNTRY[city];
  const countryAsCity = foldPlace(destination.country);
  if (countryAsCity && CITY_COUNTRY[countryAsCity]) return CITY_COUNTRY[countryAsCity];
  return null;
}

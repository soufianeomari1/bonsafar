/**
 * City centres for the hotel radius search, which needs coordinates (the
 * trivago tool asks the caller to resolve them). Unknown cities fall back to
 * the trivago free-text search.
 */
export type Place = {
  city: string;
  country: string;
  /** ISO 3166-1 alpha-2. */
  country_code: string;
  lat: number;
  lng: number;
  /** City and airport codes that point to this city. */
  codes: string[];
};

export const PLACES: Place[] = [
  { city: "Istanbul", country: "Turkey", country_code: "TR", lat: 41.0082, lng: 28.9784, codes: ["IST", "SAW"] },
  { city: "Antalya", country: "Turkey", country_code: "TR", lat: 36.8969, lng: 30.7133, codes: ["AYT"] },
  { city: "Paris", country: "France", country_code: "FR", lat: 48.8566, lng: 2.3522, codes: ["PAR", "CDG", "ORY", "BVA"] },
  { city: "Marseille", country: "France", country_code: "FR", lat: 43.2965, lng: 5.3698, codes: ["MRS"] },
  { city: "Lyon", country: "France", country_code: "FR", lat: 45.764, lng: 4.8357, codes: ["LYS"] },
  { city: "Nice", country: "France", country_code: "FR", lat: 43.7102, lng: 7.262, codes: ["NCE"] },
  { city: "Madrid", country: "Spain", country_code: "ES", lat: 40.4168, lng: -3.7038, codes: ["MAD"] },
  { city: "Barcelona", country: "Spain", country_code: "ES", lat: 41.3874, lng: 2.1686, codes: ["BCN"] },
  { city: "Malaga", country: "Spain", country_code: "ES", lat: 36.7213, lng: -4.4214, codes: ["AGP"] },
  { city: "Seville", country: "Spain", country_code: "ES", lat: 37.3891, lng: -5.9845, codes: ["SVQ"] },
  { city: "Lisbon", country: "Portugal", country_code: "PT", lat: 38.7223, lng: -9.1393, codes: ["LIS"] },
  { city: "Rome", country: "Italy", country_code: "IT", lat: 41.9028, lng: 12.4964, codes: ["ROM", "FCO", "CIA"] },
  { city: "Milan", country: "Italy", country_code: "IT", lat: 45.4642, lng: 9.19, codes: ["MIL", "MXP", "LIN", "BGY"] },
  { city: "London", country: "United Kingdom", country_code: "GB", lat: 51.5072, lng: -0.1276, codes: ["LON", "LHR", "LGW", "STN", "LTN"] },
  { city: "Amsterdam", country: "Netherlands", country_code: "NL", lat: 52.3676, lng: 4.9041, codes: ["AMS"] },
  { city: "Brussels", country: "Belgium", country_code: "BE", lat: 50.8503, lng: 4.3517, codes: ["BRU", "CRL"] },
  { city: "Dubai", country: "United Arab Emirates", country_code: "AE", lat: 25.2048, lng: 55.2708, codes: ["DXB", "DWC"] },
  { city: "Doha", country: "Qatar", country_code: "QA", lat: 25.2854, lng: 51.531, codes: ["DOH"] },
  { city: "Cairo", country: "Egypt", country_code: "EG", lat: 30.0444, lng: 31.2357, codes: ["CAI"] },
  { city: "Tunis", country: "Tunisia", country_code: "TN", lat: 36.8065, lng: 10.1815, codes: ["TUN"] },
  { city: "Jeddah", country: "Saudi Arabia", country_code: "SA", lat: 21.4858, lng: 39.1925, codes: ["JED"] },
  { city: "Kuala Lumpur", country: "Malaysia", country_code: "MY", lat: 3.139, lng: 101.6869, codes: ["KUL"] },
  { city: "Bangkok", country: "Thailand", country_code: "TH", lat: 13.7563, lng: 100.5018, codes: ["BKK", "DMK"] },
  { city: "Dakar", country: "Senegal", country_code: "SN", lat: 14.7167, lng: -17.4677, codes: ["DSS"] },
  { city: "Marrakech", country: "Morocco", country_code: "MA", lat: 31.6295, lng: -7.9811, codes: ["RAK"] },
  { city: "Agadir", country: "Morocco", country_code: "MA", lat: 30.4278, lng: -9.5981, codes: ["AGA"] },
];

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export function findPlace(query: { iata?: string | null; city?: string | null }): Place | null {
  if (query.iata) {
    const code = query.iata.toUpperCase();
    const byCode = PLACES.find((place) => place.codes.includes(code));
    if (byCode) return byCode;
  }
  if (query.city) {
    const city = normalize(query.city);
    return PLACES.find((place) => normalize(place.city) === city) ?? null;
  }
  return null;
}

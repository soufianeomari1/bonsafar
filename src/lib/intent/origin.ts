import { PLACES, type Place } from "@/lib/mcp/places";

/** Codes that name a whole city in Kiwi.com, not one airport. */
const METRO = new Set(["PAR", "LON", "ROM", "MIL"]);

const AIRPORT_NAMES: [string, string][] = [
  ["charles de gaulle", "CDG"],
  ["roissy", "CDG"],
  ["orly", "ORY"],
  ["beauvais", "BVA"],
  ["heathrow", "LHR"],
  ["gatwick", "LGW"],
  ["stansted", "STN"],
  ["luton", "LTN"],
  ["charleroi", "CRL"],
  ["sabiha", "SAW"],
  ["ciampino", "CIA"],
  ["fiumicino", "FCO"],
  ["bergamo", "BGY"],
  ["malpensa", "MXP"],
  ["linate", "LIN"],
];

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function placeByCode(code: string): Place | null {
  const iata = code.toUpperCase();
  return PLACES.find((place) => place.codes.includes(iata)) ?? null;
}

function representative(place: Place): string {
  return place.codes.find((code) => !METRO.has(code)) ?? place.codes[0];
}

/** An airport the traveller actually named ("Orly", "CDG"), not the city around it. */
function namedAirport(text: string): string | null {
  const folded = fold(text);
  for (const [name, iata] of AIRPORT_NAMES) {
    if (folded.includes(name)) return iata;
  }
  for (const match of folded.matchAll(/\b([a-z]{3})\b/g)) {
    const code = match[1].toUpperCase();
    if (METRO.has(code)) continue;
    if (placeByCode(code)) return code;
  }
  return null;
}

function namedCity(text: string): Place | null {
  const folded = fold(text);
  let best: Place | null = null;
  let bestLength = 0;
  for (const place of PLACES) {
    const city = fold(place.city);
    if (city.length >= 3 && folded.includes(city) && city.length > bestLength) {
      best = place;
      bestLength = city.length;
    }
  }
  return best;
}

export type Departure = {
  /** IATA kept for the chip and the map. A city search still has one, for the name. */
  iata: string | null;
  /** English city name sent to Kiwi.com so every airport of that city is searched. */
  city: string | null;
};

/**
 * A named city searches every airport. A named airport stays that code.
 * Silence keeps the profile airport.
 */
export function resolveDeparture(input: {
  originIata: string | null;
  homeAirport: string | null;
  originKeywords: string[];
}): Departure {
  const words = input.originKeywords.join(" ").trim();
  if (!words) return { iata: input.originIata ?? input.homeAirport, city: null };

  const airport = namedAirport(words);
  if (airport) return { iata: airport, city: null };

  const city = namedCity(words);
  if (city) {
    const current = input.originIata ? placeByCode(input.originIata) : null;
    const iata = current?.city === city.city ? input.originIata : representative(city);
    return { iata, city: city.city };
  }

  return { iata: input.originIata ?? input.homeAirport, city: null };
}

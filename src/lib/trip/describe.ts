import { placeName } from "@/lib/airports";
import { formatDuration, formatTime } from "@/lib/format";
import type { Lang, TranslationKey, TranslateValues } from "@/lib/i18n";
import type { KiwiLeg } from "@/lib/mcp/kiwi";
import type { HotelOffer } from "@/lib/prices/store";

type T = (key: TranslationKey, values?: TranslateValues) => string;

export type LegStop = { iata: string; city: string; minutes: number | null };

/** Stopovers of a leg: Kiwi.com segments when the run has them, else the route codes. */
export function legStops(leg: KiwiLeg, lang: Lang): LegStop[] {
  if (leg.stopovers?.length) {
    return leg.stopovers.map((stop) => ({
      iata: stop.airport,
      city: placeName(stop.airport, lang, stop.city),
      minutes: stop.minutes,
    }));
  }
  return leg.route.slice(1, -1).map((iata) => ({ iata, city: placeName(iata, lang), minutes: null }));
}

/**
 * Airline names in flight order, each once: "Air Arabia Maroc, then AJet".
 * Each name is its own bidi isolate, so an Arabic sentence keeps its direction.
 */
export function legCarriers(leg: KiwiLeg, t: T): string {
  const names = (
    leg.segments?.length
      ? [...new Set(leg.segments.flatMap((s) => (s.carrier_name ? [s.carrier_name] : [])))]
      : leg.carriers
  ).map((name) => `\u2068${name}\u2069`);
  if (names.length === 0) return "";
  return names.slice(1).reduce((text, name) => t("package.then", { a: text, b: name }), names[0]);
}

/** "stop in Milan, 1 h 45", "2 stops: Milan, Tirana" or "direct flight". */
export function legStopsText(leg: KiwiLeg, lang: Lang, t: T): string {
  const stops = legStops(leg, lang);
  if (stops.length === 0) return leg.stops > 0 ? stopsCount(leg.stops, t) : t("package.directFlight");
  if (stops.length === 1) {
    const [stop] = stops;
    return stop.minutes != null
      ? t("package.stopAt", { city: stop.city, duration: formatDuration(stop.minutes, lang) })
      : t("package.stopAtNoTime", { city: stop.city });
  }
  return t("package.stopsIn", { count: stops.length, cities: stops.map((stop) => stop.city).join(", ") });
}

function stopsCount(count: number, t: T): string {
  return count === 1 ? t("package.pillStopsOne") : t("package.pillStops", { count });
}

/** Both halves of the plain flight sentence, for screens 06 to 10. */
export function legSentence(leg: KiwiLeg, lang: Lang, t: T): { carriers: string; detail: string } {
  return { carriers: legCarriers(leg, t), detail: legStopsText(leg, lang, t) };
}

export type MapStop = {
  iata: string;
  name: string;
  /** Small mono line: "CMN · 07:20" or "stop 1 h 45". */
  sub: string;
};

/** Origin, stopovers and arrival of the outbound leg, for RouteMap. */
export function mapStops(leg: KiwiLeg, lang: Lang, t: T): MapStop[] {
  const first = leg.segments?.[0];
  const last = leg.segments?.at(-1);
  const stops = legStops(leg, lang);
  return [
    {
      iata: leg.from,
      name: placeName(leg.from, lang, first?.from_city),
      sub: `${leg.from} · ${formatTime(leg.departure)}`,
    },
    ...stops.map((stop) => ({
      iata: stop.iata,
      name: stop.city,
      sub: stop.minutes != null ? t("package.mapStop", { duration: formatDuration(stop.minutes, lang) }) : stop.iata,
    })),
    {
      iata: leg.to,
      name: placeName(leg.to, lang, last?.to_city),
      sub: `${leg.to} · ${formatTime(leg.arrival)}`,
    },
  ];
}

/** "2 adults", "2 adults, 1 child". */
export function travellersText(passengers: { adults: number; children: number; infants: number }, t: T): string {
  const kids = passengers.children + passengers.infants;
  const adults = passengers.adults === 1 ? t("trip.adultsOne") : t("trip.adults", { count: passengers.adults });
  if (kids === 0) return adults;
  return `${adults}, ${kids === 1 ? t("trip.childrenOne") : t("trip.children", { count: kids })}`;
}

export function nightsText(nights: number, t: T): string {
  return nights === 1 ? t("trip.nightsOne") : t("trip.nights", { count: nights });
}

/** trivago's 0 to 10 score as a word. */
export function ratingWord(score: number, t: T): string {
  if (score >= 9) return t("rating.exceptional");
  if (score >= 8) return t("rating.veryGood");
  if (score >= 7) return t("rating.good");
  return t("rating.fair");
}

export type AmenityId =
  | "breakfast"
  | "rooms"
  | "wifi"
  | "aircon"
  | "parking"
  | "pool"
  | "spa"
  | "gym"
  | "restaurant"
  | "freeCancel";

/** trivago amenity labels come in the search language: matched by meaning, shown from our dictionaries. */
const AMENITY_MATCH: [AmenityId, RegExp][] = [
  ["wifi", /wi-?fi|internet|واي|إنترنت/i],
  ["aircon", /clim|air.?cond|تكييف/i],
  ["pool", /piscine|pool|مسبح/i],
  ["spa", /spa|سبا/i],
  ["gym", /fitness|gym|sport|رياض/i],
  ["parking", /parking|stationnement|موقف/i],
  ["restaurant", /restaurant|مطعم/i],
];

/** Four amenities for the hotel card: breakfast and rooms first, then trivago's top ones. */
export function hotelAmenities(hotel: HotelOffer): { id: AmenityId; count?: number }[] {
  const list: { id: AmenityId; count?: number }[] = [];
  if (hotel.attrs.breakfast) list.push({ id: "breakfast" });
  list.push({ id: "rooms", count: hotel.attrs.rooms });
  for (const label of hotel.attrs.amenities) {
    const match = AMENITY_MATCH.find(([, pattern]) => pattern.test(label));
    if (match && !list.some((item) => item.id === match[0])) list.push({ id: match[0] });
  }
  if (hotel.attrs.free_cancellation && !hotel.attrs.non_refundable) list.push({ id: "freeCancel" });
  return list.slice(0, 4);
}

/**
 * trivago writes the distance in the search language ("0.4 km to City centre",
 * "à 0,2 km de : Tour de Galata"). Only the kilometres are kept, and the
 * sentence is ours, so the line stays in the interface language.
 */
export function distanceText(distance: string | null | undefined, lang: Lang, t: T): string | null {
  if (!distance) return null;
  const match = /(\d+(?:[.,]\d+)?)\s*km/i.exec(distance);
  if (!match) return null;
  const km = Number(match[1].replace(",", "."));
  if (!Number.isFinite(km)) return null;
  const value = new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-FR", {
    maximumFractionDigits: 1,
    numberingSystem: "latn",
  }).format(km);
  const centre = /cent(re|er|ro)|downtown|مركز|وسط/i.test(distance);
  return centre ? t("package.kmFromCentre", { km: value }) : t("package.kmAway", { km: value });
}

/** trivago thumbnails are 400 px wide; the card is full width on a 3x screen. */
export function hotelPhoto(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/h_267,q_40,w_400/, "h_534,q_70,w_800");
}

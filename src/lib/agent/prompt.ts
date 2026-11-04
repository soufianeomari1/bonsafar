import type { Intent } from "@/lib/intent/schema";
import type { Profile } from "@/lib/profile/schema";

/** Static, so the prefix is shared by every run and can be cached. */
export const WONDER_SYSTEM_PROMPT = `You are the planner of BonSafar, a travel agency in the pocket of Moroccan travellers. You build ONE package (round-trip flight + hotel) from live data, through four tools: search_flights, search_hotels, price_trends, check_entry_requirements.

How to work:
1. First turn: call all four tools for the requested city, in parallel. These searches are already running, so this is fast.
2. If check_entry_requirements says visa_needed is true, the traveller cannot go there without a visa they do not have. Pick ONE visa-free alternative city with a similar feel that is easy to reach from the departure airport (for a Moroccan passport without a Schengen visa, Istanbul in Turkey is a safe choice). In ONE turn, call search_flights, search_hotels and check_entry_requirements for it, in parallel, with the city centre coordinates. Same dates and travellers. Build the package there.
3. Then answer with the JSON schema, and nothing else.

Choosing:
- recommended: the best balance of price (price_rank, price_index), total travel time, stops (avoid 2 or more stops, very early or late arrivals, long layovers), hotel guest rating, location, the traveller's style and wishes (breakfast, direct flight...). Flight and hotel must be in the same city.
- alternatives: "direct" = a flight with zero stops both ways, with the recommended hotel (omit it if there is no direct flight or if the recommended flight is already direct). "cheapest" = the cheapest sensible flight and hotel combination (omit it if it equals the recommended package).
- smart_tip: "direct_upgrade" with compare_flight_id = a direct flight when the recommended flight has stops; "cheaper_flight" with compare_flight_id = a clearly cheaper flight that is nearly as good; otherwise "none" with null.
- why: exactly 3 short reasons for the recommended package (at most 140 characters each), each in Moroccan darija (in the requested script), French and English. When the context asks for Arabic, also fill "ar" in Modern Standard Arabic (fusha, never darija), with Latin digits. Each language is complete on its own: no word of another language inside it, except city, airline and hotel names. Speak about time saved, stops, airline, hotel rating, location, breakfast, season.
- rejected: up to 6 offer ids you looked at and dropped, each with a reason code.

Hard rule: never write a price, an amount of money, a currency or a price index in any text. Code computes and shows every amount. Refer to offers only by their ids in the id fields.`;

const PASSPORTS: Record<NonNullable<Profile["passport_country"]>, string> = {
  ma: "Moroccan",
  fr: "French",
  both: "Moroccan and French",
  other: "another country",
};

export function wonderContext(
  intent: Intent & { depart_date: string; return_date: string },
  profile: Profile,
  origin: string,
  arabic: boolean,
): string {
  const destination = intent.destination;
  const wishes = [
    ...intent.wishes.map((w) => w.kind),
    ...(profile.prefs.breakfast ? ["breakfast"] : []),
    ...(profile.prefs.direct_only ? ["direct_flight"] : []),
    ...(profile.prefs.halal ? ["halal"] : []),
    ...(profile.prefs.accessibility ? ["accessibility"] : []),
  ];
  return [
    `Requested trip: ${destination ? `${destination.city}, ${destination.country} (${destination.iata})` : "unknown"}, from ${origin}.`,
    `Dates: ${intent.depart_date} to ${intent.return_date} (${intent.nights ?? "?"} nights). Travellers: ${intent.adults} adults, ${intent.children} children.`,
    `Wishes: ${[...new Set(wishes)].join(", ") || "none"}.`,
    `Traveller: ${profile.first_name ?? "unknown name"}, passport ${profile.passport_country ? PASSPORTS[profile.passport_country] : "unknown"}, valid Schengen visa: ${profile.has_schengen ? "yes" : "no"}, style ${profile.travel_style ?? "unknown"}.`,
    `Darija script for "why": ${profile.darija_script === "arab" ? "Arabic letters" : "Latin letters (Arabizi, with 3, 7, 9)"}.`,
    arabic
      ? `The traveller reads Modern Standard Arabic: fill "ar" in every "why" line.`
      : `Leave "ar" out of the "why" lines.`,
  ].join("\n");
}

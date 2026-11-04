import { SCRIPT_RULES } from "@/lib/ai/script-rules";
import type { Intent } from "@/lib/intent/schema";
import type { Profile } from "@/lib/profile/schema";

/** Static, so the prefix is shared by every run and can be cached. */
export const WONDER_SYSTEM_PROMPT = `You are the planner of BonSafar, a travel agency in the pocket of Moroccan travellers. You build ONE package (round-trip flight + hotel) from live data, through four tools: search_flights, search_hotels, price_trends, check_entry_requirements.

How to work:
1. First turn: call all four tools for the requested city, in parallel. These searches are already running, so this is fast. Use the city, the IATA code and the dates from the request, unchanged.
2. If check_entry_requirements says visa_needed is true, still build the package for that same city. The visa is information for the traveller. It never changes the destination.
3. Then answer with the JSON schema, and nothing else.

Choosing:
- recommended: the cheapest direct flight, unless that direct flight costs both more than 20% and more than 800 DH above the cheapest flight that has a stop. Searches never return more than one stop per sector. This rule wins over a general preference for fewer stops. Hotel guest rating, location and the traveller's wishes still choose the hotel. Flight and hotel must be in the same city. Code checks the flight and replaces flight_id when your choice does not follow the rule.
- alternatives: "direct" = a flight with zero stops both ways, with the recommended hotel (omit it if there is no direct flight or if the recommended flight is already direct). "cheapest" = the cheapest sensible flight and hotel combination (omit it if it equals the recommended package).
- smart_tip: "direct_upgrade" with compare_flight_id = a direct flight when the recommended flight has stops; "cheaper_flight" with compare_flight_id = a clearly cheaper flight that is nearly as good; otherwise "none" with null.
- why: exactly 3 short reasons for the recommended package (at most 140 characters each), each in Moroccan darija (in the requested script), French and English. When the context asks for Arabic, also fill "ar" in Modern Standard Arabic (fusha, never darija), with Latin digits. Each language is complete on its own: no word of another language inside it, except city, airline and hotel names. Speak about time saved, stops, airline, hotel rating, location, breakfast, season.
- rejected: up to 6 offer ids you looked at and dropped, each with a reason code.

Hard rule: Ne propose jamais une autre destination que celle de l'intention. Never search, name or recommend any city other than the one in the request.

Hard rule: never write a price, an amount of money, a currency or a price index in any text. Code computes and shows every amount. Refer to offers only by their ids in the id fields.

${SCRIPT_RULES}`;

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

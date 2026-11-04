import type { FlightOffer } from "@/lib/prices/store";
import { totalStops } from "@/lib/prices/totals";
import { DIRECT_MAX_EXTRA_MAD, DIRECT_MAX_EXTRA_RATIO } from "./config";

export type FlightRuleDecision = {
  flightId: string;
  /** True when Wonder's id is not the flight this rule recommends. */
  changed: boolean;
  note: string;
};

function cheapest(flights: FlightOffer[]): FlightOffer | null {
  let best: FlightOffer | null = null;
  for (const flight of flights) {
    if (!best || flight.price_mad < best.price_mad) best = flight;
  }
  return best;
}

/**
 * Recommend the cheapest direct flight unless it costs both more than
 * DIRECT_MAX_EXTRA_RATIO and more than DIRECT_MAX_EXTRA_MAD above the
 * cheapest flight that has a stop. Searches already cap each sector at one stop.
 */
export function applyFlightRule(chosenId: string, flights: FlightOffer[]): FlightRuleDecision {
  const chosen = flights.find((flight) => flight.id === chosenId) ?? null;
  if (!chosen) return { flightId: chosenId, changed: false, note: "chosen flight is not in the set" };

  const direct = cheapest(flights.filter((flight) => totalStops(flight) === 0));
  const oneStop = cheapest(flights.filter((flight) => totalStops(flight) > 0));

  let pick = chosen;
  let note = "kept: the choice already follows the direct-flight rule";
  if (direct && oneStop) {
    const extra = direct.price_mad - oneStop.price_mad;
    const tooDear = extra > DIRECT_MAX_EXTRA_MAD && extra / oneStop.price_mad > DIRECT_MAX_EXTRA_RATIO;
    pick = tooDear ? oneStop : direct;
    note = tooDear
      ? `replaced ${chosenId} with ${pick.id}: the direct flight exceeds both thresholds`
      : `replaced ${chosenId} with ${pick.id}: the direct flight stays inside a threshold`;
  } else if (direct) {
    pick = direct;
    note = `replaced ${chosenId} with ${pick.id}: no one-stop flight, so the cheapest direct`;
  } else if (oneStop) {
    pick = oneStop;
    note = `replaced ${chosenId} with ${pick.id}: no direct flight, so the cheapest one-stop`;
  }

  const sameClass =
    (direct && pick.id === direct.id && totalStops(chosen) === 0 && chosen.price_mad === direct.price_mad) ||
    (oneStop && pick.id === oneStop.id && totalStops(chosen) > 0 && chosen.price_mad === oneStop.price_mad);
  if (pick.id === chosenId || sameClass) {
    return { flightId: chosenId, changed: false, note: "kept: the choice already follows the direct-flight rule" };
  }
  return { flightId: pick.id, changed: true, note };
}

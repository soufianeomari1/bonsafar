"use client";

import type { AgentRunSnapshot } from "@/lib/agent-client/store";
import { airportCity } from "@/lib/airports";
import { buildChecklist, okCount } from "./checklist";
import type { FrozenTrip } from "./saved";
import { asFlight, asHotel, pickOption } from "./selection";
import { readTrip } from "./store";

/** The chosen package of the current run, frozen with its prices, ready to save. */
export function freezeRun(
  run: AgentRunSnapshot,
  dotationMad: number,
  posterUrl: string | null,
): Omit<FrozenTrip, "id" | "created_at" | "synced_id"> | null {
  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;
  if (!result || !option || !flight || !hotel || !run.run) return null;
  const tiles = buildChecklist({
    entry: result.entry,
    baggage: flight.attrs.baggage,
    perPersonDisplayMad: option.totals.per_person_display_mad,
    dotationMad,
  });
  const request = run.request;
  return {
    run_id: run.run.run_id,
    transcript: readTrip()?.transcript ?? null,
    intent: request && "intent" in request ? request.intent : null,
    status: "ready",
    poster_url: posterUrl,
    package: {
      destination: result.destination,
      origin_iata: flight.attrs.outbound.from,
      origin_city: airportCity(flight.attrs.outbound.from) ?? flight.attrs.outbound.from,
      flight,
      hotel,
      totals: option.totals,
      fx: result.fx,
      prices_captured_at: result.prices_captured_at,
      entry: result.entry,
      ready_ok: okCount(tiles),
    },
  };
}

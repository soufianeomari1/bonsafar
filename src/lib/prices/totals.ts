import { round2, type FxRate } from "./money";
import type { FlightOffer, HotelOffer, PriceStore } from "./store";

/**
 * Totals and differences, computed by code from stored offers only. Kiwi.com
 * prices already cover every passenger of the search (checked on 2026-11-03:
 * 1 adult 333 EUR, 2 adults 667 EUR for the same itinerary), so the flight
 * amount is taken as is, with the passenger count Kiwi.com returned.
 */

export type PackageTotals = {
  flight_id: string;
  hotel_id: string;
  flight: { price: number; currency: string; price_mad: number };
  hotel: { price: number; currency: string; price_mad: number; nights: number };
  total_mad: number;
  passengers: number;
  per_person_mad: number;
  fx: FxRate | null;
  sources: { flight: string; hotel: string };
  fetched_at: { flight: string; hotel: string };
};

export class TotalsError extends Error {}

function requireFlight(store: PriceStore, id: string): FlightOffer {
  const offer = store.flight(id);
  if (!offer) throw new TotalsError(`Unknown flight offer ${id}.`);
  return offer;
}

function requireHotel(store: PriceStore, id: string): HotelOffer {
  const offer = store.hotel(id);
  if (!offer) throw new TotalsError(`Unknown hotel offer ${id}.`);
  return offer;
}

export function passengerCount(flight: FlightOffer): number {
  const p = flight.attrs.passengers;
  return p.adults + p.children + p.infants;
}

export function packageTotals(store: PriceStore, flightId: string, hotelId: string): PackageTotals {
  const flight = requireFlight(store, flightId);
  const hotel = requireHotel(store, hotelId);
  const total = round2(flight.price_mad + hotel.price_mad);
  const passengers = Math.max(1, passengerCount(flight));
  return {
    flight_id: flight.id,
    hotel_id: hotel.id,
    flight: { price: flight.price, currency: flight.currency, price_mad: flight.price_mad },
    hotel: {
      price: hotel.price,
      currency: hotel.currency,
      price_mad: hotel.price_mad,
      nights: hotel.attrs.nights,
    },
    total_mad: total,
    passengers,
    per_person_mad: round2(total / passengers),
    fx: flight.fx ?? hotel.fx,
    sources: { flight: flight.source, hotel: hotel.source },
    fetched_at: { flight: flight.fetched_at, hotel: hotel.fetched_at },
  };
}

export type FlightDelta = {
  base_id: string;
  compare_id: string;
  /** compare minus base, in the provider currency when both share it. */
  extra: { amount: number; currency: string } | null;
  extra_mad: number;
  /** base minus compare: positive when the compared flight is faster. */
  saved_s: { outbound: number; inbound: number; total: number };
  stops_saved: number;
  fx: FxRate | null;
};

function legStops(flight: FlightOffer): number {
  return flight.attrs.outbound.stops + (flight.attrs.inbound?.stops ?? 0);
}

/** E.g. the smart tip: what the direct flight costs more and how much time it saves. */
export function flightDelta(store: PriceStore, baseId: string, compareId: string): FlightDelta {
  const base = requireFlight(store, baseId);
  const compare = requireFlight(store, compareId);
  const outbound = base.attrs.outbound.duration_s - compare.attrs.outbound.duration_s;
  const inbound = (base.attrs.inbound?.duration_s ?? 0) - (compare.attrs.inbound?.duration_s ?? 0);
  return {
    base_id: base.id,
    compare_id: compare.id,
    extra:
      base.currency === compare.currency
        ? { amount: round2(compare.price - base.price), currency: base.currency }
        : null,
    extra_mad: round2(compare.price_mad - base.price_mad),
    saved_s: { outbound, inbound, total: outbound + inbound },
    stops_saved: legStops(base) - legStops(compare),
    fx: compare.fx ?? base.fx,
  };
}

export function totalStops(flight: FlightOffer): number {
  return legStops(flight);
}

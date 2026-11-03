import { round2, type FxRate } from "./money";
import type { FlightOffer, HotelOffer, PriceStore } from "./store";

/**
 * Totals and differences, computed by code from stored offers only. Kiwi.com
 * prices already cover every passenger of the search (checked on 2026-11-03:
 * 1 adult 333 EUR, 2 adults 667 EUR for the same itinerary), so the flight
 * amount is taken as is, with the passenger count Kiwi.com returned.
 */

export type PriceLine = {
  price: number;
  currency: string;
  /** To the centime, for the detail view. */
  price_mad: number;
  /** Whole dirhams shown on the line. */
  price_mad_display: number;
};

export type PackageTotals = {
  flight_id: string;
  hotel_id: string;
  flight: PriceLine;
  hotel: PriceLine & { nights: number };
  /** Exact sum to the centime, for the detail view. */
  total_mad: number;
  /** flight.price_mad_display + hotel.price_mad_display: the total shown. */
  total_display_mad: number;
  passengers: number;
  per_person_mad: number;
  /** total_display_mad / passengers, rounded to the dirham. */
  per_person_display_mad: number;
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

function priceLine(offer: FlightOffer | HotelOffer): PriceLine {
  return {
    price: offer.price,
    currency: offer.currency,
    price_mad: offer.price_mad,
    price_mad_display: offer.price_mad_display,
  };
}

export function packageTotals(store: PriceStore, flightId: string, hotelId: string): PackageTotals {
  const flight = requireFlight(store, flightId);
  const hotel = requireHotel(store, hotelId);
  const total = round2(flight.price_mad + hotel.price_mad);
  const totalDisplay = flight.price_mad_display + hotel.price_mad_display;
  const passengers = Math.max(1, passengerCount(flight));
  return {
    flight_id: flight.id,
    hotel_id: hotel.id,
    flight: priceLine(flight),
    hotel: { ...priceLine(hotel), nights: hotel.attrs.nights },
    total_mad: total,
    total_display_mad: totalDisplay,
    passengers,
    per_person_mad: round2(total / passengers),
    per_person_display_mad: Math.round(totalDisplay / passengers),
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
  /** compare minus base in dirhams, to the centime (detail view). */
  extra_mad: number;
  /** compare minus base of the displayed line amounts, in whole dirhams. */
  extra_display_mad: number;
  /** Whole minutes, base minus compare: positive when the compared flight is faster. */
  saved_minutes: number;
  saved_minutes_by_leg: { outbound: number; inbound: number };
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
  const outbound = base.attrs.outbound.duration_min - compare.attrs.outbound.duration_min;
  const inbound = (base.attrs.inbound?.duration_min ?? 0) - (compare.attrs.inbound?.duration_min ?? 0);
  return {
    base_id: base.id,
    compare_id: compare.id,
    extra:
      base.currency === compare.currency
        ? { amount: round2(compare.price - base.price), currency: base.currency }
        : null,
    extra_mad: round2(compare.price_mad - base.price_mad),
    extra_display_mad: compare.price_mad_display - base.price_mad_display,
    saved_minutes: outbound + inbound,
    saved_minutes_by_leg: { outbound, inbound },
    stops_saved: legStops(base) - legStops(compare),
    fx: compare.fx ?? base.fx,
  };
}

export function totalStops(flight: FlightOffer): number {
  return legStops(flight);
}

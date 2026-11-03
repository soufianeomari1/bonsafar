import type { KiwiLeg, KiwiSearch } from "@/lib/mcp/kiwi";
import type { PriceTrends, TrivagoHotel } from "@/lib/mcp/trivago";
import { toDisplayMad, toMad, type FxRate } from "./money";

/**
 * The server-side price store. Every amount shown to anyone comes from here,
 * with its source and fetch time; models only ever see offer ids, ranks and
 * relative indexes. Plain JSON, so a run can be saved and replayed.
 */

export type OfferSource = "kiwi.com" | "trivago";

type OfferBase = {
  /** F1..Fn, H1..Hn, T1..Tn, unique within a run. */
  id: string;
  /** Amount as returned by the provider, in `currency`. */
  price: number;
  currency: string;
  /** Same amount in dirhams, converted by code, to the centime (detail view). */
  price_mad: number;
  /** Whole dirhams, rounded to the nearest: the amount shown on a price line. */
  price_mad_display: number;
  /** The rate used when `currency` is not MAD. */
  fx: FxRate | null;
  source: OfferSource;
  fetched_at: string;
  deeplink: string | null;
  /** City the search was for, as BonSafar asked it. */
  destination: string;
};

export type FlightAttrs = {
  outbound: KiwiLeg;
  inbound: KiwiLeg | null;
  /** Whole minutes, outbound plus inbound. */
  total_duration_min: number;
  baggage: { personal_item: number; cabin_bag: number; checked_bag: number };
  /** Passengers the price covers, as returned by Kiwi.com. */
  passengers: { adults: number; children: number; infants: number };
  query: string;
};

export type HotelAttrs = {
  name: string;
  stars: number | null;
  review_rating: number | null;
  review_count: number | null;
  amenities: string[];
  distance: string | null;
  advertiser: string | null;
  breakfast: boolean;
  free_cancellation: boolean;
  non_refundable: boolean;
  arrival: string;
  departure: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;
  /** Per-night amount from the same deal, in the offer currency. */
  price_per_night: number | null;
};

export type TrendAttrs = {
  month: string;
  star_rating: number;
  minimum: number | null;
  maximum: number | null;
  /** Trend amounts are forecast nightly rates. */
  per: "night";
};

export type FlightOffer = OfferBase & { kind: "flight"; attrs: FlightAttrs };
export type HotelOffer = OfferBase & { kind: "hotel"; attrs: HotelAttrs };
export type TrendOffer = OfferBase & { kind: "trend"; attrs: TrendAttrs };
export type Offer = FlightOffer | HotelOffer | TrendOffer;
export type OfferKind = Offer["kind"];

const PREFIX: Record<OfferKind, string> = { flight: "F", hotel: "H", trend: "T" };

function nightsBetween(arrival: string, departure: string): number {
  return Math.round(
    (Date.parse(`${departure}T12:00:00Z`) - Date.parse(`${arrival}T12:00:00Z`)) / 86_400_000,
  );
}

export class PriceStore {
  private readonly offers = new Map<string, Offer>();
  private readonly counters: Record<OfferKind, number> = { flight: 0, hotel: 0, trend: 0 };

  constructor(readonly fx: FxRate) {}

  private nextId(kind: OfferKind): string {
    this.counters[kind] += 1;
    return `${PREFIX[kind]}${this.counters[kind]}`;
  }

  private convert(
    amount: number,
    currency: string,
  ): { price_mad: number; price_mad_display: number; fx: FxRate | null } {
    const mad = toMad(amount, currency, this.fx);
    const display = toDisplayMad(amount, currency, this.fx);
    if (mad == null || display == null) throw new Error(`No conversion from ${currency} to MAD.`);
    return { price_mad: mad, price_mad_display: display, fx: currency === "MAD" ? null : this.fx };
  }

  addFlights(search: KiwiSearch, destination: string, fetchedAt: string): FlightOffer[] {
    return search.itineraries.map((it) => {
      const offer: FlightOffer = {
        id: this.nextId("flight"),
        kind: "flight",
        price: it.price,
        currency: search.currency,
        ...this.convert(it.price, search.currency),
        source: "kiwi.com",
        fetched_at: fetchedAt,
        deeplink: it.booking_url,
        destination,
        attrs: {
          outbound: it.outbound,
          inbound: it.inbound,
          total_duration_min: it.total_duration_min,
          baggage: it.baggage,
          passengers: search.passengers,
          query: search.query,
        },
      };
      this.offers.set(offer.id, offer);
      return offer;
    });
  }

  addHotels(
    hotels: TrivagoHotel[],
    stay: { destination: string; arrival: string; departure: string; adults: number; children: number },
    fetchedAt: string,
  ): HotelOffer[] {
    return hotels.map((hotel) => {
      const attributes = new Set(hotel.deal.attributes);
      const offer: HotelOffer = {
        id: this.nextId("hotel"),
        kind: "hotel",
        price: hotel.deal.price_per_stay,
        currency: hotel.deal.currency,
        ...this.convert(hotel.deal.price_per_stay, hotel.deal.currency),
        source: "trivago",
        fetched_at: fetchedAt,
        deeplink: hotel.deal.url,
        destination: stay.destination,
        attrs: {
          name: hotel.name,
          stars: hotel.stars,
          review_rating: hotel.review_rating,
          review_count: hotel.review_count,
          amenities: hotel.amenities,
          distance: hotel.distance,
          advertiser: hotel.deal.advertiser,
          breakfast: ["breakfastIncluded", "halfBoard", "fullBoard", "allInclusive"].some((id) =>
            attributes.has(id),
          ),
          free_cancellation: attributes.has("freeCancellation"),
          non_refundable: attributes.has("nonRefundable"),
          arrival: stay.arrival,
          departure: stay.departure,
          nights: nightsBetween(stay.arrival, stay.departure),
          adults: stay.adults,
          children: stay.children,
          rooms: Math.max(1, Math.ceil(stay.adults / 2)),
          price_per_night: hotel.deal.price_per_night,
        },
      };
      this.offers.set(offer.id, offer);
      return offer;
    });
  }

  addTrends(trends: PriceTrends, destination: string, fetchedAt: string): TrendOffer[] {
    return trends.months.map((month) => {
      const offer: TrendOffer = {
        id: this.nextId("trend"),
        kind: "trend",
        price: month.average,
        currency: trends.currency,
        ...this.convert(month.average, trends.currency),
        source: "trivago",
        fetched_at: fetchedAt,
        deeplink: null,
        destination,
        attrs: {
          month: month.month,
          star_rating: month.star_rating,
          minimum: month.minimum,
          maximum: month.maximum,
          per: "night",
        },
      };
      this.offers.set(offer.id, offer);
      return offer;
    });
  }

  get(id: string): Offer | undefined {
    return this.offers.get(id);
  }

  flight(id: string): FlightOffer | undefined {
    const offer = this.offers.get(id);
    return offer?.kind === "flight" ? offer : undefined;
  }

  hotel(id: string): HotelOffer | undefined {
    const offer = this.offers.get(id);
    return offer?.kind === "hotel" ? offer : undefined;
  }

  list(): Offer[] {
    return [...this.offers.values()];
  }

  /** Time of the latest price fetch in this run. */
  capturedAt(): string | null {
    let latest: string | null = null;
    for (const offer of this.offers.values()) {
      if (!latest || offer.fetched_at > latest) latest = offer.fetched_at;
    }
    return latest;
  }
}

/**
 * What a model may see of a group of offers: rank by price (1 = cheapest) and
 * a relative index (cheapest = 100). Never an amount.
 */
export function priceRanks(offers: Offer[]): Map<string, { price_rank: number; price_index: number }> {
  const sorted = [...offers].sort((a, b) => a.price_mad - b.price_mad);
  const min = sorted[0]?.price_mad ?? 0;
  return new Map(
    sorted.map((offer, index) => [
      offer.id,
      {
        price_rank: index + 1,
        price_index: min > 0 ? Math.round((offer.price_mad / min) * 100) : 100,
      },
    ]),
  );
}

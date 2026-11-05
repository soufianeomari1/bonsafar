import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { RunLog } from "@/lib/ai/events";
import type { Lang } from "@/lib/i18n";
import type { Intent } from "@/lib/intent/schema";
import { mergeFlightSearches, searchFlights, type FlightSearchParams, type KiwiSearch } from "@/lib/mcp/kiwi";
import { findPlace } from "@/lib/mcp/places";
import { priceTrends, searchHotels, type HotelStars } from "@/lib/mcp/trivago";
import type { Profile } from "@/lib/profile/schema";
import {
  priceRanks,
  type FlightOffer,
  type HotelOffer,
  type Offer,
  type PriceStore,
  type TrendOffer,
} from "@/lib/prices/store";
import { totalStops } from "@/lib/prices/totals";
import { checkEntryRequirements } from "./entry";
import { isHomeCountry } from "./homecoming";
import { AgentError, wantsArabic, type AgentStep, type AgentStreamEvent, type EntryRequirements, type StepPhase } from "./schema";

/**
 * Data tools for Muse Wonder. Searches for the requested city start as soon
 * as the intent arrives; when Wonder asks for the same search, the tool waits
 * for that promise instead of calling the provider twice. Tool results carry
 * offer ids, attributes, price ranks and relative indexes, never an amount.
 */

export const WONDER_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_flights",
      description:
        "Live round-trip flights from Kiwi.com from the traveller's departure airport to a city, for the trip dates and travellers. Returns offer ids (F1...) with times, stops, route, airlines, baggage, price_rank (1 = cheapest) and price_index (cheapest = 100). An offer with protection \"reduced\" is a last resort (separate tickets, an airport change or an overnight stop may apply): choose it only when no protected flight exists.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "The requested destination city, in English." },
          country: { type: "string", description: "Destination country in English." },
          iata: { type: "string", description: "Main airport or city IATA code." },
        },
        required: ["city", "country", "iata"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_hotels",
      description:
        "Live hotels from trivago around the city centre for the trip dates and travellers, filtered by the traveller's style. Returns offer ids (H1...) with name, stars, guest rating, distance, breakfast, cancellation, price_rank and price_index.",
      parameters: {
        type: "object",
        properties: {
          city: { type: "string" },
          country: { type: "string" },
          latitude: { type: "number", description: "City centre latitude." },
          longitude: { type: "number", description: "City centre longitude." },
        },
        required: ["city", "country", "latitude", "longitude"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "price_trends",
      description:
        "trivago forecast of hotel prices by month around the trip month, for the traveller's hotel style. Returns months with price_index (cheapest month = 100).",
      parameters: {
        type: "object",
        properties: { city: { type: "string" }, country: { type: "string" } },
        required: ["city", "country"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_entry_requirements",
      description:
        "Visa and passport rules for the traveller's passport and visa situation, checked live on official sources. Returns visa_needed, visa_kind, max_stay_days, passport_validity_days and the sources.",
      parameters: {
        type: "object",
        properties: {
          country: { type: "string", description: "Destination country in English." },
          country_code: { type: "string", description: "ISO 3166-1 alpha-2 code, e.g. TR." },
          city: { type: "string" },
        },
        required: ["country", "country_code"],
        additionalProperties: false,
      },
    },
  },
];

type Emit = (event: AgentStreamEvent) => void;

export type HotelsResult = { offers: HotelOffer[]; relaxed: boolean };

const STARS: Record<NonNullable<Profile["travel_style"]>, HotelStars> = {
  budget: 3,
  comfort: 4,
  premium: 5,
};

const key = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

function monthOf(iso: string, offset = 0): string {
  const date = new Date(`${iso.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function clock(iso: string): string {
  return iso.slice(11, 16);
}

function errorCode(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 160);
}

export class AgentContext {
  private readonly flights = new Map<string, Promise<FlightOffer[]>>();
  private readonly hotels = new Map<string, Promise<HotelsResult>>();
  private readonly trends = new Map<string, Promise<TrendOffer[]>>();
  private readonly entries = new Map<string, Promise<EntryRequirements>>();
  /** Settled entry checks, by country key, for code-side validation. */
  readonly entryResults = new Map<string, EntryRequirements>();
  readonly destinationCountry = new Map<string, string>();
  /** Destinations searched, by city key, with the IATA code when known. */
  readonly destinations = new Map<string, { city: string; country: string; iata: string }>();
  /** V5 offers: separate tickets, airport changes or overnight stops may apply. */
  private readonly reducedProtection = new Set<string>();
  private readonly started: Promise<unknown>[] = [];

  /** Waits for every search started in this run, failed ones included. */
  async settle(): Promise<void> {
    await Promise.allSettled(this.started);
  }

  private track<T>(promise: Promise<T>): Promise<T> {
    this.started.push(promise.catch(() => {}));
    return promise;
  }

  constructor(
    readonly intent: Intent & { depart_date: string; return_date: string },
    readonly profile: Profile,
    readonly lang: Lang,
    readonly jury: boolean,
    readonly origin: string,
    readonly store: PriceStore,
    readonly log: RunLog,
    private readonly emit: Emit,
  ) {}

  private step(step: AgentStep, phase: StepPhase, destination: string, data?: unknown) {
    this.emit({ type: "step", step, phase, destination, data });
  }

  private publish(offers: Offer[]) {
    if (offers.length) this.emit({ type: "offers", offers });
  }

  get stars(): HotelStars {
    return this.profile.travel_style ? STARS[this.profile.travel_style] : 4;
  }

  get wantsBreakfast(): boolean {
    return this.profile.prefs.breakfast || this.intent.wishes.some((w) => w.kind === "breakfast");
  }

  hasFlights(city: string): boolean {
    return this.flights.has(key(city));
  }

  flightsFor(city: string, country: string, iata?: string): Promise<FlightOffer[]> {
    const k = key(city);
    const existing = this.flights.get(k);
    if (existing) return existing;
    this.destinationCountry.set(k, country);
    const code = (iata || findPlace({ city })?.codes[0] || "").toUpperCase();
    this.destinations.set(k, { city, country, iata: /^[A-Z]{3}$/.test(code) ? code : "" });

    const promise = (async () => {
      this.step("flights", "start", city);
      try {
        const locale = this.jury || this.lang === "en" ? "en" : "fr";
        const base: FlightSearchParams = {
          from: this.origin,
          to: city,
          depart_date: this.intent.depart_date,
          return_date: this.intent.return_date,
          adults: this.intent.adults,
          children: this.intent.children,
          locale,
        };
        const variants: { label: string; max_sector_stopovers: number; sort: "price" | "quality" }[] = [
          { label: "V1 direct, price", max_sector_stopovers: 0, sort: "price" },
          { label: "V2 one stop, quality", max_sector_stopovers: 1, sort: "quality" },
          { label: "V3 one stop, price", max_sector_stopovers: 1, sort: "price" },
        ];
        const runSearch = async (label: string, params: FlightSearchParams): Promise<KiwiSearch | null> => {
          try {
            return await searchFlights(params, this.log);
          } catch (error) {
            this.log.add({
              step: "flights",
              model: "code",
              latency_ms: 0,
              status: "error",
              note: `${label} search failed (${errorCode(error)}); keeping the other results`,
            });
            return null;
          }
        };
        const settled = await Promise.all(
          variants.map((variant) =>
            runSearch(variant.label, {
              ...base,
              max_sector_stopovers: variant.max_sector_stopovers,
              sort: variant.sort,
            }),
          ),
        );
        const found = settled.flatMap((search) => (search ? [search] : []));
        let merged = found.length ? mergeFlightSearches(found) : null;
        let attempts = found.length;

        if ((merged?.itineraries.length ?? 0) < 3) {
          const before = merged?.itineraries.length ?? 0;
          const v4 = await runSearch("V4 two stops, price", {
            ...base,
            max_sector_stopovers: 2,
            sort: "price",
          });
          if (v4) {
            attempts += 1;
            merged = merged ? mergeFlightSearches([merged, v4]) : v4;
          }
          this.log.add({
            step: "flights",
            model: "code",
            latency_ms: 0,
            status: "fallback",
            note: `V4 fallback: max_sector_stopovers 2 with the same exclusions, because V1+V2+V3 returned ${before} flights → ${merged?.itineraries.length ?? 0} flights`,
          });
        }

        let reduced = false;
        if ((merged?.itineraries.length ?? 0) === 0) {
          const v5 = await runSearch("V5 reduced protection, price", {
            ...base,
            max_sector_stopovers: 1,
            sort: "price",
            exclude_risky_connections: false,
          });
          if (v5) {
            attempts += 1;
            merged = merged ? mergeFlightSearches([merged, v5]) : v5;
            reduced = merged.itineraries.length > 0;
          }
          this.log.add({
            step: "flights",
            model: "code",
            latency_ms: 0,
            status: "fallback",
            note: reduced
              ? `V5 fallback: original parameters (max_sector_stopovers 1, without self-transfer, airport-change or overnight exclusions) → ${merged?.itineraries.length ?? 0} flights marked reduced protection`
              : "V5 fallback: original parameters (max_sector_stopovers 1, without self-transfer, airport-change or overnight exclusions) → 0 flights",
          });
        }

        if (!merged || merged.itineraries.length === 0) {
          if (attempts === 0) throw new Error("All flight searches failed.");
          throw new AgentError("no_flights", "No flights found for these dates.");
        }
        const search = merged;
        const offers = this.store.addFlights(search, city, new Date().toISOString());
        if (reduced) for (const offer of offers) this.reducedProtection.add(offer.id);
        this.publish(offers);
        const top = [...offers].sort((a, b) => a.price - b.price).slice(0, 3);
        this.step("flights", "progress", city, {
          offers: top.map((o) => ({
            id: o.id,
            price: o.price,
            currency: o.currency,
            price_mad: o.price_mad,
            price_mad_display: o.price_mad_display,
            stops: totalStops(o),
            duration_min: o.attrs.total_duration_min,
            departure: o.attrs.outbound.departure,
            arrival: o.attrs.outbound.arrival,
            carriers: o.attrs.outbound.carriers,
          })),
        });
        this.step("flights", "done", city, { count: offers.length, passengers: search.passengers });
        return offers;
      } catch (error) {
        const code = error instanceof AgentError && error.code === "no_flights" ? "no_flights" : "flights_failed";
        this.step("flights", "error", city, { code, detail: errorCode(error) });
        throw error;
      }
    })();
    this.flights.set(k, this.track(promise));
    return promise;
  }

  hotelsFor(city: string, country: string, coords?: { lat: number; lng: number }): Promise<HotelsResult> {
    const k = key(city);
    const existing = this.hotels.get(k);
    if (existing) return existing;
    const place = findPlace({ city });
    const lat = place?.lat ?? coords?.lat ?? null;
    const lng = place?.lng ?? coords?.lng ?? null;

    const promise = (async () => {
      this.step("hotels", "start", city);
      try {
        const breakfast = this.wantsBreakfast;
        const found = await searchHotels(
          {
            city: `${city}, ${country}`,
            latitude: lat,
            longitude: lng,
            arrival: this.intent.depart_date,
            departure: this.intent.return_date,
            adults: this.intent.adults,
            children: this.intent.children,
            lang: this.jury ? "en" : this.lang,
            stars: this.stars,
            breakfast,
            maxPerNightMad: this.intent.budget_per_night_mad,
          },
          this.log,
        );
        const offers = this.store.addHotels(
          found,
          {
            destination: city,
            arrival: this.intent.depart_date,
            departure: this.intent.return_date,
            adults: this.intent.adults,
            children: this.intent.children,
          },
          new Date().toISOString(),
        );
        this.publish(offers);
        const relaxed =
          offers.length > 0 &&
          !offers.some((o) => o.attrs.stars === this.stars && (!breakfast || o.attrs.breakfast));
        const top = [...offers].sort((a, b) => a.price_mad - b.price_mad).slice(0, 3);
        this.step("hotels", "progress", city, {
          offers: top.map((o) => ({
            id: o.id,
            name: o.attrs.name,
            price: o.price,
            currency: o.currency,
            price_mad: o.price_mad,
            price_mad_display: o.price_mad_display,
            stars: o.attrs.stars,
            review_rating: o.attrs.review_rating,
          })),
        });
        this.step("hotels", "done", city, { count: offers.length, relaxed });
        return { offers, relaxed };
      } catch (error) {
        this.step("hotels", "error", city, { code: "hotels_failed", detail: errorCode(error) });
        throw error;
      }
    })();
    this.hotels.set(k, this.track(promise));
    return promise;
  }

  trendsFor(city: string): Promise<TrendOffer[]> {
    const k = key(city);
    const existing = this.trends.get(k);
    if (existing) return existing;
    const place = findPlace({ city });
    const now = new Date().toISOString().slice(0, 7);
    const before = monthOf(this.intent.depart_date, -1);

    const promise = (async () => {
      this.step("price_trends", "start", city);
      try {
        const trends = await priceTrends(
          {
            city,
            latitude: place?.lat ?? null,
            longitude: place?.lng ?? null,
            start_month: before < now ? now : before,
            end_month: monthOf(this.intent.depart_date, 2),
            stars: this.stars,
            lang: this.jury ? "en" : this.lang,
          },
          this.log,
        );
        const offers = this.store.addTrends(trends, city, new Date().toISOString());
        this.publish(offers);
        this.step("price_trends", "done", city, {
          months: offers.map((o) => ({ id: o.id, month: o.attrs.month, price: o.price, currency: o.currency })),
        });
        return offers;
      } catch (error) {
        this.step("price_trends", "error", city, { code: "trends_failed", detail: errorCode(error) });
        throw error;
      }
    })();
    this.trends.set(k, this.track(promise));
    return promise;
  }

  private entryKeys(country: string, countryCode: string | null): string[] {
    return [countryCode, country].flatMap((value) => (value ? [key(value)] : []));
  }

  hasEntry(country: string, countryCode: string | null): boolean {
    return this.entryKeys(country, countryCode).some((k) => this.entries.has(k));
  }

  entryFor(country: string, countryCode: string | null, city: string | null): Promise<EntryRequirements> {
    const keys = this.entryKeys(country, countryCode);
    for (const k of keys) {
      const existing = this.entries.get(k);
      if (existing) return existing;
    }

    const promise = (async () => {
      const label = city ?? country;
      this.step("entry_requirements", "start", label);
      try {
        const entry = isHomeCountry(this.profile.passport_country, country, countryCode)
          ? {
              visa_needed: false,
              visa_kind: "none" as const,
              max_stay_days: null,
              passport_validity_days: null,
              notes: {
                darija: "Bla visa: rak raj3 l bladek.",
                fr: "Pas besoin, tu rentres chez toi.",
                en: "No need, you are going home.",
              },
              country,
              country_code: countryCode,
              passport: this.profile.passport_country ?? "unknown",
              has_schengen: this.profile.has_schengen,
              sources: [],
              checked_at: "",
              homecoming: true,
            }
          : await checkEntryRequirements({
              country,
              countryCode,
              city,
              departDate: this.intent.depart_date,
              nights: this.intent.nights,
              profile: this.profile,
              arabic: wantsArabic(this.lang),
              log: this.log,
            });
        for (const k of keys) this.entryResults.set(k, entry);
        this.step("entry_requirements", "progress", label, { sources: entry.sources });
        this.step("entry_requirements", "done", label, {
          visa_needed: entry.visa_needed,
          visa_kind: entry.visa_kind,
          code: entry.homecoming ? "homecoming" : entry.visa_needed ? "visa_needed" : "visa_free",
          notes: entry.notes,
        });
        return entry;
      } catch (error) {
        this.step("entry_requirements", "error", label, { code: "entry_check_failed", detail: errorCode(error) });
        throw error;
      }
    })();
    this.track(promise);
    for (const k of keys) this.entries.set(k, promise);
    return promise;
  }

  entryForCity(city: string): EntryRequirements | null {
    const country = this.destinationCountry.get(key(city));
    if (!country) return null;
    const place = findPlace({ city });
    return (
      this.entryResults.get(key(country)) ??
      (place ? this.entryResults.get(key(place.country_code)) : undefined) ??
      null
    );
  }

  /** Starts the searches for the requested city before Wonder even plans. */
  prefetch(destination: { city: string; country: string; iata: string }) {
    const place = findPlace({ iata: destination.iata, city: destination.city });
    const settle = (p: Promise<unknown>) => p.catch(() => {});
    settle(this.flightsFor(destination.city, destination.country, destination.iata));
    settle(this.hotelsFor(destination.city, destination.country));
    settle(this.trendsFor(destination.city));
    settle(this.entryFor(destination.country, place?.country_code ?? null, destination.city));
  }

  // -------------------------------------------------------------------------
  // What Wonder sees
  // -------------------------------------------------------------------------

  private flightView(offers: FlightOffer[]) {
    const ranks = priceRanks(offers);
    const byPrice = [...offers].sort((a, b) => a.price_mad - b.price_mad);
    const byTime = [...offers].sort((a, b) => a.attrs.total_duration_min - b.attrs.total_duration_min);
    const direct = byPrice.filter((o) => totalStops(o) === 0);
    const picked = [...new Set([...byPrice.slice(0, 6), ...byTime.slice(0, 2), ...direct.slice(0, 2)])]
      .sort((a, b) => Number(this.reducedProtection.has(a.id)) - Number(this.reducedProtection.has(b.id)))
      .slice(0, 10);
    return picked.map((o) => {
      const reduced = this.reducedProtection.has(o.id);
      const out = o.attrs.outbound;
      const back = o.attrs.inbound;
      return {
        id: o.id,
        ...ranks.get(o.id),
        ...(reduced ? { protection: "reduced" as const } : {}),
        outbound: {
          route: out.route.join("-"),
          depart: clock(out.departure),
          arrive: clock(out.arrival),
          arrive_next_day: out.arrival.slice(0, 10) > out.departure.slice(0, 10),
          minutes: out.duration_min,
          stops: out.stops,
          flights: out.flights.join(" "),
          airlines: out.carriers,
        },
        inbound: back
          ? {
              route: back.route.join("-"),
              depart: clock(back.departure),
              arrive: clock(back.arrival),
              minutes: back.duration_min,
              stops: back.stops,
              flights: back.flights.join(" "),
              airlines: back.carriers,
            }
          : null,
        checked_bags: o.attrs.baggage.checked_bag,
        cabin_bags: o.attrs.baggage.cabin_bag,
      };
    });
  }

  private hotelView(offers: HotelOffer[]) {
    const ranks = priceRanks(offers);
    const rated = offers.filter((o) => (o.attrs.review_rating ?? 0) >= 7.5);
    const pool = rated.length >= 5 ? rated : offers;
    const byPrice = [...pool].sort((a, b) => a.price_mad - b.price_mad);
    const byRating = [...pool].sort((a, b) => (b.attrs.review_rating ?? 0) - (a.attrs.review_rating ?? 0));
    const picked = [...new Set([...byPrice.slice(0, 8), ...byRating.slice(0, 2)])];
    return picked.map((o) => ({
      id: o.id,
      ...ranks.get(o.id),
      name: o.attrs.name,
      stars: o.attrs.stars,
      guest_rating: o.attrs.review_rating,
      reviews: o.attrs.review_count,
      distance: o.attrs.distance,
      breakfast: o.attrs.breakfast,
      free_cancellation: o.attrs.free_cancellation,
      amenities: o.attrs.amenities.slice(0, 4),
    }));
  }

  /**
   * The request's city, airport and country. A tool call for anywhere else
   * is refused before any search starts.
   */
  private destinationLock(name: string, city: string, country: string, iata: string): string | null {
    const dest = this.intent.destination;
    if (!dest) return JSON.stringify({ error: "destination_locked" });
    const cityOk = !city || key(city) === key(dest.city);
    const countryOk = !country || key(country) === key(dest.country);
    const code = iata.toUpperCase();
    const iataOk = !code || code === dest.iata.toUpperCase();
    const named = Boolean(city || country);
    if (named && cityOk && countryOk && iataOk) return null;
    this.log.add({
      step: "destination_locked",
      model: "code",
      latency_ms: 0,
      status: "blocked",
      note: `${name} refused for ${[city, country, code].filter(Boolean).join(", ") || "an empty destination"}; locked to ${dest.city} (${dest.iata})`,
    });
    return JSON.stringify({ error: "destination_locked", city: dest.city, iata: dest.iata });
  }

  /** Runs one Wonder tool call and returns the JSON string for the tool message. */
  async execute(name: string, rawArgs: string): Promise<string> {
    const started = performance.now();
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(rawArgs || "{}");
    } catch {
      return JSON.stringify({ error: "invalid_arguments" });
    }
    const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");
    const city = str(args.city);
    const country = str(args.country);
    const askedIata = str(args.iata).toUpperCase();
    const dest = this.intent.destination;
    if (name === "search_flights" || name === "search_hotels" || name === "price_trends" || name === "check_entry_requirements") {
      const locked = this.destinationLock(name, city, country, name === "search_flights" ? askedIata : "");
      if (locked) return locked;
      if (name === "check_entry_requirements" && dest) {
        const code = str(args.country_code).toUpperCase();
        const byCode = code ? findPlace({ iata: code }) : null;
        if (byCode && key(byCode.country) !== key(dest.country) && key(byCode.city) !== key(dest.city)) {
          this.log.add({
            step: "destination_locked",
            model: "code",
            latency_ms: 0,
            status: "blocked",
            note: `check_entry_requirements refused for ${code}; locked to ${dest.city} (${dest.iata})`,
          });
          return JSON.stringify({ error: "destination_locked", city: dest.city, iata: dest.iata });
        }
      }
    }
    const lockedCity = dest?.city ?? city;
    const lockedCountry = dest?.country ?? country;
    const lockedIata = dest?.iata ?? askedIata;
    const prefetched =
      (name === "search_flights" && this.flights.has(key(lockedCity))) ||
      (name === "search_hotels" && this.hotels.has(key(lockedCity))) ||
      (name === "price_trends" && this.trends.has(key(lockedCity))) ||
      (name === "check_entry_requirements" && this.hasEntry(lockedCountry, str(args.country_code) || null));

    const logCall = (status: "ok" | "error", note: string) =>
      this.log.add({
        step: "tool_call",
        model: name,
        latency_ms: Math.round(performance.now() - started),
        status,
        note: `${lockedCity || lockedCountry} ${prefetched ? "(served from the search started with the intent)" : "(new search)"}${note ? `, ${note}` : ""}`,
      });

    try {
      let result: unknown;
      if (name === "search_flights") {
        if (!lockedCity) return JSON.stringify({ error: "city_required" });
        const offers = await this.flightsFor(lockedCity, lockedCountry, lockedIata);
        const first = offers[0];
        const reduced = offers.some((o) => this.reducedProtection.has(o.id));
        result = {
          city: lockedCity,
          passengers: first?.attrs.passengers ?? null,
          count: offers.length,
          direct_count: offers.filter((o) => totalStops(o) === 0).length,
          ...(reduced
            ? {
                protection: "reduced" as const,
                note: "Last resort only. These flights have reduced protection: separate tickets, an airport change or an overnight stop may apply. Choose one because no protected flight was found.",
              }
            : {}),
          offers: this.flightView(offers),
        };
      } else if (name === "search_hotels") {
        if (!lockedCity) return JSON.stringify({ error: "city_required" });
        const { offers, relaxed } = await this.hotelsFor(lockedCity, lockedCountry);
        result = {
          city: lockedCity,
          nights: offers[0]?.attrs.nights ?? this.intent.nights,
          style_stars: this.stars,
          breakfast_requested: this.wantsBreakfast,
          filters_relaxed: relaxed,
          count: offers.length,
          offers: this.hotelView(offers),
        };
      } else if (name === "price_trends") {
        if (!lockedCity) return JSON.stringify({ error: "city_required" });
        const offers = await this.trendsFor(lockedCity);
        const ranks = priceRanks(offers);
        const travelMonth = this.intent.depart_date.slice(0, 7);
        result = {
          city: lockedCity,
          stars: this.stars,
          months: offers.map((o) => ({
            id: o.id,
            month: o.attrs.month,
            price_index: ranks.get(o.id)?.price_index ?? null,
            is_travel_month: o.attrs.month === travelMonth,
          })),
        };
      } else if (name === "check_entry_requirements") {
        if (!lockedCountry) return JSON.stringify({ error: "country_required" });
        const place = findPlace({ iata: lockedIata, city: lockedCity });
        const entry = await this.entryFor(lockedCountry, place?.country_code ?? null, lockedCity || null);
        result = {
          country: entry.country,
          passport: entry.passport,
          has_schengen_visa: entry.has_schengen,
          visa_needed: entry.visa_needed,
          visa_kind: entry.visa_kind,
          max_stay_days: entry.max_stay_days,
          passport_validity_days: entry.passport_validity_days,
          passport_valid_6_months: this.profile.passport_6m,
          sources: entry.sources.map((s) => s.title),
        };
      } else {
        return JSON.stringify({ error: "unknown_tool" });
      }
      logCall("ok", "");
      return JSON.stringify(result);
    } catch (error) {
      logCall("error", errorCode(error));
      if (error instanceof AgentError) throw error;
      return JSON.stringify({ error: "tool_failed", detail: errorCode(error) });
    }
  }
}

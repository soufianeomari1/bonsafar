import { z } from "zod";
import { serverEnv } from "@/lib/env";
import type { RunLog } from "@/lib/ai/events";
import { callMcpTool, McpToolError } from "./connection";

/** Live name and schema in docs/mcp-tools.json (listTools, 2026-11-03). */
export const KIWI_SEARCH_TOOL = "search-flight";

const Segment = z.looseObject({
  from: z.string().nullish(),
  to: z.string().nullish(),
  fromCity: z.string().nullish(),
  toCity: z.string().nullish(),
  departureTime: z.string().nullish(),
  arrivalTime: z.string().nullish(),
  durationSeconds: z.number().nullish(),
  carrier: z.string().nullish(),
  carrierName: z.string().nullish(),
  flightNumber: z.string().nullish(),
});

const Leg = z.looseObject({
  from: z.string().nullish(),
  to: z.string().nullish(),
  departureTime: z.string().nullish(),
  arrivalTime: z.string().nullish(),
  durationSeconds: z.number().nullish(),
  stops: z.number().int().nullish(),
  route: z.array(z.string()).default([]),
  cabinClass: z.string().nullish(),
  segments: z.array(Segment).default([]),
});

const Itinerary = z.looseObject({
  id: z.string().nullish(),
  price: z.number().nullish(),
  totalDurationSeconds: z.number().nullish(),
  bookingUrl: z.string().nullish(),
  /** Destination photo id. URL: https://images.kiwi.com/photos/600x600/{imageId}.jpg */
  imageId: z.string().nullish(),
  baggage: z
    .looseObject({
      personalItem: z.number().default(0),
      cabinBag: z.number().default(0),
      checkedBag: z.number().default(0),
    })
    .nullish(),
  outbound: Leg.nullish(),
  inbound: Leg.nullish(),
});

const SearchResult = z.looseObject({
  query: z.string(),
  currency: z.string().nullish(),
  passengers: z
    .looseObject({
      adults: z.number().int().default(0),
      children: z.number().int().default(0),
      infants: z.number().int().default(0),
    })
    .nullish(),
  itineraries: z.array(Itinerary).default([]),
  error: z.string().nullish(),
});

export type KiwiSegment = {
  from: string;
  to: string;
  from_city: string | null;
  to_city: string | null;
  /** Local times at each airport, as returned by Kiwi.com. */
  departure: string;
  arrival: string;
  carrier_code: string | null;
  carrier_name: string | null;
  flight: string | null;
};

export type KiwiStopover = {
  airport: string;
  city: string | null;
  /** Whole minutes on the ground, computed from the two local times at that airport. */
  minutes: number;
};

export type KiwiLeg = {
  from: string;
  to: string;
  departure: string;
  arrival: string;
  /** Whole minutes, from Kiwi.com's durationSeconds. */
  duration_min: number;
  stops: number;
  route: string[];
  flights: string[];
  carriers: string[];
  /** Optional: runs saved before these fields still load. */
  carrier_codes?: string[];
  segments?: KiwiSegment[];
  stopovers?: KiwiStopover[];
};

/** Minutes between two local times of the same airport. */
function minutesBetween(from: string, to: string): number | null {
  const a = Date.parse(`${from.slice(0, 19)}Z`);
  const b = Date.parse(`${to.slice(0, 19)}Z`);
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return null;
  return Math.round((b - a) / 60_000);
}

function toSegments(raw: z.infer<typeof Segment>[]): KiwiSegment[] {
  return raw.flatMap((s) =>
    s.from && s.to && s.departureTime && s.arrivalTime
      ? [
          {
            from: s.from,
            to: s.to,
            from_city: s.fromCity ?? null,
            to_city: s.toCity ?? null,
            departure: s.departureTime,
            arrival: s.arrivalTime,
            carrier_code: s.carrier ?? null,
            carrier_name: s.carrierName ?? null,
            flight: s.flightNumber ?? null,
          },
        ]
      : [],
  );
}

function toStopovers(segments: KiwiSegment[]): KiwiStopover[] {
  return segments.slice(0, -1).flatMap((segment, index) => {
    const minutes = minutesBetween(segment.arrival, segments[index + 1].departure);
    return minutes == null ? [] : [{ airport: segment.to, city: segment.to_city, minutes }];
  });
}

export type KiwiItinerary = {
  kiwi_id: string | null;
  /** Total for all passengers in `currency`, as returned by Kiwi.com. */
  price: number;
  booking_url: string | null;
  /** Kiwi.com destination photo id, or null when the tool omitted it. */
  image_id: string | null;
  /** Whole minutes, outbound plus inbound. */
  total_duration_min: number;
  baggage: { personal_item: number; cabin_bag: number; checked_bag: number };
  outbound: KiwiLeg;
  inbound: KiwiLeg | null;
};

export type KiwiSearch = {
  query: string;
  currency: string;
  passengers: { adults: number; children: number; infants: number };
  itineraries: KiwiItinerary[];
};

export type FlightSearchParams = {
  /** IATA code, city or airport name, resolved by Kiwi.com. */
  from: string;
  to: string;
  depart_date: string;
  return_date: string | null;
  adults: number;
  children: number;
  locale: "en" | "fr";
};

/** YYYY-MM-DD to the dd/mm/yyyy format the tool expects. */
function kiwiDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function toMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

function toLeg(leg: z.infer<typeof Leg> | null): KiwiLeg | null {
  if (!leg?.departureTime || !leg.arrivalTime || !leg.from || !leg.to) return null;
  const segments = toSegments(leg.segments);
  return {
    from: leg.from,
    to: leg.to,
    departure: leg.departureTime,
    arrival: leg.arrivalTime,
    duration_min: toMinutes(leg.durationSeconds ?? 0),
    stops: leg.stops ?? Math.max(0, leg.segments.length - 1),
    route: leg.route,
    flights: leg.segments.flatMap((s) => (s.flightNumber ? [s.flightNumber] : [])),
    carriers: [...new Set(leg.segments.flatMap((s) => (s.carrierName ? [s.carrierName] : [])))],
    carrier_codes: [...new Set(leg.segments.flatMap((s) => (s.carrier ? [s.carrier] : [])))],
    segments,
    stopovers: toStopovers(segments),
  };
}

export async function searchFlights(params: FlightSearchParams, log: RunLog): Promise<KiwiSearch> {
  const env = serverEnv();
  const args: Record<string, unknown> = {
    flyFrom: params.from,
    flyTo: params.to,
    departureDate: kiwiDate(params.depart_date),
    adults: params.adults,
    children: params.children,
    currency: "EUR",
    locale: params.locale,
    sort: "price",
  };
  if (params.return_date) args.returnDate = kiwiDate(params.return_date);

  const result = await callMcpTool({
    server: "kiwi",
    url: env.KIWI_MCP_URL,
    tool: KIWI_SEARCH_TOOL,
    args,
    log,
    step: "flights",
    timeoutMs: 25_000,
    summarize: (r) => {
      const parsed = SearchResult.safeParse(r.structured);
      return parsed.success
        ? `${parsed.data.itineraries.length} itineraries, ${parsed.data.query}`
        : "unreadable result";
    },
  });

  const parsed = SearchResult.safeParse(result.structured);
  if (!parsed.success) throw new McpToolError(KIWI_SEARCH_TOOL, "unexpected result shape");
  if (parsed.data.error) throw new McpToolError(KIWI_SEARCH_TOOL, parsed.data.error.slice(0, 200));

  const itineraries: KiwiItinerary[] = parsed.data.itineraries.flatMap((it) => {
    const outbound = toLeg(it.outbound ?? null);
    if (it.price == null || !outbound) return [];
    const inbound = toLeg(it.inbound ?? null);
    if (params.return_date && !inbound) return [];
    return [
      {
        kiwi_id: it.id ?? null,
        price: it.price,
        booking_url: it.bookingUrl ?? null,
        image_id: it.imageId && /^[A-Za-z0-9_-]{1,80}$/.test(it.imageId) ? it.imageId : null,
        total_duration_min:
          it.totalDurationSeconds != null
            ? toMinutes(it.totalDurationSeconds)
            : outbound.duration_min + (inbound?.duration_min ?? 0),
        baggage: {
          personal_item: it.baggage?.personalItem ?? 0,
          cabin_bag: it.baggage?.cabinBag ?? 0,
          checked_bag: it.baggage?.checkedBag ?? 0,
        },
        outbound,
        inbound,
      },
    ];
  });

  return {
    query: parsed.data.query,
    currency: parsed.data.currency ?? "EUR",
    passengers: {
      adults: parsed.data.passengers?.adults ?? params.adults,
      children: parsed.data.passengers?.children ?? params.children,
      infants: parsed.data.passengers?.infants ?? 0,
    },
    itineraries,
  };
}

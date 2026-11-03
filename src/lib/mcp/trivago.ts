import { z } from "zod";
import { serverEnv } from "@/lib/env";
import type { RunLog } from "@/lib/ai/events";
import type { Lang } from "@/lib/i18n";
import { parseFormattedAmount } from "@/lib/prices/money";
import { callMcpTool, McpToolError } from "./connection";

/** Live names and schemas in docs/mcp-tools.json (listTools, 2026-11-03). */
export const TRIVAGO_TOOLS = {
  radius: "trivago-accommodation-radius-search",
  search: "trivago-accommodation-search",
  trends: "trivago-destination-price-trends",
} as const;

/** The user's market and currency: Morocco and dirhams for every BonSafar user. */
const MARKET = { country: "MA", currency: "MAD" } as const;

/** Profile language to one of the tool's `language` enum values. */
export function trivagoLanguage(lang: Lang): string {
  switch (lang) {
    case "en":
      return "EN_GB";
    case "ar":
    case "darija-arab":
      return "AR145";
    default:
      return "FR_FR";
  }
}

export type HotelStars = 3 | 4 | 5;

const Deal = z.looseObject({
  advertiser: z.string().nullish(),
  price_per_night: z.string().nullish(),
  price_per_stay: z.string().nullish(),
  currency: z.string().nullish(),
  deal_url: z.string().nullish(),
  price_attributes: z
    .array(z.looseObject({ id: z.string(), name: z.string().nullish() }))
    .default([]),
});

const Accommodation = z.looseObject({
  accommodation_id: z.string(),
  accommodation_name: z.string(),
  hotel_rating: z.number().nullish(),
  review_rating: z.union([z.string(), z.number()]).nullish(),
  review_count: z.union([z.string(), z.number()]).nullish(),
  top_amenities: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  distance: z.string().nullish(),
  country_city: z.string().nullish(),
  deals: z.array(Deal).default([]),
});

const AccommodationResult = z.looseObject({
  accommodations: z.array(Accommodation).default([]),
});

export type TrivagoHotel = {
  accommodation_id: string;
  name: string;
  stars: number | null;
  review_rating: number | null;
  review_count: number | null;
  amenities: string[];
  distance: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  deal: {
    advertiser: string | null;
    /** Whole stay, all guests, in `currency`. */
    price_per_stay: number;
    price_per_night: number | null;
    currency: string;
    url: string | null;
    /** trivago price attribute ids: breakfastIncluded, freeCancellation, nonRefundable... */
    attributes: string[];
  };
};

export type HotelSearchParams = {
  city: string;
  latitude: number | null;
  longitude: number | null;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  lang: Lang;
  stars: HotelStars | null;
  breakfast: boolean;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  return parseFormattedAmount(value);
}

/** Keeps the cheapest readable deal of each property. */
function toHotel(raw: z.infer<typeof Accommodation>): TrivagoHotel | null {
  let best: TrivagoHotel["deal"] | null = null;
  for (const deal of raw.deals) {
    const stay = deal.price_per_stay ? parseFormattedAmount(deal.price_per_stay) : null;
    if (stay == null || stay <= 0 || !deal.currency) continue;
    if (best && stay >= best.price_per_stay) continue;
    best = {
      advertiser: deal.advertiser ?? null,
      price_per_stay: stay,
      price_per_night: deal.price_per_night ? parseFormattedAmount(deal.price_per_night) : null,
      currency: deal.currency,
      url: deal.deal_url ?? null,
      attributes: deal.price_attributes.map((a) => a.id),
    };
  }
  if (!best) return null;
  return {
    accommodation_id: raw.accommodation_id,
    name: raw.accommodation_name,
    stars: raw.hotel_rating ?? null,
    review_rating: toNumber(raw.review_rating),
    review_count: toNumber(raw.review_count),
    amenities: (raw.top_amenities ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    distance: raw.distance ?? null,
    city: raw.country_city ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    deal: best,
  };
}

function summarizeHotels(structured: unknown): string {
  const parsed = AccommodationResult.safeParse(structured);
  return parsed.success ? `${parsed.data.accommodations.length} properties` : "unreadable result";
}

async function accommodationCall(
  tool: string,
  args: Record<string, unknown>,
  log: RunLog,
): Promise<TrivagoHotel[]> {
  const env = serverEnv();
  const result = await callMcpTool({
    server: "trivago",
    url: env.TRIVAGO_MCP_URL,
    tool,
    args,
    log,
    step: "hotels",
    timeoutMs: 25_000,
    summarize: (r) => summarizeHotels(r.structured),
  });
  const parsed = AccommodationResult.safeParse(result.structured);
  if (!parsed.success) throw new McpToolError(tool, "unexpected result shape");
  return parsed.data.accommodations.flatMap((a) => toHotel(a) ?? []);
}

/**
 * Radius search around the city centre (the tool's preferred way), with the
 * profile filters. Falls back to no filter when they leave nothing, and to a
 * free-text search when the coordinates of the city are unknown.
 */
export async function searchHotels(params: HotelSearchParams, log: RunLog): Promise<TrivagoHotel[]> {
  const rooms = Math.max(1, Math.ceil(params.adults / 2));
  const base: Record<string, unknown> = {
    arrival: params.arrival,
    departure: params.departure,
    adults: params.adults,
    rooms,
    ...MARKET,
    language: trivagoLanguage(params.lang),
  };
  if (params.children > 0) base.children = params.children;

  const filtered: Record<string, unknown> = { ...base };
  if (params.stars) filtered.hotel_rating = { [`${params.stars}star`]: true };
  if (params.breakfast) filtered.filters = { breakfastIncluded: true };
  const hasFilters = Boolean(params.stars || params.breakfast);

  const run = (args: Record<string, unknown>) =>
    params.latitude != null && params.longitude != null
      ? accommodationCall(
          TRIVAGO_TOOLS.radius,
          { latitude: params.latitude, longitude: params.longitude, ...args },
          log,
        )
      : accommodationCall(TRIVAGO_TOOLS.search, { query: params.city, ...args }, log);

  const hotels = await run(filtered);
  if (hotels.length || !hasFilters) return hotels;
  return run(base);
}

const TrendsResult = z.looseObject({
  currency: z.string().nullish(),
  destinations: z
    .array(
      z.looseObject({
        name: z.string(),
        monthly_prices: z.array(
          z.looseObject({
            month: z.string(),
            star_rating_prices: z.array(
              z.looseObject({
                star_rating: z.number(),
                average_price: z.string().nullish(),
                minimum_price: z.string().nullish(),
                maximum_price: z.string().nullish(),
              }),
            ),
          }),
        ),
      }),
    )
    .default([]),
  error: z.string().nullish(),
});

export type TrendMonth = {
  month: string;
  star_rating: number;
  /** Forecast nightly rates in `currency`. */
  average: number;
  minimum: number | null;
  maximum: number | null;
};

export type PriceTrends = { destination: string; currency: string; months: TrendMonth[] };

export async function priceTrends(
  params: {
    city: string;
    latitude: number | null;
    longitude: number | null;
    start_month: string;
    end_month: string;
    stars: HotelStars;
    lang: Lang;
  },
  log: RunLog,
): Promise<PriceTrends> {
  const env = serverEnv();
  const query =
    params.latitude != null && params.longitude != null
      ? `lat:${params.latitude},long:${params.longitude}`
      : params.city;
  const result = await callMcpTool({
    server: "trivago",
    url: env.TRIVAGO_MCP_URL,
    tool: TRIVAGO_TOOLS.trends,
    args: {
      query,
      start_month: params.start_month,
      end_month: params.end_month,
      ...MARKET,
      language: trivagoLanguage(params.lang),
      hotel_rating: { [`${params.stars}star`]: true },
    },
    log,
    step: "price_trends",
    timeoutMs: 20_000,
    summarize: (r) => {
      const parsed = TrendsResult.safeParse(r.structured);
      const first = parsed.success ? parsed.data.destinations[0] : null;
      return first ? `${first.monthly_prices.length} months for ${first.name}` : "no destination";
    },
  });

  const parsed = TrendsResult.safeParse(result.structured);
  if (!parsed.success) throw new McpToolError(TRIVAGO_TOOLS.trends, "unexpected result shape");
  if (parsed.data.error) throw new McpToolError(TRIVAGO_TOOLS.trends, parsed.data.error.slice(0, 200));
  const destination = parsed.data.destinations[0];
  if (!destination) throw new McpToolError(TRIVAGO_TOOLS.trends, "no destination found");

  const months = destination.monthly_prices.flatMap((month) =>
    month.star_rating_prices.flatMap((row) => {
      const average = row.average_price ? parseFormattedAmount(row.average_price) : null;
      if (average == null) return [];
      return [
        {
          month: month.month,
          star_rating: row.star_rating,
          average,
          minimum: row.minimum_price ? parseFormattedAmount(row.minimum_price) : null,
          maximum: row.maximum_price ? parseFormattedAmount(row.maximum_price) : null,
        },
      ];
    }),
  );

  return { destination: destination.name, currency: parsed.data.currency ?? MARKET.currency, months };
}

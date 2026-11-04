import { z } from "zod";
import { AGENT_STEPS, type AgentStreamEvent } from "@/lib/agent/schema";
import type { Offer } from "@/lib/prices/store";

/**
 * Client-side check of the agent SSE contract. The schemas live here so the
 * agent module stays the source of the TypeScript types and is not imported
 * for its runtime. A frame that fails is dropped, the run continues.
 */

const RunEventSchema = z.object({
  t: z.string(),
  run_id: z.string(),
  step: z.string(),
  model: z.string(),
  latency_ms: z.number(),
  tokens_in: z.number(),
  tokens_out: z.number(),
  tokens_reasoning: z.number(),
  cost_usd: z.number(),
  replay: z.boolean(),
  status: z.enum(["ok", "error", "fallback", "passed", "blocked"]),
  note: z.string().optional(),
});

const FxSchema = z.object({ rate: z.number(), date: z.string() });

const OfferSchema = z.looseObject({
  id: z.string(),
  kind: z.enum(["flight", "hotel", "trend"]),
  price: z.number(),
  currency: z.string(),
  price_mad: z.number(),
  price_mad_display: z.number(),
  source: z.enum(["kiwi.com", "trivago"]),
  fetched_at: z.string(),
  attrs: z.unknown(),
});

const TotalsSchema = z.looseObject({
  total_display_mad: z.number(),
  per_person_display_mad: z.number(),
});

const OptionSchema = z.looseObject({
  flight_id: z.string(),
  hotel_id: z.string(),
  totals: TotalsSchema,
});

/** Loose on purpose: extra fields of the contract (entry, why, delta) pass through. */
const PackageSchema = z.looseObject({
  destination: z.looseObject({ city: z.string(), country: z.string(), iata: z.string() }),
  recommended: OptionSchema,
  alternatives: z.array(z.looseObject({ label: z.enum(["direct", "cheapest"]), ...OptionSchema.shape })),
  why: z.array(z.looseObject({ darija: z.string(), fr: z.string(), en: z.string() })),
  fx: FxSchema,
  prices_captured_at: z.string(),
});

const EventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("run"),
    run_id: z.string(),
    started_at: z.string(),
    fx: FxSchema,
    replay: z.boolean(),
    captured_at: z.string().optional(),
  }),
  z.object({
    type: z.literal("step"),
    step: z.enum(AGENT_STEPS),
    phase: z.enum(["start", "progress", "done", "error"]),
    destination: z.string().optional(),
    data: z.unknown().optional(),
  }),
  z.object({ type: z.literal("log"), event: RunEventSchema }),
  z.object({ type: z.literal("offers"), offers: z.array(OfferSchema) }),
  z.object({ type: z.literal("result"), package: PackageSchema }),
  z.object({ type: z.literal("saved"), run_id: z.string(), ok: z.boolean() }),
  z.object({
    type: z.literal("error"),
    code: z.enum([
      "intent_incomplete",
      "origin_missing",
      "timeout",
      "agent_invalid_output",
      "agent_failed",
      "replay_unavailable",
    ]),
    detail: z.string().optional(),
  }),
  z.object({
    type: z.literal("end"),
    total_ms: z.number(),
    cost_usd: z.number(),
    replay: z.boolean(),
    recorded: z.object({ total_ms: z.number(), cost_usd: z.number() }).optional(),
  }),
]);

export function parseStreamEvent(value: unknown): AgentStreamEvent | null {
  const parsed = EventSchema.safeParse(value);
  if (!parsed.success) return null;
  if (parsed.data.type === "offers") {
    return { type: "offers", offers: parsed.data.offers as Offer[] };
  }
  return parsed.data as AgentStreamEvent;
}

const FlightRows = z.object({
  offers: z.array(
    z.object({
      id: z.string(),
      price_mad_display: z.number(),
      stops: z.number(),
      duration_min: z.number(),
      departure: z.string(),
      arrival: z.string(),
      carriers: z.array(z.string()),
    }),
  ),
});

const HotelRows = z.object({
  offers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price_mad_display: z.number(),
      stars: z.number().nullable(),
      review_rating: z.number().nullable(),
    }),
  ),
});

const CountData = z.object({ count: z.number() });

const EntryDone = z.object({
  visa_needed: z.boolean(),
  visa_kind: z.string().optional(),
});

const EntryProgress = z.object({
  sources: z.array(z.object({ title: z.string(), url: z.string(), date: z.string() })).optional(),
});

export type FlightRow = z.infer<typeof FlightRows>["offers"][number];
export type HotelRow = z.infer<typeof HotelRows>["offers"][number];

export function readFlightRows(data: unknown): FlightRow[] {
  const parsed = FlightRows.safeParse(data);
  return parsed.success ? parsed.data.offers : [];
}

export function readHotelRows(data: unknown): HotelRow[] {
  const parsed = HotelRows.safeParse(data);
  return parsed.success ? parsed.data.offers : [];
}

export function readCount(data: unknown): number | null {
  const parsed = CountData.safeParse(data);
  return parsed.success ? parsed.data.count : null;
}

export function readVisaNeeded(data: unknown): { visa_needed: boolean; visa_kind?: string } | null {
  const parsed = EntryDone.safeParse(data);
  return parsed.success ? parsed.data : null;
}

export function readSources(data: unknown): { title: string; url: string; date: string }[] {
  const parsed = EntryProgress.safeParse(data);
  return parsed.success ? (parsed.data.sources ?? []) : [];
}

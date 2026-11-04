import { z } from "zod";
import type { RunEvent } from "@/lib/ai/events";
import type { Intent } from "@/lib/intent/schema";
import type { Offer } from "@/lib/prices/store";
import { adminClient } from "@/lib/supabase/admin";
import { AGENT_STEPS, type AgentPackage, type RecordedFrame } from "./schema";

/**
 * Saves a successful run in public.runs (RLS on, no policy: server only) so
 * it can be replayed with a visible "replay" badge and the capture time.
 */
export async function saveRun(run: {
  id: string;
  scenario: string | null;
  intent: Intent;
  events: RunEvent[];
  offers: Offer[];
  package: AgentPackage;
  stream: RecordedFrame[];
}): Promise<boolean> {
  const { error } = await adminClient().from("runs").insert({
    id: run.id,
    scenario: run.scenario,
    intent: run.intent,
    events: run.events,
    offers: run.offers,
    package: run.package,
    stream: run.stream,
    prices_captured_at: run.package.prices_captured_at,
  });
  return !error;
}

// ---------------------------------------------------------------------------
// Shape checks for replays. Runs saved before whole-dirham amounts and
// minutes (price_mad_display, duration_min) or before the stream was
// recorded do not pass, so a replay never shows an outdated contract.
// ---------------------------------------------------------------------------

const Int = z.number().int();

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

const Leg = z.looseObject({ duration_min: Int, duration_s: z.never().optional() });

const OfferBase = {
  id: z.string().regex(/^[FHT]\d{1,3}$/),
  price: z.number(),
  currency: z.string(),
  price_mad: z.number(),
  price_mad_display: Int,
  source: z.enum(["kiwi.com", "trivago"]),
  fetched_at: z.string(),
};

const StoredOffer = z.discriminatedUnion("kind", [
  z.looseObject({
    ...OfferBase,
    kind: z.literal("flight"),
    attrs: z.looseObject({
      outbound: Leg,
      inbound: Leg.nullable(),
      total_duration_min: Int,
      total_duration_s: z.never().optional(),
    }),
  }),
  z.looseObject({ ...OfferBase, kind: z.literal("hotel"), attrs: z.looseObject({ nights: Int }) }),
  z.looseObject({ ...OfferBase, kind: z.literal("trend"), attrs: z.looseObject({}) }),
]);

const Line = z.looseObject({ price_mad: z.number(), price_mad_display: Int });
const Option = z.looseObject({
  flight_id: z.string(),
  hotel_id: z.string(),
  totals: z.looseObject({ flight: Line, hotel: Line, total_mad: z.number(), total_display_mad: Int }),
});

const StoredPackage = z.looseObject({
  run_id: z.string(),
  status: z.enum(["ok", "visa_alternative", "visa_needed_no_alternative"]),
  recommended: Option,
  alternatives: z.array(Option),
  smart_tip: z.looseObject({
    delta: z
      .looseObject({ saved_minutes: Int, extra_display_mad: Int, saved_s: z.never().optional() })
      .nullable(),
  }),
  prices_captured_at: z.string(),
  total_ms: z.number(),
  cost_usd: z.number(),
});

const StoredEvent = z.discriminatedUnion("type", [
  z.looseObject({ type: z.literal("run"), run_id: z.string(), started_at: z.string(), fx: z.looseObject({}) }),
  z.looseObject({
    type: z.literal("step"),
    step: z.enum(AGENT_STEPS),
    phase: z.enum(["start", "progress", "done", "error"]),
  }),
  z.object({ type: z.literal("log"), event: RunEventSchema }),
  z.object({ type: z.literal("offers"), offers: z.array(StoredOffer) }),
  z.object({ type: z.literal("result"), package: StoredPackage }),
]);

const StoredRunSchema = z.object({
  id: z.string(),
  scenario: z.string(),
  created_at: z.string(),
  prices_captured_at: z.string(),
  intent: z.unknown(),
  offers: z.array(StoredOffer),
  package: StoredPackage,
  stream: z
    .array(z.object({ ms: z.number().min(0), event: StoredEvent }))
    .min(2)
    .refine((frames) => frames[0].event.type === "run", "stream must start with run")
    .refine((frames) => frames.at(-1)?.event.type === "result", "stream must end with result"),
});

export type StoredRun = {
  id: string;
  scenario: string;
  created_at: string;
  prices_captured_at: string;
  /** As saved; parse it before use. */
  intent: unknown;
  package: AgentPackage;
  stream: RecordedFrame[];
};

/** How many recent rows to look through for one with the current shape. */
const CANDIDATES = 5;

/** The latest run of a scenario with the current shape, or null. */
export async function loadLatestRun(scenario: string): Promise<StoredRun | null> {
  const { data, error } = await adminClient()
    .from("runs")
    .select("id, scenario, created_at, prices_captured_at, intent, offers, package, stream")
    .eq("scenario", scenario)
    .not("stream", "is", null)
    .order("created_at", { ascending: false })
    .limit(CANDIDATES);
  if (error || !data) return null;

  for (const row of data) {
    const parsed = StoredRunSchema.safeParse(row);
    if (!parsed.success) continue;
    // Validated above for every field a replay reads; the rest is passed through as stored.
    const run = parsed.data as unknown as StoredRun & { offers: unknown };
    return {
      id: run.id,
      scenario: run.scenario,
      created_at: run.created_at,
      prices_captured_at: run.prices_captured_at,
      intent: run.intent,
      package: run.package,
      stream: run.stream,
    };
  }
  return null;
}

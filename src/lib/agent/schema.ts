import { z } from "zod";
import type { RunEvent } from "@/lib/ai/events";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { IntentSchema } from "@/lib/intent/schema";
import { ProfileSchema } from "@/lib/profile/schema";
import type { FxRate } from "@/lib/prices/money";
import type { Offer } from "@/lib/prices/store";
import type { FlightDelta, PackageTotals } from "@/lib/prices/totals";

/** Safe on both sides: zod schemas and types only. */

export const AGENT_STEPS = [
  "flights",
  "hotels",
  "price_trends",
  "entry_requirements",
  "package",
] as const;
export type AgentStep = (typeof AGENT_STEPS)[number];

const ScenarioLabel = z.string().regex(/^[a-z0-9_-]{1,40}$/);

export const AgentRequestSchema = z.object({
  intent: IntentSchema,
  profile: ProfileSchema,
  lang: z.enum(LANGUAGES),
  jury: z.boolean().default(false),
  /** Label for saved runs ("istanbul", "paris"); null for a free run. */
  scenario: ScenarioLabel.nullable().default(null),
  replay: z.literal(false).optional(),
});
export type AgentRequest = z.input<typeof AgentRequestSchema>;

/** Replays the latest valid saved run of a scenario: no model or MCP call. */
export const AgentReplayRequestSchema = z.object({
  replay: z.literal(true),
  scenario: ScenarioLabel,
});
export type AgentReplayRequest = z.input<typeof AgentReplayRequestSchema>;

/** Codes of the final `error` event (step failures use their own codes). */
export type AgentErrorCode =
  | "intent_incomplete"
  | "origin_missing"
  | "timeout"
  | "agent_invalid_output"
  | "agent_failed"
  | "replay_unavailable";

const Trilingual = z.object({
  darija: z.string().min(1).max(280),
  fr: z.string().min(1).max(280),
  en: z.string().min(1).max(280),
  /** Modern Standard Arabic. Only asked for when the request has lang = "ar". */
  ar: z.string().min(1).max(280).optional(),
});
export type TrilingualText = z.infer<typeof Trilingual>;

/** The same text with the Arabic line required: the schema sent when lang = "ar". */
const TrilingualAr = Trilingual.extend({ ar: z.string().min(1).max(280) });

/** Arabic model text costs tokens: only an Arabic interface asks for it. */
export function wantsArabic(lang: Lang): boolean {
  return lang === "ar";
}

export const VISA_KINDS = ["none", "schengen", "evisa", "on_arrival", "consular", "unknown"] as const;

/** What Muse Spark returns for check_entry_requirements (JSON schema in text.format). */
export const EntryModelSchema = z.object({
  visa_needed: z.boolean(),
  visa_kind: z.enum(VISA_KINDS),
  max_stay_days: z.number().int().min(1).max(3650).nullable(),
  /** Days the passport must stay valid, counted from arrival. */
  passport_validity_days: z.number().int().min(0).max(3650).nullable(),
  notes: Trilingual,
});
export const EntryModelSchemaAr = EntryModelSchema.extend({ notes: TrilingualAr });

export type EntryRequirements = z.infer<typeof EntryModelSchema> & {
  country: string;
  country_code: string | null;
  passport: string;
  has_schengen: boolean;
  /** From the url_citation annotations and the pages the model opened. */
  sources: { title: string; url: string; date: string }[];
  checked_at: string;
};

export const ALTERNATIVE_LABELS = ["direct", "cheapest"] as const;
export const SMART_TIP_KINDS = ["direct_upgrade", "cheaper_flight", "none"] as const;
export const REJECT_REASONS = [
  "too_many_stops",
  "too_long",
  "too_expensive",
  "low_rating",
  "far_from_center",
  "no_breakfast",
  "overnight_layover",
  "airport_change",
  "visa_needed",
  "other",
] as const;

const OfferId = (prefix: "F" | "H") => z.string().regex(new RegExp(`^${prefix}\\d{1,3}$`));

/** Muse Wonder's final answer: offer ids and codes only, never an amount. */
export const WonderOutputSchema = z.object({
  recommended: z.object({ flight_id: OfferId("F"), hotel_id: OfferId("H") }),
  alternatives: z
    .array(
      z.object({
        label: z.enum(ALTERNATIVE_LABELS),
        flight_id: OfferId("F"),
        hotel_id: OfferId("H"),
      }),
    )
    .max(2),
  why: z.array(Trilingual).length(3),
  smart_tip: z.object({
    kind: z.enum(SMART_TIP_KINDS),
    compare_flight_id: OfferId("F").nullable(),
  }),
  rejected: z
    .array(z.object({ offer_id: z.string().regex(/^[FHT]\d{1,3}$/), reason: z.enum(REJECT_REASONS) }))
    .max(6),
});
export type WonderOutput = z.infer<typeof WonderOutputSchema>;
export const WonderOutputSchemaAr = WonderOutputSchema.extend({ why: z.array(TrilingualAr).length(3) });

/** Codes the interface translates; the engine never ships display text. */
export type AgentStatus = "ok" | "visa_alternative" | "visa_needed_no_alternative";
export type AgentNotice =
  | "visa_needed"
  | "visa_free_alternative"
  | "passport_validity_check"
  | "passengers_mismatch"
  | "hotel_filters_relaxed"
  | "guardrail_scrubbed";

export type Destination = { city: string; country: string; iata: string };

export type PackageOption = {
  flight_id: string;
  hotel_id: string;
  totals: PackageTotals;
};

export type AgentPackage = {
  run_id: string;
  status: AgentStatus;
  notices: AgentNotice[];
  /** What the traveller asked for, with its entry check (shown first when a visa is needed). */
  requested: { destination: Destination; entry: EntryRequirements | null };
  /** Where the package goes: the requested city or a visa-free alternative. */
  destination: Destination;
  entry: EntryRequirements | null;
  recommended: PackageOption;
  alternatives: (PackageOption & { label: (typeof ALTERNATIVE_LABELS)[number] })[];
  why: TrilingualText[];
  smart_tip: {
    kind: (typeof SMART_TIP_KINDS)[number];
    compare_flight_id: string | null;
    delta: FlightDelta | null;
  };
  rejected: WonderOutput["rejected"];
  fx: FxRate;
  prices_captured_at: string;
  total_ms: number;
  cost_usd: number;
};

export type StepPhase = "start" | "progress" | "done" | "error";

/** Server-sent events of POST /api/agent, one JSON object per `data:` line. */
export type AgentStreamEvent =
  | {
      type: "run";
      run_id: string;
      started_at: string;
      fx: FxRate;
      replay: boolean;
      /** Replay only: when the replayed prices were fetched (prices_captured_at). */
      captured_at?: string;
    }
  | {
      type: "step";
      step: AgentStep;
      phase: StepPhase;
      /** City this step works on: changes when the agent looks at an alternative. */
      destination?: string;
      data?: unknown;
    }
  | { type: "log"; event: RunEvent }
  | { type: "offers"; offers: Offer[] }
  | { type: "result"; package: AgentPackage }
  | { type: "saved"; run_id: string; ok: boolean }
  | { type: "error"; code: AgentErrorCode; detail?: string }
  | {
      type: "end";
      total_ms: number;
      /** Spent by this request: always 0 for a replay. */
      cost_usd: number;
      replay: boolean;
      /** Replay only: what the recorded live run measured. */
      recorded?: { total_ms: number; cost_usd: number };
    };

/** One SSE event of a live run with its offset from the run start, as saved for replays. */
export type RecordedFrame = { ms: number; event: AgentStreamEvent };

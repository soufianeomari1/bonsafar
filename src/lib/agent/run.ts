import { z } from "zod";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { serverEnv } from "@/lib/env";
import { callChat } from "@/lib/ai/call";
import type { RunLog } from "@/lib/ai/events";
import { findPlace } from "@/lib/mcp/places";
import { applyFlightRule } from "@/lib/prices/flight-rule";
import { guardModelText, scrubMoney } from "@/lib/prices/guardrail";
import { eurMadRate } from "@/lib/prices/money";
import { PriceStore, type FlightOffer, type Offer } from "@/lib/prices/store";
import { flightDelta, packageTotals, passengerCount, totalStops } from "@/lib/prices/totals";
import { wonderContext, WONDER_SYSTEM_PROMPT } from "./prompt";
import {
  WonderOutputSchema,
  WonderOutputSchemaAr,
  wantsArabic,
  type AgentErrorCode,
  type AgentNotice,
  type AgentPackage,
  type AgentRequestSchema,
  type AgentStatus,
  type AgentStreamEvent,
  type Destination,
  type EntryRequirements,
  type WonderOutput,
} from "./schema";
import { AgentContext, WONDER_TOOLS } from "./tools";

export class AgentError extends Error {
  constructor(
    readonly code: AgentErrorCode,
    detail?: string,
  ) {
    super(detail ?? code);
    this.name = "AgentError";
  }
}

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const WONDER_JSON_SCHEMA = jsonSchema(WonderOutputSchema);
const WONDER_JSON_SCHEMA_AR = jsonSchema(WonderOutputSchemaAr);

const WONDER_EFFORT = "minimal";

/** Wonder turns, repairs included. */
const MAX_TURNS = 6;
/** Below this much time left, Wonder must answer without more tool calls. */
const FINAL_ANSWER_RESERVE_MS = 18_000;

const cityKey = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

type Review = { issues: string[]; output: WonderOutput };

const MONEY_ISSUE = "Remove every price, amount of money and currency";
const VISA_ISSUE = "needs a visa this traveller does not have";

/**
 * Code-side checks Wonder cannot be trusted with: ids exist and belong
 * together, "direct" is really direct, "cheapest" is really cheaper, the
 * package does not go where the traveller needs a visa they lack, and no
 * text carries an amount. Small slips are fixed, real problems are sent back.
 */
function review(raw: WonderOutput, ctx: AgentContext, store: PriceStore, log: RunLog): Review {
  const issues: string[] = [];
  const output: WonderOutput = structuredClone(raw);
  let flight = store.flight(output.recommended.flight_id);
  const hotel = store.hotel(output.recommended.hotel_id);

  if (!flight) issues.push(`recommended.flight_id ${output.recommended.flight_id} is not a flight offer id.`);
  if (!hotel) issues.push(`recommended.hotel_id ${output.recommended.hotel_id} is not a hotel offer id.`);
  if (flight && hotel && cityKey(flight.destination) !== cityKey(hotel.destination)) {
    issues.push("The recommended flight and hotel are not in the same city.");
  }

  if (flight) {
    const chosen = flight;
    const sameCity = store.list().filter(
      (offer): offer is FlightOffer =>
        offer.kind === "flight" && cityKey(offer.destination) === cityKey(chosen.destination),
    );
    const decision = applyFlightRule(chosen.id, sameCity);
    if (decision.changed) {
      output.recommended.flight_id = decision.flightId;
      flight = store.flight(decision.flightId) ?? flight;
      log.add({
        step: "flight_rule",
        model: "code",
        latency_ms: 0,
        status: "ok",
        note: decision.note,
      });
    }
  }

  if (flight) {
    const entry = ctx.entryForCity(flight.destination);
    if (entry?.visa_needed) {
      const visaFree = [...ctx.destinations.values()].some((d) => {
        const other = ctx.entryForCity(d.city);
        return other && !other.visa_needed && cityKey(d.city) !== cityKey(flight.destination);
      });
      issues.push(
        visaFree
          ? `${flight.destination} ${VISA_ISSUE}: build the package in the visa-free city you searched.`
          : `${flight.destination} ${VISA_ISSUE}: search a visa-free alternative city (flights, hotels, entry requirements) and build the package there.`,
      );
    }
  }

  const recTotal =
    flight && hotel ? flight.price_mad + hotel.price_mad : Number.POSITIVE_INFINITY;
  const labels = new Set<string>();
  output.alternatives = output.alternatives.filter((alt) => {
    const f = store.flight(alt.flight_id);
    const h = store.hotel(alt.hotel_id);
    if (!f || !h || labels.has(alt.label)) return false;
    if (flight && cityKey(f.destination) !== cityKey(flight.destination)) return false;
    if (cityKey(f.destination) !== cityKey(h.destination)) return false;
    if (alt.flight_id === output.recommended.flight_id && alt.hotel_id === output.recommended.hotel_id) return false;
    if (alt.label === "direct" && totalStops(f) !== 0) return false;
    if (alt.label === "cheapest" && f.price_mad + h.price_mad >= recTotal) return false;
    labels.add(alt.label);
    return true;
  });

  const tip = output.smart_tip;
  const compare = tip.compare_flight_id ? store.flight(tip.compare_flight_id) : undefined;
  const tipValid =
    tip.kind === "none" ||
    (compare &&
      flight &&
      compare.id !== flight.id &&
      cityKey(compare.destination) === cityKey(flight.destination) &&
      (tip.kind === "direct_upgrade"
        ? totalStops(compare) === 0 && totalStops(flight) > 0
        : compare.price_mad < flight.price_mad));
  if (!tipValid) output.smart_tip = { kind: "none", compare_flight_id: null };
  if (output.smart_tip.kind === "none") output.smart_tip.compare_flight_id = null;

  output.rejected = output.rejected.filter((r) => store.get(r.offer_id));

  const verdict = guardModelText(output.why, log, "wonder package");
  if (!verdict.passed) {
    issues.push(`${MONEY_ISSUE} from the why texts.`);
  }
  return { issues, output };
}

function scrubWhy(output: WonderOutput): WonderOutput {
  return {
    ...output,
    why: output.why.map((w) => ({
      darija: scrubMoney(w.darija, "…"),
      fr: scrubMoney(w.fr, "…"),
      en: scrubMoney(w.en, "…"),
      ...(w.ar ? { ar: scrubMoney(w.ar, "…") } : {}),
    })),
  };
}

export type AgentRunResult = { package: AgentPackage; offers: Offer[] };

export async function runAgent({
  request,
  log,
  emit,
  deadline,
}: {
  request: z.output<typeof AgentRequestSchema>;
  log: RunLog;
  emit: (event: AgentStreamEvent) => void;
  /** performance.now() value by which the run must be done. */
  deadline: number;
}): Promise<AgentRunResult> {
  const started = performance.now();
  const env = serverEnv();
  const { intent, profile, lang, jury } = request;

  const destination = intent.destination;
  if (!destination || !intent.depart_date || !intent.return_date) {
    throw new AgentError("intent_incomplete", "The intent needs a destination and both dates.");
  }
  const origin = intent.origin_iata ?? profile.home_airport;
  if (!origin) throw new AgentError("origin_missing");
  const dated = { ...intent, depart_date: intent.depart_date, return_date: intent.return_date };

  const fx = eurMadRate();
  const store = new PriceStore(fx);
  emit({ type: "run", run_id: log.runId, started_at: new Date().toISOString(), fx, replay: false });

  const ctx = new AgentContext(dated, profile, lang, jury, origin, store, log, emit);
  ctx.prefetch(destination);

  emit({ type: "step", step: "package", phase: "start", destination: destination.city });

  const arabic = wantsArabic(lang);
  const outputSchema: z.ZodType<WonderOutput> = arabic ? WonderOutputSchemaAr : WonderOutputSchema;
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: WONDER_SYSTEM_PROMPT },
    { role: "user", content: wonderContext(dated, profile, origin, arabic) },
  ];

  let final: WonderOutput | null = null;
  let scrubbed = false;
  let repairs = 0;

  for (let turn = 1; turn <= MAX_TURNS && !final; turn += 1) {
    const left = deadline - performance.now();
    if (left < 6_000) throw new AgentError("timeout", "No time left for the planner.");
    const mustAnswer = turn === MAX_TURNS || left < FINAL_ANSWER_RESERVE_MS;

    const { completion, content } = await callChat({
      log,
      step: "agent_plan",
      note: `turn ${turn}${mustAnswer ? ", final answer forced" : ""}`,
      timeoutMs: Math.round(Math.min(30_000, left - 2_000)),
      retries: left > 40_000 ? 1 : 0,
      params: {
        model: env.MODEL_WONDER,
        reasoning_effort: WONDER_EFFORT,
        messages,
        tools: WONDER_TOOLS,
        tool_choice: mustAnswer ? "none" : "auto",
        response_format: {
          type: "json_schema",
          json_schema: { name: "BonSafarPackage", schema: arabic ? WONDER_JSON_SCHEMA_AR : WONDER_JSON_SCHEMA },
        },
        max_completion_tokens: 4000,
        prompt_cache_key: "bonsafar-agent",
      },
    });

    const message = completion.choices[0]?.message;
    const calls = (message?.tool_calls ?? []).flatMap((call) =>
      call.type === "function" ? [call] : [],
    );

    if (calls.length && !mustAnswer) {
      emit({
        type: "step",
        step: "package",
        phase: "progress",
        data: {
          turn,
          tool_calls: calls.map((c) => ({ name: c.function.name, arguments: c.function.arguments })),
        },
      });
      messages.push({ role: "assistant", content: message?.content ?? null, tool_calls: calls });
      const results = await Promise.all(calls.map((c) => ctx.execute(c.function.name, c.function.arguments)));
      calls.forEach((call, index) => {
        messages.push({ role: "tool", tool_call_id: call.id, content: results[index] });
      });
      continue;
    }

    let issues: string[];
    let candidate: WonderOutput | null = null;
    try {
      const parsed = outputSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        const checked = review(parsed.data, ctx, store, log);
        candidate = checked.output;
        issues = checked.issues;
      } else {
        issues = [z.prettifyError(parsed.error).slice(0, 800)];
      }
    } catch {
      issues = ["The answer was not valid JSON."];
    }

    if (candidate && issues.length === 0) {
      final = candidate;
      break;
    }

    if (repairs >= 1 || mustAnswer) {
      // Last chance: a package for a visa city is still shown (status says so),
      // amounts are scrubbed; anything else is a failed run.
      const usable = candidate && issues.every((i) => i.startsWith(MONEY_ISSUE) || i.includes(VISA_ISSUE));
      if (candidate && usable) {
        final = issues.some((i) => i.startsWith(MONEY_ISSUE)) ? scrubWhy(candidate) : candidate;
        scrubbed = final !== candidate;
        break;
      }
      throw new AgentError("agent_invalid_output", issues.join(" ").slice(0, 300));
    }

    repairs += 1;
    emit({ type: "step", step: "package", phase: "progress", data: { turn, repair: issues } });
    messages.push(
      { role: "assistant", content },
      {
        role: "user",
        content: `That answer cannot be used:\n- ${issues.join("\n- ")}\nFix it (call tools if you need more data), then answer with the corrected JSON only.`,
      },
    );
  }

  if (!final) throw new AgentError("agent_invalid_output", "No package after the last turn.");

  await ctx.settle();

  const recFlight = store.flight(final.recommended.flight_id);
  if (!recFlight) throw new AgentError("agent_invalid_output");
  const packageCity = recFlight.destination;
  const requestedEntry = ctx.entryForCity(destination.city);
  const packageEntry: EntryRequirements | null = ctx.entryForCity(packageCity);
  const searched = ctx.destinations.get(cityKey(packageCity));
  const packagePlace = findPlace({ city: packageCity });
  const packageDestination: Destination =
    cityKey(packageCity) === cityKey(destination.city)
      ? destination
      : {
          city: packageCity,
          country: searched?.country ?? packagePlace?.country ?? "",
          iata: searched?.iata || packagePlace?.codes[0] || "",
        };

  const status: AgentStatus = requestedEntry?.visa_needed
    ? packageEntry?.visa_needed
      ? "visa_needed_no_alternative"
      : "visa_alternative"
    : "ok";

  const notices: AgentNotice[] = [];
  if (requestedEntry?.visa_needed) notices.push("visa_needed");
  if (status === "visa_alternative") notices.push("visa_free_alternative");
  if (
    packageEntry?.passport_validity_days != null &&
    (!profile.passport_6m || packageEntry.passport_validity_days > 180)
  ) {
    notices.push("passport_validity_check");
  }
  if (passengerCount(recFlight) !== intent.adults + intent.children) notices.push("passengers_mismatch");
  const recHotel = store.hotel(final.recommended.hotel_id);
  if (recHotel && recHotel.attrs.stars !== ctx.stars) notices.push("hotel_filters_relaxed");
  if (scrubbed) notices.push("guardrail_scrubbed");

  const result: AgentPackage = {
    run_id: log.runId,
    status,
    notices,
    requested: { destination, entry: requestedEntry },
    destination: packageDestination,
    entry: packageEntry,
    recommended: {
      flight_id: final.recommended.flight_id,
      hotel_id: final.recommended.hotel_id,
      totals: packageTotals(store, final.recommended.flight_id, final.recommended.hotel_id),
    },
    alternatives: final.alternatives.map((alt) => ({
      label: alt.label,
      flight_id: alt.flight_id,
      hotel_id: alt.hotel_id,
      totals: packageTotals(store, alt.flight_id, alt.hotel_id),
    })),
    why: final.why,
    smart_tip: {
      ...final.smart_tip,
      delta: final.smart_tip.compare_flight_id
        ? flightDelta(store, final.recommended.flight_id, final.smart_tip.compare_flight_id)
        : null,
    },
    rejected: final.rejected,
    fx,
    prices_captured_at: store.capturedAt() ?? new Date().toISOString(),
    total_ms: Math.round(performance.now() - started),
    cost_usd: log.totalCostUsd(),
  };

  emit({
    type: "step",
    step: "package",
    phase: "done",
    destination: packageDestination.city,
    data: {
      status,
      flight_id: result.recommended.flight_id,
      hotel_id: result.recommended.hotel_id,
      total_mad: result.recommended.totals.total_mad,
      total_display_mad: result.recommended.totals.total_display_mad,
    },
  });

  return { package: result, offers: store.list() };
}

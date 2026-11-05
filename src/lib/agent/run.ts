import { z } from "zod";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { serverEnv } from "@/lib/env";
import { callChat, type CallChatResult } from "@/lib/ai/call";
import type { RunLog } from "@/lib/ai/events";
import { applyFlightRule } from "@/lib/prices/flight-rule";
import { guardModelText, scrubMoney } from "@/lib/prices/guardrail";
import { eurMadRate } from "@/lib/prices/money";
import { PriceStore, type FlightOffer, type Offer } from "@/lib/prices/store";
import { flightDelta, packageTotals, passengerCount, totalStops } from "@/lib/prices/totals";
import { wonderContext, WONDER_SYSTEM_PROMPT } from "./prompt";
import {
  WonderOutputSchema,
  WonderOutputSchemaAr,
  AgentError,
  wantsArabic,
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

export { AgentError } from "./schema";

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const WONDER_JSON_SCHEMA = jsonSchema(WonderOutputSchema);
const WONDER_JSON_SCHEMA_AR = jsonSchema(WonderOutputSchemaAr);

/** Wonder turns, repairs included. */
const MAX_TURNS = 6;
/** Below this much time left, Wonder must answer without more tool calls. */
const FINAL_ANSWER_RESERVE_MS = 18_000;
/** Muse Wonder accepts only tool_choice "auto". This line asks for the package instead. */
const FINAL_ANSWER =
  "N'appelle plus aucun outil. Réponds uniquement avec le forfait final au format attendu.";

function functionCalls(message: { tool_calls?: readonly { type: string }[] } | null | undefined) {
  return (message?.tool_calls ?? []).flatMap((call) => (call.type === "function" ? [call] : []));
}

/** A 400 means this request shape is refused. Anything else is a real failure. */
function rejectedRequest(error: unknown): boolean {
  return error instanceof OpenAI.APIError && error.status === 400;
}

const cityKey = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

type Review = { issues: string[]; output: WonderOutput };

const MONEY_ISSUE = "Remove every price, amount of money and currency";

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

  const wanted = ctx.intent.destination;
  if (flight && wanted && cityKey(flight.destination) !== cityKey(wanted.city)) {
    issues.push(
      `The package must stay in ${wanted.city}. Do not search or recommend another city.`,
    );
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
    if (alt.label === "direct" && (totalStops(f) !== 0 || (flight != null && totalStops(flight) === 0))) return false;
    if (alt.label === "cheapest") {
      const altTotal = f.price_mad + h.price_mad;
      if (altTotal >= recTotal) return false;
      const people = Math.max(
        1,
        (flight?.attrs.passengers.adults ?? 0) + (flight?.attrs.passengers.children ?? 0),
      );
      const minimum = Math.max(recTotal * 0.1, 250 * people);
      if (recTotal - altTotal < minimum) return false;
    }
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

  /** An empty flight search is "no flights", never a generic incomplete package. */
  const failIncomplete = async (detail?: string): Promise<never> => {
    try {
      const offers = await ctx.flightsFor(destination.city, destination.country, destination.iata);
      if (offers.length === 0) throw new AgentError("no_flights", "No flights found for these dates.");
    } catch (error) {
      if (error instanceof AgentError && error.code === "no_flights") throw error;
    }
    throw new AgentError("agent_invalid_output", detail);
  };

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

  const schemaName = arabic ? "BonSafarPackage" : "BonSafarPackage";
  const jsonSchema = arabic ? WONDER_JSON_SCHEMA_AR : WONDER_JSON_SCHEMA;

  /** Last turn: no tools if the API allows it, otherwise tools with tool_choice auto. */
  async function requestPlan(turn: number, mustAnswer: boolean, left: number): Promise<CallChatResult> {
    const timeoutMs = Math.round(Math.min(30_000, left - 2_000));
    const shared = {
      model: env.MODEL_WONDER,
      reasoning_effort: "minimal" as const,
      response_format: {
        type: "json_schema" as const,
        json_schema: { name: schemaName, schema: jsonSchema },
      },
      max_completion_tokens: 4000,
      prompt_cache_key: "bonsafar-agent",
    };

    if (!mustAnswer) {
      return callChat({
        log,
        step: "agent_plan",
        note: `turn ${turn}`,
        timeoutMs,
        retries: left > 40_000 ? 1 : 0,
        params: { ...shared, messages, tools: WONDER_TOOLS, tool_choice: "auto" },
      });
    }

    try {
      const answered = await callChat({
        log,
        step: "agent_plan",
        note: `turn ${turn}, final answer, no tools`,
        timeoutMs,
        retries: 0,
        params: { ...shared, messages },
      });
      if (functionCalls(answered.completion.choices[0]?.message).length === 0) return answered;
    } catch (error) {
      if (!rejectedRequest(error)) throw error;
    }

    const told: ChatCompletionMessageParam[] = [...messages, { role: "system", content: FINAL_ANSWER }];
    const locked = { ...shared, tools: WONDER_TOOLS, tool_choice: "auto" as const };
    let answered = await callChat({
      log,
      step: "agent_plan",
      note: `turn ${turn}, final answer, tool_choice auto`,
      timeoutMs,
      retries: 0,
      params: { ...locked, messages: told },
    });
    if (functionCalls(answered.completion.choices[0]?.message).length > 0) {
      answered = await callChat({
        log,
        step: "agent_plan",
        note: `turn ${turn}, final answer, tool call ignored`,
        timeoutMs,
        retries: 0,
        params: {
          ...locked,
          messages: [...told, { role: "user", content: FINAL_ANSWER }],
        },
      });
      if (functionCalls(answered.completion.choices[0]?.message).length > 0) {
        await failIncomplete("The planner called a tool instead of returning the package.");
      }
    }
    return answered;
  }

  for (let turn = 1; turn <= MAX_TURNS && !final; turn += 1) {
    const left = deadline - performance.now();
    if (left < 6_000) throw new AgentError("timeout", "No time left for the planner.");
    const mustAnswer = turn === MAX_TURNS || left < FINAL_ANSWER_RESERVE_MS;

    const { completion, content } = await requestPlan(turn, mustAnswer, left);

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
      // Last chance: amounts are scrubbed. A package for another city is a failed run.
      const usable = candidate && issues.every((i) => i.startsWith(MONEY_ISSUE));
      if (candidate && usable) {
        final = issues.some((i) => i.startsWith(MONEY_ISSUE)) ? scrubWhy(candidate) : candidate;
        scrubbed = final !== candidate;
        break;
      }
      await failIncomplete(issues.join(" ").slice(0, 300));
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

  if (!final) {
    await failIncomplete("No package after the last turn.");
    throw new AgentError("agent_invalid_output", "No package after the last turn.");
  }

  await ctx.settle();

  const recFlight = store.flight(final.recommended.flight_id);
  if (!recFlight) {
    await failIncomplete();
    throw new AgentError("agent_invalid_output");
  }
  if (cityKey(recFlight.destination) !== cityKey(destination.city)) {
    await failIncomplete("The package left the requested city.");
    throw new AgentError("agent_invalid_output", "The package left the requested city.");
  }
  const requestedEntry = ctx.entryForCity(destination.city);
  const packageEntry: EntryRequirements | null = requestedEntry;
  const packageDestination: Destination = destination;

  const status: AgentStatus = "ok";

  const notices: AgentNotice[] = [];
  if (requestedEntry?.visa_needed) notices.push("visa_needed");
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

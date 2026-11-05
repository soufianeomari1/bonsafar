"use client";

import { AGENT_STEPS, type AgentPackage, type AgentReplayRequest, type AgentRequest, type AgentStep, type AgentStreamEvent, type StepPhase } from "@/lib/agent/schema";
import type { RunEvent } from "@/lib/ai/events";
import { readJury, readLang } from "@/lib/i18n/store";
import type { Intent } from "@/lib/intent/schema";
import type { FxRate } from "@/lib/prices/money";
import type { Offer } from "@/lib/prices/store";
import { profileForLang } from "@/lib/profile/schema";
import { readProfileState } from "@/lib/profile/store";
import { readTrip, registerTripReset } from "@/lib/trip/store";
import { playRecordedRun, type ReplayableRun } from "@/lib/agent/replay-frames";
import type { GuardCode } from "@/lib/jury/copy";
import { parseStreamEvent } from "./parse";

/**
 * One agent run, shared by the flight plan, the result and the package.
 * A copy in sessionStorage survives a refresh. The stream itself does not:
 * a refresh mid-run becomes an error the traveller can retry.
 */

const STORAGE_KEY = "bonsafar.agent-run";

export type RunMeta = {
  run_id: string;
  started_at: string;
  fx: FxRate;
  replay: boolean;
  captured_at?: string;
  /** Browser clock when the run event arrived: a replay's started_at is the recording's. */
  received_at?: number;
};

export type StepState = {
  phase: StepPhase | "pending";
  progress?: unknown;
  done?: unknown;
  error?: unknown;
};

export type Leg = {
  destination: string;
  steps: Record<AgentStep, StepState>;
};

export type AgentEnd = {
  total_ms: number;
  cost_usd: number;
  replay: boolean;
  recorded?: { total_ms: number; cost_usd: number };
};

export type AgentRunError = {
  code:
    | "intent_incomplete"
    | "origin_missing"
    | "timeout"
    | "agent_invalid_output"
    | "no_flights"
    | "agent_failed"
    | "replay_unavailable"
    | "interrupted"
    | GuardCode;
  detail?: string;
};

/** Why a jury live run handed over to its recorded run. */
export type ReplayFallback = "silence" | "error" | "network" | "limit";

export type AgentRunRequest = AgentRequest | AgentReplayRequest;

export type AgentRunSnapshot = {
  status: "idle" | "running" | "done" | "error";
  run: RunMeta | null;
  legs: Leg[];
  offers: Record<string, Offer>;
  events: RunEvent[];
  result: AgentPackage | null;
  error: AgentRunError | null;
  end: AgentEnd | null;
  /** flightId:hotelId of the option opened on the package screen. */
  selectedId: string | null;
  /** Skip the flight-plan animation. The data still arrives at its own pace. */
  skipped: boolean;
  scenario: string | null;
  /** Jury gloss: darija under the English line. */
  showGloss: boolean;
  request: AgentRunRequest | null;
  /** "Good to know" notes by run and language, fetched as soon as the package is in. */
  goodToKnow: Record<string, unknown>;
  /** Set when a jury live run switched to the recorded run of its scenario. */
  fallback: ReplayFallback | null;
  /** The silence that triggered it, for the message. */
  silenceMs: number | null;
};

function emptySteps(): Record<AgentStep, StepState> {
  return {
    flights: { phase: "pending" },
    hotels: { phase: "pending" },
    price_trends: { phase: "pending" },
    entry_requirements: { phase: "pending" },
    package: { phase: "pending" },
  };
}

const EMPTY: AgentRunSnapshot = {
  status: "idle",
  run: null,
  legs: [],
  offers: {},
  events: [],
  result: null,
  error: null,
  end: null,
  selectedId: null,
  skipped: false,
  scenario: null,
  showGloss: true,
  request: null,
  goodToKnow: {},
  fallback: null,
  silenceMs: null,
};

let snapshot: AgentRunSnapshot = EMPTY;
let hydrated = false;
let controller: AbortController | null = null;
let token = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // A full or blocked sessionStorage still leaves the in-memory run usable.
  }
}

function commit(next: AgentRunSnapshot) {
  snapshot = next;
  persist();
  emit();
}

function load(): AgentRunSnapshot {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AgentRunSnapshot;
    if (!parsed || typeof parsed !== "object" || !parsed.status) return EMPTY;
    if (parsed.status === "running") {
      return { ...parsed, status: "error", error: { code: "interrupted" } };
    }
    return { ...EMPTY, ...parsed, showGloss: parsed.showGloss !== false };
  } catch {
    return EMPTY;
  }
}

export function subscribeAgentRun(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readAgentRun(): AgentRunSnapshot {
  return snapshot;
}

/** Loads the session copy after hydration, so the server render and the first client render match. */
export function hydrateAgentRun() {
  if (hydrated) return;
  hydrated = true;
  if (snapshot.status !== "idle") return;
  const stored = load();
  if (stored.status === "idle") return;
  snapshot = stored;
  emit();
}

export function readServerAgentRun(): AgentRunSnapshot {
  return EMPTY;
}

function ensureLeg(legs: Leg[], destination: string): Leg {
  const name = destination.trim();
  const found = legs.find((leg) => leg.destination.toLowerCase() === name.toLowerCase());
  if (found) return found;
  const leg: Leg = { destination: name, steps: emptySteps() };
  legs.push(leg);
  return leg;
}

function applyEvent(draft: AgentRunSnapshot, event: AgentStreamEvent) {
  switch (event.type) {
    case "run":
      draft.run = {
        run_id: event.run_id,
        started_at: event.started_at,
        fx: event.fx,
        replay: event.replay,
        captured_at: event.captured_at,
        received_at: Date.now(),
      };
      break;
    case "step": {
      const first = draft.legs[0];
      const destination = event.destination ?? first?.destination ?? "";
      // A step for another city belongs to another scenario. Never paint it
      // onto the leg already on screen (that is how a Schengen visa result
      // showed up on Istanbul).
      if (first && destination && destination.toLowerCase() !== first.destination.toLowerCase()) break;
      const leg = ensureLeg(draft.legs, destination);
      const step = leg.steps[event.step];
      step.phase = event.phase;
      if (event.phase === "progress") step.progress = event.data;
      if (event.phase === "done") step.done = event.data;
      if (event.phase === "error") step.error = event.data;
      break;
    }
    case "log":
      draft.events = [...draft.events, event.event];
      break;
    case "offers": {
      const offers = { ...draft.offers };
      for (const offer of event.offers) offers[offer.id] = offer;
      draft.offers = offers;
      break;
    }
    case "result":
      draft.result = event.package;
      break;
    case "error":
      draft.status = "error";
      draft.error = { code: event.code, detail: event.detail };
      break;
    case "end":
      draft.end = {
        total_ms: event.total_ms,
        cost_usd: event.cost_usd,
        replay: event.replay,
        recorded: event.recorded,
      };
      if (draft.status === "running") draft.status = draft.result ? "done" : draft.error ? "error" : "done";
      break;
    default:
      break;
  }
}

async function readFrames(
  response: Response,
  onEvent: (event: AgentStreamEvent) => void,
  onChunk?: () => void,
) {
  if (!response.body) throw new Error("Empty response.");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk?.();
    buffer += value;
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue;
      try {
        const event = parseStreamEvent(JSON.parse(data));
        if (event) onEvent(event);
      } catch {
        // A malformed frame is skipped. The next one still counts.
      }
    }
  }
}

/** Set by the /jury phone bridge: the jury label of the run and the silence watchdog. */
export type JuryRunContext = { scenario: string | null; silenceMs: number };

let juryContext: JuryRunContext | null = null;

export function configureJuryRun(context: JuryRunContext | null) {
  juryContext = context;
}

export type RecordedRun = ReplayableRun & { intent: unknown; legacy: boolean; created_at: string };

/** The recorded run of a jury scenario, in one piece (jury cookie required). */
export async function fetchRecordedRun(scenario: string, signal?: AbortSignal): Promise<RecordedRun | null> {
  try {
    const response = await fetch(`/api/jury/replay?scenario=${encodeURIComponent(scenario)}`, {
      cache: "no-store",
      signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as RecordedRun | null;
    return body && Array.isArray(body.stream) && body.stream.length > 1 ? body : null;
  } catch {
    return null;
  }
}

function applyAndCommit(mine: number, event: AgentStreamEvent) {
  if (mine !== token) return;
  const next = structuredClone(snapshot);
  if (mine !== token) return;
  applyEvent(next, event);
  if (mine !== token) return;
  commit(next);
}

function guardCode(body: unknown): GuardCode | null {
  const error = (body as { error?: unknown } | null)?.error;
  return error === "rate_limited" || error === "spend_limit" ? error : null;
}

/** Plays the recorded run in the browser, from the copy fetched when the live run started. */
function playFallback(scenario: string, reason: ReplayFallback, recorded: Promise<RecordedRun | null>) {
  controller?.abort();
  controller = new AbortController();
  const mine = ++token;
  const signal = controller.signal;
  commit({
    ...EMPTY,
    status: "running",
    scenario,
    request: { replay: true, scenario },
    showGloss: snapshot.showGloss,
    fallback: reason,
    silenceMs: juryContext?.silenceMs ?? null,
  });
  void (async () => {
    const run = (await recorded) ?? (await fetchRecordedRun(scenario, signal));
    if (mine !== token) return;
    if (!run) {
      commit({ ...snapshot, status: "error", error: { code: "replay_unavailable" } });
      return;
    }
    await playRecordedRun({ run, emit: (event) => applyAndCommit(mine, event), signal });
  })();
}

/**
 * A jury live run keeps going as long as bytes arrive. A fatal error, a
 * refused request, a dropped connection or `silenceMs` without a byte hands
 * over to the recorded run of the same scenario, marked replay.
 */
export function startAgentRun(input: AgentRunRequest, inputScenario: string | null) {
  hydrated = true;
  controller?.abort();
  controller = new AbortController();
  const mine = ++token;
  const signal = controller.signal;
  const live = !("replay" in input && input.replay === true);
  const jury = live ? juryContext : null;
  const request: AgentRunRequest = jury ? { ...(input as AgentRequest), scenario: jury.scenario } : input;
  const scenario = jury ? jury.scenario : inputScenario;
  commit({
    ...EMPTY,
    status: "running",
    scenario,
    request,
    showGloss: snapshot.showGloss,
  });

  const fallbackScenario = jury?.scenario ?? null;
  // Fetched now, without the run's signal: it must survive the network dropping later.
  const recorded = fallbackScenario ? fetchRecordedRun(fallbackScenario) : null;
  let lastChunk = Date.now();
  let handedOver = false;
  const watchdog =
    jury && fallbackScenario
      ? setInterval(() => {
          if (mine !== token) clearInterval(watchdog);
          else if (Date.now() - lastChunk > jury.silenceMs) handOver("silence");
        }, 500)
      : undefined;
  const handOver = (reason: ReplayFallback): boolean => {
    if (!fallbackScenario || !recorded || handedOver || mine !== token) return false;
    handedOver = true;
    clearInterval(watchdog);
    playFallback(fallbackScenario, reason, recorded);
    return true;
  };

  void (async () => {
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal,
      });
      if (mine !== token) return;
      if (!response.ok || !response.body) {
        const guard = guardCode(await response.json().catch(() => null));
        if (handOver(guard ? "limit" : "error")) return;
        clearInterval(watchdog);
        commit({
          ...snapshot,
          status: "error",
          error: guard ? { code: guard } : { code: "agent_failed", detail: `HTTP ${response.status}` },
        });
        return;
      }
      lastChunk = Date.now();
      await readFrames(
        response,
        (event) => {
          if (mine !== token) return;
          if (event.type === "error" && handOver("error")) return;
          applyAndCommit(mine, event);
        },
        () => {
          lastChunk = Date.now();
        },
      );
      if (mine !== token) return;
      if (snapshot.status === "running" && !snapshot.result && handOver("error")) return;
      clearInterval(watchdog);
      if (snapshot.status === "running") {
        commit({
          ...snapshot,
          status: snapshot.result ? "done" : "error",
          error: snapshot.result ? null : (snapshot.error ?? { code: "agent_failed" }),
        });
      }
    } catch {
      if (signal.aborted || mine !== token) return;
      if (handOver("network")) return;
      clearInterval(watchdog);
      commit({ ...snapshot, status: "error", error: snapshot.error ?? { code: "agent_failed" } });
    }
  })();
}

/** Starts the recorded run of a jury scenario, streamed by the server (Watch replay). */
export function startJuryReplay(scenario: string) {
  startAgentRun({ replay: true, scenario }, scenario);
}

/** Back to no run at all, and no session copy. */
export function resetAgentRun() {
  hydrated = true;
  controller?.abort();
  controller = null;
  token += 1;
  commit({ ...EMPTY, showGloss: snapshot.showGloss });
}

/** Appends measured events from a later call (good to know, poster) to the session log. */
export function appendRunEvents(events: RunEvent[]) {
  if (!events.length || snapshot.status === "idle") return;
  const seen = new Set(snapshot.events.map((event) => eventKey(event)));
  const fresh = events.filter((event) => !seen.has(eventKey(event)));
  if (!fresh.length) return;
  commit({ ...snapshot, events: [...snapshot.events, ...fresh] });
}

function eventKey(event: RunEvent): string {
  return `${event.t}|${event.step}|${event.model}|${event.latency_ms}|${event.note ?? ""}`;
}

export function skipAgentAnimation() {
  if (snapshot.skipped) return;
  commit({ ...snapshot, skipped: true });
}

/** Keeps the "good to know" notes with the run, so screen 08 never waits for them twice. */
export function rememberGoodToKnow(key: string, notes: unknown) {
  if (snapshot.goodToKnow?.[key] === notes) return;
  commit({ ...snapshot, goodToKnow: { ...(snapshot.goodToKnow ?? {}), [key]: notes } });
}

export function selectPackage(id: string) {
  commit({ ...snapshot, selectedId: id });
}

export function setShowGloss(show: boolean) {
  commit({ ...snapshot, showGloss: show });
}

export function scenarioFor(intent: Intent): string | null {
  const city = intent.destination?.city.toLowerCase() ?? "";
  if (city.includes("istanbul")) return "istanbul";
  if (city.includes("paris")) return "paris";
  return null;
}

export function replayFromLocation(): "istanbul" | "paris" | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("replay");
  if (value === "istanbul" || value === "paris") return value;
  return null;
}

/** Keeps ?jury=1 and ?replay= on the trip routes so a refresh stays in the same mode. */
export function withTripSearch(path: string): string {
  if (typeof window === "undefined") return path;
  const params = new URLSearchParams(window.location.search);
  const replay = replayFromLocation() ?? (snapshot.scenario === "istanbul" || snapshot.scenario === "paris" ? snapshot.scenario : null);
  if (replay) params.set("replay", replay);
  if (readJury()) params.set("jury", "1");
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Starts the run the flight-plan page should show, unless one is already going. */
export function ensureAgentRun() {
  if (snapshot.status !== "idle") return;
  const replay = replayFromLocation();
  if (replay) {
    startAgentRun({ replay: true, scenario: replay }, replay);
    return;
  }
  const trip = readTrip();
  if (!trip?.intent || trip.phase !== "ready") return;
  const { profile } = readProfileState();
  const lang = readLang();
  const scenario = scenarioFor(trip.intent);
  startAgentRun(
    { intent: trip.intent, profile: profileForLang(profile, lang), lang, jury: readJury(), scenario },
    scenario,
  );
}

export function retryAgentRun() {
  if (snapshot.request) {
    startAgentRun(snapshot.request, snapshot.scenario);
    return;
  }
  ensureAgentRun();
}

export function replayLastTrip() {
  const scenario =
    snapshot.scenario === "istanbul" || snapshot.scenario === "paris" ? snapshot.scenario : "istanbul";
  startAgentRun({ replay: true, scenario }, scenario);
}

export function activeLegIndex(legs: Leg[]): number {
  let index = 0;
  legs.forEach((leg, i) => {
    if (AGENT_STEPS.some((step) => leg.steps[step].phase !== "pending")) index = i;
  });
  return index;
}

export function activeStep(leg: Leg | undefined): AgentStep {
  if (!leg) return "flights";
  const open = AGENT_STEPS.find((step) => {
    const phase = leg.steps[step].phase;
    return phase !== "done" && phase !== "error";
  });
  return open ?? "package";
}

export function packageOptionId(flightId: string, hotelId: string): string {
  return `${flightId}:${hotelId}`;
}

registerTripReset(() => {
  resetAgentRun();
});

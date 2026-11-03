import { loadLatestRun } from "./runs";
import type { AgentStreamEvent } from "./schema";

/** A replay keeps the recorded gaps between events, compressed to fit this. */
export const REPLAY_MAX_MS = 12_000;
/** Loading the run counts in the budget; this leaves room for the last events. */
const END_MARGIN_MS = 300;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });

/**
 * Re-emits a saved live run event by event: no model and no MCP call. Every
 * run-log event is marked replay, the run event carries the price capture
 * time, and the request itself costs nothing.
 */
export async function replayRun({
  scenario,
  emit,
  signal,
}: {
  scenario: string;
  emit: (event: AgentStreamEvent) => void;
  signal: AbortSignal;
}): Promise<void> {
  const started = performance.now();
  const run = await loadLatestRun(scenario);
  if (!run) {
    emit({ type: "error", code: "replay_unavailable" });
    emit({ type: "end", total_ms: Math.round(performance.now() - started), cost_usd: 0, replay: true });
    return;
  }

  const span = run.stream.at(-1)?.ms ?? 0;
  const budget = Math.max(1_000, REPLAY_MAX_MS - END_MARGIN_MS - (performance.now() - started));
  const scale = span > budget ? budget / span : 1;
  const origin = performance.now();

  for (const frame of run.stream) {
    await sleep(origin + frame.ms * scale - performance.now(), signal);
    if (signal.aborted) return;
    const event = frame.event;
    if (event.type === "run") {
      emit({ ...event, replay: true, captured_at: run.prices_captured_at });
    } else if (event.type === "log") {
      emit({ ...event, event: { ...event.event, replay: true } });
    } else {
      emit(event);
    }
  }

  emit({ type: "saved", run_id: run.id, ok: true });
  emit({
    type: "end",
    total_ms: Math.round(performance.now() - started),
    cost_usd: 0,
    replay: true,
    recorded: { total_ms: run.package.total_ms, cost_usd: run.package.cost_usd },
  });
}

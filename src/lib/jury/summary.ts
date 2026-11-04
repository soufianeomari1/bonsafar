import type { AgentRunSnapshot } from "@/lib/agent-client/store";
import type { RunEvent } from "@/lib/ai/events";

/** The figures of the end card, all read from measured events. */
export type RunSummary = {
  replay: boolean;
  /** Transcription + understanding + agent, as measured server side (recorded figures for a replay). */
  totalMs: number;
  costUsd: number;
  capturedAt: string | null;
  models: { model: string; calls: number }[];
  toolCalls: number;
};

function isModelEvent(event: RunEvent): boolean {
  return event.model !== "code" && event.step !== "price_guardrail" && event.model.toLowerCase().includes("muse");
}

function isToolEvent(event: RunEvent): boolean {
  return event.model !== "code" && event.step !== "price_guardrail" && !isModelEvent(event);
}

export function summarize(run: AgentRunSnapshot, tripEvents: RunEvent[], events: RunEvent[]): RunSummary {
  const replay = !!run.run?.replay;
  // A replay counts the recorded run only, not the live calls of the screens after it.
  const counted = replay ? events.filter((event) => event.replay) : events;
  const counts = new Map<string, number>();
  for (const event of counted) {
    if (!isModelEvent(event) || event.status === "fallback") continue;
    counts.set(event.model, (counts.get(event.model) ?? 0) + 1);
  }
  const models = [...counts].map(([model, calls]) => ({ model, calls })).sort((a, b) => b.calls - a.calls);
  const toolCalls = counted.filter(isToolEvent).length;

  if (replay) {
    return {
      replay,
      totalMs: run.end?.recorded?.total_ms ?? 0,
      costUsd: run.end?.recorded?.cost_usd ?? 0,
      capturedAt: run.run?.captured_at ?? run.result?.prices_captured_at ?? null,
      models,
      toolCalls,
    };
  }

  // The translation runs beside the intent call, so it adds no time.
  const front = (step: string) =>
    tripEvents.filter((event) => event.step.startsWith(step)).reduce((sum, event) => sum + event.latency_ms, 0);
  return {
    replay,
    totalMs: front("transcribe") + front("intent") + (run.end?.total_ms ?? 0),
    costUsd: events.reduce((sum, event) => sum + event.cost_usd, 0),
    capturedAt: run.result?.prices_captured_at ?? null,
    models,
    toolCalls,
  };
}

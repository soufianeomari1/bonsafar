import { juryScenarioByLabel } from "@/lib/jury/scenarios";
import { playRecordedRun } from "./replay-frames";
import { loadLatestRun, type StoredRun } from "./runs";
import type { AgentStreamEvent } from "./schema";

export { REPLAY_MAX_MS } from "./replay-frames";

/**
 * The latest saved run of a scenario. A jury scenario falls back to the older
 * label of the same trip until `npm run record:jury` has recorded it.
 */
export async function loadReplayRun(scenario: string): Promise<(StoredRun & { legacy: boolean }) | null> {
  const run = await loadLatestRun(scenario);
  if (run) return { ...run, legacy: false };
  const legacy = juryScenarioByLabel(scenario)?.legacy;
  if (!legacy) return null;
  const older = await loadLatestRun(legacy);
  return older ? { ...older, legacy: true } : null;
}

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
  const run = await loadReplayRun(scenario);
  if (!run) {
    emit({ type: "error", code: "replay_unavailable" });
    emit({ type: "end", total_ms: Math.round(performance.now() - started), cost_usd: 0, replay: true });
    return;
  }
  await playRecordedRun({ run, emit, signal, started });
}

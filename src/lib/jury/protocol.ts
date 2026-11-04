import type { AgentRunSnapshot } from "@/lib/agent-client/store";
import type { RunEvent } from "@/lib/ai/events";
import { JURY_CHANNEL } from "./flags";

/** Messages between /jury (the board) and the app inside its phone (the bridge). Same origin only. */

export type BoardMessage =
  | { type: "run-live"; scenario: string; audio: string; silenceMs: number }
  | { type: "run-replay"; scenario: string }
  | { type: "own"; silenceMs: number }
  | { type: "reset" }
  | { type: "gloss"; show: boolean };

export type PhoneTrip = {
  phase: "transcribing" | "understanding" | "ready" | "error";
  events: RunEvent[];
  asking: boolean;
  source: "voice" | "text";
};

export type PhoneMessage =
  | { type: "ready" }
  | { type: "state"; path: string; run: AgentRunSnapshot; trip: PhoneTrip | null; autopilot: boolean }
  | { type: "finished"; run_id: string }
  | { type: "failed"; reason: "audio" };

/** GET /api/jury/status: live or replay only, and each scenario's recording. */
export type JuryStatus = {
  live: boolean;
  /** Voice note present in public/jury, by scenario id. */
  audio: Record<string, boolean>;
  replays: Record<string, { captured_at: string; total_ms: number; cost_usd: number; legacy: boolean } | null>;
};

type Envelope<T> = { channel: typeof JURY_CHANNEL; message: T };

export function post<T extends BoardMessage | PhoneMessage>(target: Window | null | undefined, message: T) {
  target?.postMessage({ channel: JURY_CHANNEL, message } satisfies Envelope<T>, window.location.origin);
}

export function read<T>(event: MessageEvent, from: Window | null | undefined): T | null {
  if (event.origin !== window.location.origin || !from || event.source !== from) return null;
  const data = event.data as Partial<Envelope<T>> | null;
  return data && data.channel === JURY_CHANNEL && data.message ? data.message : null;
}

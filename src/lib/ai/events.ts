/**
 * The run log. Every model call, tool call and guardrail check appends one
 * event; the "Under the hood" panel only ever reads these. Values are
 * measured, never estimated. Safe to import on both sides (types only on the
 * client).
 */

export type RunEventStatus = "ok" | "error" | "fallback" | "passed" | "blocked";

export type RunEvent = {
  /** ISO time the step finished. */
  t: string;
  run_id: string;
  /** "transcribe", "intent", "price_guardrail"... */
  step: string;
  /** Model id, or tool name for data tools. */
  model: string;
  latency_ms: number;
  tokens_in: number;
  /** Visible output plus reasoning tokens: both are billed as output. */
  tokens_out: number;
  /** The reasoning share of tokens_out, shown separately. */
  tokens_reasoning: number;
  cost_usd: number;
  /** True when the event comes from a recorded run, never for live calls. */
  replay: boolean;
  status: RunEventStatus;
  /** Short English detail for the log, never a secret or user audio. */
  note?: string;
};

export type RunEventInput = Omit<
  RunEvent,
  "t" | "run_id" | "replay" | "tokens_in" | "tokens_out" | "tokens_reasoning" | "cost_usd" | "status"
> &
  Partial<Pick<RunEvent, "tokens_in" | "tokens_out" | "tokens_reasoning" | "cost_usd" | "status">>;

export class RunLog {
  readonly runId: string;
  private readonly entries: RunEvent[] = [];
  private readonly listeners = new Set<(event: RunEvent) => void>();

  constructor(runId?: string) {
    this.runId = runId && /^[\w-]{1,64}$/.test(runId) ? runId : newRunId();
  }

  add(input: RunEventInput): RunEvent {
    const event: RunEvent = {
      t: new Date().toISOString(),
      run_id: this.runId,
      replay: false,
      tokens_in: 0,
      tokens_out: 0,
      tokens_reasoning: 0,
      cost_usd: 0,
      status: "ok",
      ...input,
    };
    this.entries.push(event);
    for (const listener of this.listeners) listener(event);
    return event;
  }

  onEvent(listener: (event: RunEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  list(): RunEvent[] {
    return [...this.entries];
  }

  totalCostUsd(): number {
    return this.entries.reduce((sum, event) => sum + event.cost_usd, 0);
  }
}

export function newRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

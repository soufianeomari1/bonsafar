import { after } from "next/server";
import { RunLog } from "@/lib/ai/events";
import { replayRun } from "@/lib/agent/replay";
import { AgentError, runAgent } from "@/lib/agent/run";
import { saveRun } from "@/lib/agent/runs";
import {
  AgentReplayRequestSchema,
  AgentRequestSchema,
  type AgentStreamEvent,
  type RecordedFrame,
} from "@/lib/agent/schema";
import { isJuryRequest } from "@/lib/jury/access";
import { JURY_LABELS } from "@/lib/jury/scenarios";
import { admitLiveRun, recordUsage } from "@/lib/usage/guard";
import { RUN_ID_HEADER } from "@/lib/voice/protocol";

export const maxDuration = 60;

/** The run must finish (package and save) a little before maxDuration. */
const RUN_BUDGET_MS = 55_000;

/**
 * An SSE comment on a quiet stream. Model calls can stay silent for more than
 * 15 s, so the jury's silence watchdog only fires when the connection is gone.
 */
const KEEPALIVE_MS = 5_000;

type Emit = (event: AgentStreamEvent) => void;

function sse(produce: (emit: Emit, signal: AbortSignal) => Promise<void>, signal: AbortSignal): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const write = (chunk: string) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          open = false;
        }
      };
      const emit: Emit = (event) => write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      const keepalive = setInterval(() => write(": keepalive\n\n"), KEEPALIVE_MS);
      try {
        await produce(emit, signal);
      } finally {
        clearInterval(keepalive);
        open = false;
        try {
          controller.close();
        } catch {
          // already closed by the client
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * Intent + profile in, server-sent events out: steps (start, progress, done),
 * every run-log event, new offers from the price store, then the package.
 * With `replay: true` and a scenario, the latest saved run of that scenario
 * is streamed again instead, with the same events in the same order.
 * Replays, jury scenario labels and the jury flag need the signed jury cookie.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const jury = await isJuryRequest(request);

  if (body && typeof body === "object" && (body as { replay?: unknown }).replay === true) {
    if (!jury) return Response.json({ error: "forbidden" }, { status: 403 });
    const replay = AgentReplayRequestSchema.safeParse(body);
    if (!replay.success) return Response.json({ error: "invalid_request" }, { status: 400 });
    return sse((emit, signal) => replayRun({ scenario: replay.data.scenario, emit, signal }), request.signal);
  }

  const parsed = AgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  const agentRequest = {
    ...parsed.data,
    jury: parsed.data.jury && jury,
    // Jury labels and the two public demos. Anything else stays unlabelled.
    scenario:
      jury &&
      parsed.data.scenario &&
      (JURY_LABELS.includes(parsed.data.scenario) ||
        parsed.data.scenario === "istanbul" ||
        parsed.data.scenario === "paris")
        ? parsed.data.scenario
        : null,
  };

  const blocked = await admitLiveRun(request, jury);
  if (blocked) {
    return Response.json({ error: blocked }, { status: blocked === "rate_limited" ? 429 : 503 });
  }

  const started = performance.now();
  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  after(() => recordUsage(log.totalCostUsd(), 1));

  return sse(async (send) => {
    const frames: RecordedFrame[] = [];
    const emit: Emit = (event) => {
      frames.push({ ms: Math.round(performance.now() - started), event });
      send(event);
    };
    const unsubscribe = log.onEvent((event) => emit({ type: "log", event }));

    try {
      const result = await runAgent({
        request: agentRequest,
        log,
        emit,
        deadline: started + RUN_BUDGET_MS,
      });
      emit({ type: "result", package: result.package });
      let saved = false;
      const wanted = agentRequest.intent.destination;
      const got = result.package.destination;
      const sameDestination =
        !!wanted &&
        wanted.iata.toUpperCase() === got.iata.toUpperCase() &&
        wanted.city.localeCompare(got.city, "en", { sensitivity: "base" }) === 0;
      try {
        if (!sameDestination) {
          saved = false;
        } else saved = await saveRun({
          id: log.runId,
          scenario: agentRequest.scenario,
          intent: agentRequest.intent,
          events: log.list(),
          offers: result.offers,
          package: result.package,
          stream: frames,
        });
      } catch {
        saved = false;
      }
      send({ type: "saved", run_id: log.runId, ok: saved });
    } catch (error) {
      send({
        type: "error",
        code: error instanceof AgentError ? error.code : "agent_failed",
        detail: error instanceof Error ? error.message.slice(0, 300) : undefined,
      });
    } finally {
      unsubscribe();
      send({
        type: "end",
        total_ms: Math.round(performance.now() - started),
        cost_usd: log.totalCostUsd(),
        replay: false,
      });
    }
  }, request.signal);
}

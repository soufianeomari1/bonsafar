import { RunLog } from "@/lib/ai/events";
import { AgentError, runAgent } from "@/lib/agent/run";
import { saveRun } from "@/lib/agent/runs";
import { AgentRequestSchema, type AgentStreamEvent } from "@/lib/agent/schema";
import { RUN_ID_HEADER } from "@/lib/voice/protocol";

export const maxDuration = 60;

/** The run must finish (package and save) a little before maxDuration. */
const RUN_BUDGET_MS = 55_000;

/**
 * Intent + profile in, server-sent events out: steps (start, progress, done),
 * every run-log event, new offers from the price store, then the package.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = AgentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const started = performance.now();
  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const emit = (event: AgentStreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
        } catch {
          open = false;
        }
      };
      const unsubscribe = log.onEvent((event) => emit({ type: "log", event }));

      try {
        const result = await runAgent({
          request: parsed.data,
          log,
          emit,
          deadline: started + RUN_BUDGET_MS,
        });
        emit({ type: "result", package: result.package });
        let saved = false;
        try {
          saved = await saveRun({
            id: log.runId,
            scenario: parsed.data.scenario,
            intent: parsed.data.intent,
            events: log.list(),
            offers: result.offers,
            package: result.package,
          });
        } catch {
          saved = false;
        }
        emit({ type: "saved", run_id: log.runId, ok: saved });
      } catch (error) {
        emit({
          type: "error",
          code: error instanceof AgentError ? error.code : "agent_failed",
          detail: error instanceof Error ? error.message.slice(0, 300) : undefined,
        });
      } finally {
        unsubscribe();
        emit({
          type: "end",
          total_ms: Math.round(performance.now() - started),
          cost_usd: log.totalCostUsd(),
        });
        open = false;
        controller.close();
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

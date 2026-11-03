import { RunLog } from "@/lib/ai/events";
import { IntentRequestSchema, type IntentResponse } from "@/lib/intent/schema";
import { understand } from "@/lib/intent/understand";
import { RUN_ID_HEADER } from "@/lib/voice/protocol";

export const maxDuration = 60;

/** Transcript + profile in, strict trip intent out (Muse Spark, JSON schema). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = IntentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  try {
    const intent = await understand({ ...parsed.data, log });
    const response: IntentResponse = { intent, run_id: log.runId, events: log.list() };
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Understanding failed.", run_id: log.runId, events: log.list() },
      { status: 502 }
    );
  }
}

import { RunLog } from "@/lib/ai/events";
import { TranslateRequestSchema, type TranslateResponse } from "@/lib/intent/schema";
import { translateTranscript } from "@/lib/intent/translate";
import { RUN_ID_HEADER } from "@/lib/voice/protocol";

export const maxDuration = 30;

/** Transcript in, a short English gloss out (Muse Spark, minimal reasoning). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = TranslateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  try {
    const translation_en = await translateTranscript(parsed.data.transcript, log);
    const response: TranslateResponse = { translation_en, run_id: log.runId, events: log.list() };
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Translation failed.", run_id: log.runId, events: log.list() },
      { status: 502 },
    );
  }
}

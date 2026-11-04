import { after } from "next/server";
import { RunLog } from "@/lib/ai/events";
import { recordUsage } from "@/lib/usage/guard";
import { TranslateRequestSchema, type TranslateResponse } from "@/lib/intent/schema";
import { translateToArabic, translateToDarijaArab, translateTranscript } from "@/lib/intent/translate";
import { RUN_ID_HEADER } from "@/lib/voice/protocol";

export const maxDuration = 30;

/**
 * Text in, a short translation out (Muse Spark, minimal reasoning).
 * target "en" (default): English gloss of a transcript. target "ar": Modern Standard Arabic.
 * target "darija-arab": darija in Arabic letters.
 */
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

  const { transcript, target } = parsed.data;
  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  after(() => recordUsage(log.totalCostUsd()));
  try {
    const translation =
      target === "ar"
        ? await translateToArabic(transcript, log)
        : target === "darija-arab"
          ? await translateToDarijaArab(transcript, log)
          : await translateTranscript(transcript, log);
    const response: TranslateResponse = {
      target,
      translation,
      ...(target === "en" ? { translation_en: translation } : {}),
      run_id: log.runId,
      events: log.list(),
    };
    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Translation failed.", run_id: log.runId, events: log.list() },
      { status: 502 },
    );
  }
}

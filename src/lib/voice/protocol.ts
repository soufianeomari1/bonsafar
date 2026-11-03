import type { RunEvent } from "@/lib/ai/events";

/** Server-sent events of POST /api/transcribe. */
export type TranscribeFinal = {
  text: string;
  latency_ms: number;
  audio_seconds: number;
  cost_usd: number;
  model: string;
  /** True when Muse Spark audio input replaced the realtime transcription. */
  fallback: boolean;
};

export type TranscribeStreamEvent =
  | { event: "partial"; data: { text: string } }
  | { event: "fallback"; data: { reason: string; model: string } }
  | { event: "final"; data: TranscribeFinal }
  | { event: "log"; data: RunEvent }
  | { event: "error"; data: { message: string } };

export const RUN_ID_HEADER = "x-run-id";

export function encodeSse(message: TranscribeStreamEvent): string {
  return `event: ${message.event}\ndata: ${JSON.stringify(message.data)}\n\n`;
}

/** Reads a text/event-stream response body and calls back once per event. */
export async function readSse(
  response: Response,
  onEvent: (message: TranscribeStreamEvent) => void
): Promise<void> {
  if (!response.body) throw new Error("Empty response.");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      let name = "message";
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) name = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (!dataLines.length) continue;
      try {
        onEvent({ event: name, data: JSON.parse(dataLines.join("\n")) } as TranscribeStreamEvent);
      } catch {
        // A malformed block is skipped rather than breaking the whole stream.
      }
    }
  }
}

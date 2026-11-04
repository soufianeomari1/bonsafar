import { after } from "next/server";
import { serverEnv } from "@/lib/env";
import { recordUsage } from "@/lib/usage/guard";
import { RunLog } from "@/lib/ai/events";
import { transcribeCostUsd } from "@/lib/ai/pricing";
import {
  WavError,
  parseWav,
  transcribeRealtime,
  transcribeWithSpark,
} from "@/lib/ai/transcribe";
import {
  RUN_ID_HEADER,
  encodeSse,
  type TranscribeStreamEvent,
} from "@/lib/voice/protocol";

// Node.js is the default runtime; Cache Components forbids the `runtime` export.
export const maxDuration = 60;

/** 60 s of PCM16 mono at 24 kHz is 2.88 MB, plus headers and multipart. */
const MAX_BYTES = 4 * 1024 * 1024;

async function readAudio(request: Request): Promise<Buffer> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new WavError("Audio too long.");

  const type = request.headers.get("content-type") ?? "";
  if (type.startsWith("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("audio");
    if (!(file instanceof Blob)) throw new WavError("Missing the audio field.");
    if (file.size > MAX_BYTES) throw new WavError("Audio too long.");
    return Buffer.from(await file.arrayBuffer());
  }
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > MAX_BYTES) throw new WavError("Audio too long.");
  return body;
}

/**
 * POST a WAV (PCM16 mono, 24 kHz), get back a text/event-stream: partial
 * words as they are recognised, then the final transcript with its measured
 * latency and cost. The audio is never written anywhere.
 */
export async function POST(request: Request) {
  const started = performance.now();
  const log = new RunLog(request.headers.get(RUN_ID_HEADER) ?? undefined);
  after(() => recordUsage(log.totalCostUsd()));

  let env: ReturnType<typeof serverEnv>;
  let wavBuffer: Buffer;
  let wav: ReturnType<typeof parseWav>;
  try {
    env = serverEnv();
    wavBuffer = await readAudio(request);
    wav = parseWav(wavBuffer);
  } catch (error) {
    const message =
      error instanceof WavError ? error.message : "Transcription is not configured.";
    return Response.json({ error: message }, { status: error instanceof WavError ? 400 : 500 });
  }

  if (wav.audioSeconds < 0.3) {
    return Response.json({ error: "Audio too short." }, { status: 400 });
  }
  if (wav.audioSeconds > 61) {
    return Response.json({ error: "Audio too long." }, { status: 413 });
  }

  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort(), { once: true });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (message: TranscribeStreamEvent) => {
        try {
          controller.enqueue(encoder.encode(encodeSse(message)));
        } catch {
          // The browser went away: nothing left to tell it.
        }
      };
      const unsubscribe = log.onEvent((event) => send({ event: "log", data: event }));

      try {
        let text: string;
        let fallback = false;
        let model = env.MODEL_TRANSCRIBE;
        let closed: Promise<void> = Promise.resolve();

        try {
          const session = transcribeRealtime({
            wav,
            signal: abort.signal,
            onPartial: (partial) => send({ event: "partial", data: { text: partial } }),
          });
          closed = session.closed;
          const result = await session.result;
          text = result.text;
          log.add({
            step: "transcribe",
            model,
            latency_ms: Math.round(performance.now() - started),
            cost_usd: transcribeCostUsd(wav.audioSeconds),
            note: `realtime, ${wav.audioSeconds.toFixed(1)} s of audio`,
          });
        } catch (error) {
          if (abort.signal.aborted) throw error;
          const reason = error instanceof Error ? error.message : "Realtime failed.";
          log.add({
            step: "transcribe",
            model,
            latency_ms: Math.round(performance.now() - started),
            status: "fallback",
            note: reason.slice(0, 200),
          });
          fallback = true;
          model = env.MODEL_SPARK_AUDIO;
          send({ event: "fallback", data: { reason, model } });
          text = await transcribeWithSpark({ wavBuffer, log });
        }

        const events = log.list();
        send({
          event: "final",
          data: {
            text,
            latency_ms: Math.round(performance.now() - started),
            audio_seconds: Math.round(wav.audioSeconds * 100) / 100,
            cost_usd: events.reduce((sum, event) => sum + event.cost_usd, 0),
            model,
            fallback,
          },
        });
        await closed;
      } catch {
        send({ event: "error", data: { message: "Transcription failed." } });
      } finally {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed by a disconnect.
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store, no-transform",
      "x-accel-buffering": "no",
    },
  });
}

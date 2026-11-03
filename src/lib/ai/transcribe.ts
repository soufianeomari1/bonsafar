import WebSocket from "ws";
import { serverEnv } from "@/lib/env";
import { callChat } from "./call";
import type { RunLog } from "./events";

/**
 * Muse Voice Transcribe over the realtime WebSocket, server side.
 * Protocol: https://dev.meta.ai/docs/speech-to-text and
 * https://dev.meta.ai/docs/api-reference/voice/realtime (checked 2026-11-03).
 * The audio only ever lives in memory for the length of the request.
 */

export const TRANSCRIBE_KEYWORDS = [
  "Istanbul",
  "Paris",
  "Marrakech",
  "Casablanca",
  "dirham",
  "décembre",
  "janvier",
];

/** Darija is not one of the 25 languages: bias toward its two neighbours. */
export const TRANSCRIBE_LANGUAGE_BIAS = ["Arabic", "French"];

/** The server rejects audio sent more than 5 s ahead of processing. */
const SEND_AHEAD_MS = 4000;
const FRAME_MS = 80;
const HANDSHAKE_TIMEOUT_MS = 8000;
const CLOSE_GRACE_MS = 1500;

export type ParsedWav = {
  pcm: Buffer;
  sampleRate: 16000 | 24000;
  audioSeconds: number;
};

export class WavError extends Error {}

/** Accepts RIFF/WAVE, PCM 16-bit mono, 16 or 24 kHz: what the browser sends. */
export function parseWav(buffer: Buffer): ParsedWav {
  if (
    buffer.length < 44 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  ) {
    throw new WavError("Not a WAV file.");
  }

  let offset = 12;
  let format: { audioFormat: number; channels: number; sampleRate: number; bits: number } | null =
    null;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === "fmt ") {
      format = {
        audioFormat: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        bits: buffer.readUInt16LE(body + 14),
      };
    } else if (id === "data") {
      if (!format) throw new WavError("WAV data before format.");
      if (format.audioFormat !== 1 || format.channels !== 1 || format.bits !== 16) {
        throw new WavError("WAV must be PCM 16-bit mono.");
      }
      if (format.sampleRate !== 16000 && format.sampleRate !== 24000) {
        throw new WavError("WAV must be 16 or 24 kHz.");
      }
      const end = Math.min(buffer.length, body + size);
      const pcm = buffer.subarray(body, end - ((end - body) % 2));
      return {
        pcm,
        sampleRate: format.sampleRate,
        audioSeconds: pcm.length / 2 / format.sampleRate,
      };
    }
    offset = body + size + (size % 2);
  }
  throw new WavError("WAV has no data chunk.");
}

export type RealtimeResult = { text: string; audioProcessedMs: number };

export class RealtimeError extends Error {
  constructor(
    message: string,
    readonly closeCode?: number
  ) {
    super(message);
  }
}

/**
 * Opens one PUSH_TO_TALK session, streams the PCM paced against the server's
 * processing progress, and resolves on the `final: true` transcript. Partials
 * are cumulative: each one replaces the previous.
 */
export function transcribeRealtime({
  wav,
  onPartial,
  signal,
}: {
  wav: ParsedWav;
  onPartial: (text: string) => void;
  signal?: AbortSignal;
}): { result: Promise<RealtimeResult>; closed: Promise<void> } {
  const env = serverEnv();
  const url = new URL(
    "asr/realtime",
    env.META_API_BASE_URL.replace(/^http/, "ws").replace(/\/?$/, "/")
  );
  url.searchParams.set("sessionId", `bonsafar-${crypto.randomUUID()}`);

  const ws = new WebSocket(url, { handshakeTimeout: HANDSHAKE_TIMEOUT_MS });
  const frameBytes = (wav.sampleRate * 2 * FRAME_MS) / 1000;
  const totalTimeoutMs = 15_000 + wav.audioSeconds * 1000;

  let processedMs = 0;
  let settled = false;
  let resolveClosed: () => void = () => {};
  const closed = new Promise<void>((resolve) => {
    resolveClosed = resolve;
  });

  const result = new Promise<RealtimeResult>((resolve, reject) => {
    const fail = (error: RealtimeError) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      clearTimeout(handshakeDeadline);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      }
      reject(error);
    };

    const deadline = setTimeout(
      () => fail(new RealtimeError("Realtime transcription timed out.")),
      totalTimeoutMs
    );
    const handshakeDeadline = setTimeout(
      () => fail(new RealtimeError("No handshake acknowledgement.")),
      HANDSHAKE_TIMEOUT_MS + 2000
    );

    signal?.addEventListener("abort", () => fail(new RealtimeError("Aborted.")), {
      once: true,
    });

    let acknowledged = false;

    const pump = async () => {
      const started = Date.now();
      let sentMs = 0;
      for (let offset = 0; offset < wav.pcm.length; offset += frameBytes) {
        while (!settled && sentMs + FRAME_MS > processedMs + SEND_AHEAD_MS) {
          // Never slower than real time, which the server also rejects.
          if (sentMs + FRAME_MS <= Date.now() - started) break;
          await new Promise((r) => setTimeout(r, 10));
        }
        if (settled || ws.readyState !== WebSocket.OPEN) return;
        ws.send(wav.pcm.subarray(offset, offset + frameBytes));
        sentMs += FRAME_MS;
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "endStream" }));
      }
    };

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          authorization: { accessToken: `Bearer ${env.META_API_KEY}` },
          audioEncoding: wav.sampleRate === 24000 ? "PCM_24KHZ" : "PCM_16KHZ",
          model: env.MODEL_TRANSCRIBE,
          mode: "PUSH_TO_TALK",
          partialMode: "CUMULATIVE",
          emitAudioProgress: true,
          keywords: TRANSCRIBE_KEYWORDS,
          languageBias: TRANSCRIBE_LANGUAGE_BIAS,
        })
      );
    });

    ws.on("message", (data, isBinary) => {
      if (isBinary || settled) return;
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(data.toString());
      } catch {
        return;
      }

      if (!acknowledged) {
        if (typeof event.sessionId === "string" && !("type" in event)) {
          acknowledged = true;
          clearTimeout(handshakeDeadline);
          void pump();
          return;
        }
      }

      if (typeof event.audioProcessedMs === "number") {
        processedMs = Math.max(processedMs, event.audioProcessedMs);
      }

      switch (event.type) {
        case "transcript": {
          const text = typeof event.transcript === "string" ? event.transcript : "";
          if (event.final === true) {
            settled = true;
            clearTimeout(deadline);
            resolve({ text: text.trim(), audioProcessedMs: processedMs });
          } else {
            onPartial(text);
          }
          break;
        }
        case "error":
          fail(
            new RealtimeError(
              typeof event.message === "string" ? event.message : "Realtime error."
            )
          );
          break;
        default:
          // audioProgress, speechStart, speechEnd...: unknown types are ignored.
          break;
      }
    });

    ws.on("error", (error) => fail(new RealtimeError(error.message)));

    ws.on("close", (code, reason) => {
      resolveClosed();
      if (!settled) {
        fail(
          new RealtimeError(
            `Session closed (${code}${reason.length ? `: ${reason.toString()}` : ""}).`,
            code
          )
        );
      }
    });
  });

  // After the final transcript the server closes with 1000. Give it a moment,
  // then close our side so the session never lingers.
  const closedCleanly = result.then(
    () =>
      Promise.race([
        closed,
        new Promise<void>((resolve) =>
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) ws.close(1000);
            resolve();
          }, CLOSE_GRACE_MS)
        ),
      ]),
    () => undefined
  );

  return { result, closed: closedCleanly };
}

/**
 * Plan B when the WebSocket fails: Muse Spark with the WAV as audio input.
 * Meta flags audio input as not fully supported, so quality may be lower.
 */
export async function transcribeWithSpark({
  wavBuffer,
  log,
}: {
  wavBuffer: Buffer;
  log: RunLog;
}): Promise<string> {
  const env = serverEnv();
  const { content } = await callChat({
    log,
    step: "transcribe_fallback",
    note: "Spark audio input, reduced quality",
    timeoutMs: 30_000,
    params: {
      model: env.MODEL_SPARK_AUDIO,
      // "minimal" repeated phrases in our tests; "low" did not.
      reasoning_effort: "low",
      messages: [
        {
          role: "system",
          content:
            "Transcribe the voice note verbatim. The speaker may mix Moroccan darija, French, Arabic and English: keep every word in the language it was spoken. Output only the transcript, with no quotes and no comment.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_audio",
              input_audio: { data: wavBuffer.toString("base64"), format: "wav" },
            },
          ],
        },
      ],
    },
  });
  return content.trim();
}

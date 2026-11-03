"use client";

import type { RunEvent } from "@/lib/ai/events";
import type { IntentRequest, IntentResponse } from "@/lib/intent/schema";
import {
  RUN_ID_HEADER,
  readSse,
  type TranscribeFinal,
  type TranscribeStreamEvent,
} from "./protocol";

export class VoiceApiError extends Error {
  constructor(
    message: string,
    readonly events: RunEvent[] = []
  ) {
    super(message);
  }
}

/** Streams the WAV to /api/transcribe; partial words arrive through onEvent. */
export async function transcribeWav(
  wav: Blob,
  runId: string,
  onEvent: (event: TranscribeStreamEvent) => void,
  signal?: AbortSignal
): Promise<TranscribeFinal> {
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "content-type": "audio/wav", [RUN_ID_HEADER]: runId },
    body: wav,
    signal,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new VoiceApiError(body?.error ?? `Transcription failed (${response.status}).`);
  }

  let final: TranscribeFinal | null = null;
  let failure: string | null = null;
  const events: RunEvent[] = [];
  await readSse(response, (message) => {
    if (message.event === "final") final = message.data;
    if (message.event === "error") failure = message.data.message;
    if (message.event === "log") events.push(message.data);
    onEvent(message);
  });
  if (final) return final;
  throw new VoiceApiError(failure ?? "Transcription ended without a result.", events);
}

export async function fetchIntent(
  request: IntentRequest,
  runId: string,
  signal?: AbortSignal
): Promise<IntentResponse> {
  const response = await fetch("/api/intent", {
    method: "POST",
    headers: { "content-type": "application/json", [RUN_ID_HEADER]: runId },
    body: JSON.stringify(request),
    signal,
  });
  const body = (await response.json().catch(() => null)) as
    | (IntentResponse & { error?: string })
    | null;
  if (!response.ok || !body?.intent) {
    throw new VoiceApiError(body?.error ?? `Understanding failed (${response.status}).`, body?.events ?? []);
  }
  return body;
}

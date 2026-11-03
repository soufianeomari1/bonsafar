"use client";

import { newRunId, type RunEvent } from "@/lib/ai/events";
import { nightsBetween } from "@/lib/format";
import { readJury, readLang } from "@/lib/i18n/store";
import {
  dismissAnsweredQuestion,
  fieldsTouched,
  locksFor,
  mergeIntent,
  type UserEdit,
} from "@/lib/intent/edits";
import type { Intent, QuestionField } from "@/lib/intent/schema";
import { readProfileState } from "@/lib/profile/store";
import { fetchIntent, transcribeWav, VoiceApiError } from "@/lib/voice/client";
import type { TranscribeFinal } from "@/lib/voice/protocol";
import { toWav24k } from "@/lib/voice/wav";

/**
 * The trip being understood, shared by the home, vocal and understood
 * screens. The voice take stays in memory as a blob URL for the player and
 * is dropped with the next trip: it is never uploaded anywhere but the
 * transcription route, and never stored.
 */

export type TripPhase = "transcribing" | "understanding" | "ready" | "error";
export type TripError = "short" | "empty" | "transcribe" | "understand";

export type TripAnswer = { question: string; answer: string };

export type TripJob = {
  id: number;
  runId: string;
  source: "voice" | "text";
  audioUrl: string | null;
  durationMs: number;
  /** Voice levels sampled while recording, for the bubble waveform. */
  levels: number[];
  partial: string;
  transcript: string;
  transcription: TranscribeFinal | null;
  phase: TripPhase;
  intent: Intent | null;
  /** Chips changed by hand. A later model answer must not overwrite them. */
  userEdited: UserEdit[];
  /** Bumped on each model answer, not on hand edits: drives the A2 flight. */
  rev: number;
  answers: TripAnswer[];
  events: RunEvent[];
  error: TripError | null;
  /** Kept so "retry" can redo the step that failed. */
  wav: Blob | null;
};

let job: TripJob | null = null;
let controller: AbortController | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function set(patch: Partial<TripJob>, id: number) {
  if (!job || job.id !== id) return;
  job = { ...job, ...patch };
  for (const listener of listeners) listener();
}

export function subscribeToTrip(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readTrip(): TripJob | null {
  return job;
}

export function readServerTrip(): TripJob | null {
  return null;
}

function begin(fields: Pick<TripJob, "source" | "audioUrl" | "durationMs" | "levels" | "transcript" | "phase" | "wav">): TripJob {
  controller?.abort();
  controller = new AbortController();
  if (job?.audioUrl) URL.revokeObjectURL(job.audioUrl);
  job = {
    id: nextId++,
    runId: newRunId(),
    partial: "",
    transcription: null,
    intent: null,
    userEdited: [],
    rev: 0,
    answers: [],
    events: [],
    error: null,
    ...fields,
  };
  for (const listener of listeners) listener();
  return job;
}

async function understandJob(id: number, unlock?: QuestionField) {
  const current = job;
  if (!current || current.id !== id || !controller) return;
  set({ phase: "understanding", error: null }, id);
  const { profile } = readProfileState();
  const requested = unlock ? current.userEdited.filter((field) => field !== unlock) : current.userEdited;
  try {
    const response = await fetchIntent(
      {
        transcript: current.transcript,
        profile,
        lang: readLang(),
        jury: readJury(),
        answers: current.answers,
        locked: current.intent ? locksFor(current.intent, requested) : undefined,
      },
      current.runId,
      controller.signal
    );
    const latest = job;
    if (!latest || latest.id !== id) return;
    const edited = unlock ? latest.userEdited.filter((field) => field !== unlock) : latest.userEdited;
    const intent = latest.intent ? mergeIntent(response.intent, latest.intent, edited) : response.intent;
    const userEdited =
      unlock && (unlock !== "destination" || intent.destination)
        ? [...new Set<UserEdit>([...latest.userEdited, unlock])]
        : latest.userEdited;
    set(
      {
        phase: "ready",
        intent,
        userEdited,
        rev: latest.rev + 1,
        events: [...latest.events, ...response.events],
      },
      id,
    );
  } catch (error) {
    if (controller?.signal.aborted) return;
    const events = error instanceof VoiceApiError ? error.events : [];
    set({ phase: "error", error: "understand", events: [...(job?.events ?? []), ...events] }, id);
  }
}

async function transcribeJob(id: number) {
  const current = job;
  if (!current?.wav || current.id !== id || !controller) return;
  set({ phase: "transcribing", error: null, partial: "" }, id);
  try {
    const final = await transcribeWav(
      current.wav,
      current.runId,
      (message) => {
        if (message.event === "partial") set({ partial: message.data.text }, id);
        if (message.event === "log") set({ events: [...(job?.events ?? []), message.data] }, id);
      },
      controller.signal
    );
    const text = final.text.trim();
    if (!text) {
      set({ phase: "error", error: "empty", transcription: final }, id);
      return;
    }
    set({ transcription: final, transcript: text, partial: text, wav: null }, id);
    await understandJob(id);
  } catch (error) {
    if (controller?.signal.aborted) return;
    const short = error instanceof VoiceApiError && /too short/i.test(error.message);
    set({ phase: "error", error: short ? "short" : "transcribe" }, id);
  }
}

/** A recorded take: convert to WAV 24 kHz, transcribe, then understand. */
export async function startVoiceTrip(take: Blob, durationMs: number, levels: number[]): Promise<void> {
  const created = begin({
    source: "voice",
    audioUrl: URL.createObjectURL(take),
    durationMs,
    levels,
    transcript: "",
    phase: "transcribing",
    wav: null,
  });
  try {
    const { wav } = await toWav24k(take);
    set({ wav }, created.id);
  } catch {
    set({ phase: "error", error: "transcribe" }, created.id);
    return;
  }
  await transcribeJob(created.id);
}

/** Typed request or idea card: straight to understanding. */
export async function startTextTrip(text: string): Promise<void> {
  const created = begin({
    source: "text",
    audioUrl: null,
    durationMs: 0,
    levels: [],
    transcript: text.trim(),
    phase: "understanding",
    wav: null,
  });
  await understandJob(created.id);
}

/**
 * Answer to the one question, or a city typed in the destination chip.
 * `unlock` is a fact this call is allowed to replace (the new city); every
 * other hand edit stays locked.
 */
export async function answerTrip(
  question: string,
  answer: string,
  unlock?: QuestionField,
): Promise<void> {
  if (!job) return;
  const answers = [...job.answers, { question, answer }].slice(-3);
  set({ answers }, job.id);
  await understandJob(job.id, unlock);
}

export async function retryTrip(): Promise<void> {
  if (!job) return;
  if (!job.transcript && job.wav) await transcribeJob(job.id);
  else if (job.transcript) await understandJob(job.id);
}

/** Edits made by hand on a chip. Nights always follow the dates, and the edit wins over the model. */
export function patchIntent(patch: Partial<Intent>): void {
  if (!job?.intent) return;
  const next = { ...job.intent, ...patch };
  next.nights =
    next.depart_date && next.return_date
      ? Math.max(1, nightsBetween(next.depart_date, next.return_date))
      : null;
  const userEdited = [...new Set<UserEdit>([...job.userEdited, ...fieldsTouched(patch)])];
  set({ intent: dismissAnsweredQuestion(next, userEdited), userEdited }, job.id);
}

export function clearTrip(): void {
  controller?.abort();
  if (job?.audioUrl) URL.revokeObjectURL(job.audioUrl);
  job = null;
  for (const listener of listeners) listener();
}

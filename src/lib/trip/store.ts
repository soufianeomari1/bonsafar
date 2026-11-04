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
import { profileForLang } from "@/lib/profile/schema";
import { readProfileState } from "@/lib/profile/store";
import { fillBudgetMarker } from "@/lib/intent/budget-marker";
import { fetchIntent, fetchTranslate, transcribeWav, VoiceApiError } from "@/lib/voice/client";
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
  /** Schengen city the traveller chose to keep after a no-visa request. */
  visaKeptCity: string | null;
  answers: TripAnswer[];
  events: RunEvent[];
  error: TripError | null;
  /** Kept so "retry" can redo the step that failed. */
  wav: Blob | null;
};

let job: TripJob | null = null;
let controller: AbortController | null = null;
let nextId = 1;
/**
 * Bumped on every new departure. An in-flight transcribe, intent or
 * translation from the previous scenario must not land on the next one.
 */
let epoch = 0;
/** Translation that arrived before the intent. Applied when the intent lands. */
let heldTranslation: { id: number; text: string } | null = null;
const listeners = new Set<() => void>();
/** Agent run and any other client cache that must die with the trip. Profile is not one of them. */
let onReset: (() => void) | null = null;

export function registerTripReset(hook: () => void) {
  onReset = hook;
}

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

function notify() {
  for (const listener of listeners) listener();
}

/**
 * Drops the trip in memory: intent, wishes, visa choice, quick replies,
 * transcript and the in-flight request. The profile is left as it is.
 */
function dropSession() {
  epoch += 1;
  controller?.abort();
  controller = null;
  heldTranslation = null;
  if (job?.audioUrl) URL.revokeObjectURL(job.audioUrl);
  job = null;
  notify();
  onReset?.();
}

function begin(fields: Pick<TripJob, "source" | "audioUrl" | "durationMs" | "levels" | "transcript" | "phase" | "wav">): TripJob {
  dropSession();
  controller = new AbortController();
  job = {
    id: nextId++,
    runId: newRunId(),
    partial: "",
    transcription: null,
    intent: null,
    userEdited: [],
    rev: 0,
    visaKeptCity: null,
    answers: [],
    events: [],
    error: null,
    ...fields,
  };
  notify();
  return job;
}

function currentEpoch(): number {
  return epoch;
}

function applyTranslation(id: number, started: number, text: string, events: RunEvent[]) {
  const latest = job;
  if (started !== currentEpoch() || !latest || latest.id !== id || !text) return;
  if (!latest.intent) {
    heldTranslation = { id, text };
    if (events.length) set({ events: [...latest.events, ...events] }, id);
    return;
  }
  set(
    {
      intent: { ...latest.intent, translation_en: fillBudgetMarker(text, latest.intent.budget_mad) },
      events: events.length ? [...latest.events, ...events] : latest.events,
    },
    id,
  );
}

async function understandJob(id: number, unlock?: QuestionField) {
  const started = currentEpoch();
  const current = job;
  if (started !== currentEpoch() || !current || current.id !== id || !controller) return;
  set({ phase: "understanding", error: null }, id);
  const { profile } = readProfileState();
  // A follow-up may lock chips. A new departure never sends the previous scenario.
  const followUp = current.answers.length > 0 || current.userEdited.length > 0;
  const requested = unlock ? current.userEdited.filter((field) => field !== unlock) : current.userEdited;
  const signal = controller.signal;
  // The chips wait only for the intent. The English gloss fills in when it arrives.
  const translate =
    current.intent?.translation_en
      ? null
      : fetchTranslate(current.transcript, current.runId, signal)
          .then((response) => applyTranslation(id, started, response.translation, response.events))
          .catch((error: unknown) => {
            if (signal.aborted || started !== currentEpoch()) return;
            const events = error instanceof VoiceApiError ? error.events : [];
            if (events.length && job?.id === id) set({ events: [...job.events, ...events] }, id);
          });

  const lang = readLang();
  try {
    const response = await fetchIntent(
      {
        transcript: current.transcript,
        profile: profileForLang(profile, lang),
        lang,
        jury: readJury(),
        answers: followUp ? current.answers : [],
        locked: followUp && current.intent ? locksFor(current.intent, requested) : undefined,
      },
      current.runId,
      signal,
    );
    const latest = job;
    if (started !== currentEpoch() || !latest || latest.id !== id) return;
    const edited = unlock ? latest.userEdited.filter((field) => field !== unlock) : latest.userEdited;
    const carryEdits = followUp || latest.userEdited.length > 0;
    let intent = response.intent;
    if (carryEdits && latest.intent) intent = mergeIntent(response.intent, latest.intent, edited);
    const carried = carryEdits
      ? latest.intent?.translation_en || (heldTranslation?.id === id ? heldTranslation.text : "")
      : heldTranslation?.id === id
        ? heldTranslation.text
        : "";
    if (carried) intent = { ...intent, translation_en: fillBudgetMarker(carried, intent.budget_mad) };
    if (heldTranslation?.id === id) heldTranslation = null;
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
    if (signal.aborted || started !== currentEpoch()) return;
    const events = error instanceof VoiceApiError ? error.events : [];
    set({ phase: "error", error: "understand", events: [...(job?.events ?? []), ...events] }, id);
  }
  await translate;
}

async function transcribeJob(id: number) {
  const started = currentEpoch();
  const current = job;
  if (started !== currentEpoch() || !current?.wav || current.id !== id || !controller) return;
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
    if (started !== currentEpoch()) return;
    const text = final.text.trim();
    if (!text) {
      set({ phase: "error", error: "empty", transcription: final }, id);
      return;
    }
    set({ transcription: final, transcript: text, partial: text, wav: null }, id);
    await understandJob(id);
  } catch (error) {
    if (controller?.signal.aborted || started !== currentEpoch()) return;
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
  const started = currentEpoch();
  try {
    const { wav } = await toWav24k(take);
    if (started !== currentEpoch()) return;
    set({ wav }, created.id);
  } catch {
    if (started !== currentEpoch()) return;
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

/** The intent saved with a recorded run, shown as is: no model call. */
export function loadRecordedTrip(intent: Intent): void {
  begin({
    source: "text",
    audioUrl: null,
    durationMs: 0,
    levels: [],
    transcript: intent.translation_en,
    phase: "ready",
    wav: null,
  });
  if (job) set({ intent, rev: 1 }, job.id);
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
  const id = job.id;
  const started = currentEpoch();
  const answers = [...job.answers, { question, answer }].slice(-3);
  set({ answers }, id);
  if (started !== currentEpoch()) return;
  await understandJob(id, unlock);
}

export async function retryTrip(): Promise<void> {
  if (!job) return;
  if (!job.transcript && job.wav) await transcribeJob(job.id);
  else if (job.transcript) await understandJob(job.id);
}

/** Accept a Schengen city after a no-visa request. The usual visa warning still applies later. */
export function keepVisaDestination(city: string): void {
  if (!job || !city.trim()) return;
  set({ visaKeptCity: city }, job.id);
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
  dropSession();
}

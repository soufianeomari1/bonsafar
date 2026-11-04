"use client";

import { appendRunEvents } from "@/lib/agent-client/store";
import type { RunEvent } from "@/lib/ai/events";

/** Pre-generated once by `npm run poster:fallback`. */
export const ISTANBUL_FALLBACK = "/posters/istanbul-fallback.webp";

export type PosterStatus = "idle" | "loading" | "live" | "fallback" | "error";

export type PosterSnapshot = {
  runId: string | null;
  status: PosterStatus;
  /** Data URL of the live image, or the static fallback path. */
  url: string | null;
  fallback: boolean;
};

const EMPTY: PosterSnapshot = { runId: null, status: "idle", url: null, fallback: false };

let snapshot: PosterSnapshot = EMPTY;
const listeners = new Set<() => void>();
const started = new Set<string>();

function emit(next: PosterSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribePoster(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readPoster(): PosterSnapshot {
  return snapshot;
}

export function readServerPoster(): PosterSnapshot {
  return EMPTY;
}

type PosterResponse =
  | { ok: true; media_type: string; b64: string; url: string | null; events: RunEvent[] }
  | { ok: false; events?: RunEvent[] };

type CachedPoster = { url: string; events?: RunEvent[] };

function remember(runId: string, url: string, events: RunEvent[]) {
  try {
    sessionStorage.setItem(`bonsafar.poster.${runId}`, JSON.stringify({ url, events }));
  } catch {
    // A large image stays in memory for this view.
  }
}

function recall(runId: string): CachedPoster | null {
  try {
    const raw = sessionStorage.getItem(`bonsafar.poster.${runId}`);
    if (!raw) return null;
    if (raw.startsWith("data:") || raw.startsWith("/") || raw.startsWith("http")) return { url: raw };
    const parsed = JSON.parse(raw) as CachedPoster;
    return parsed?.url ? parsed : null;
  } catch {
    return null;
  }
}

export type PosterRequest = {
  runId: string;
  city: string;
  country: string;
  /** Istanbul past 20s, or a failed Istanbul call, shows the pre-generated picture. */
  istanbul: boolean;
};

/**
 * Starts the illustration once per run. Safe to call from the ready screen
 * and again from the poster screen: the second call joins the first.
 */
export function ensurePoster(input: PosterRequest) {
  const cached = recall(input.runId);
  if (cached && snapshot.runId !== input.runId) {
    if (cached.events?.length) appendRunEvents(cached.events);
    emit({ runId: input.runId, status: "live", url: cached.url, fallback: false });
    started.add(input.runId);
    return;
  }
  if (started.has(input.runId)) return;
  started.add(input.runId);
  emit({ runId: input.runId, status: "loading", url: null, fallback: false });

  void (async () => {
    let showedFallback = false;
    const slow = window.setTimeout(() => {
      if (!input.istanbul || snapshot.runId !== input.runId || snapshot.status !== "loading") return;
      showedFallback = true;
      emit({ runId: input.runId, status: "fallback", url: ISTANBUL_FALLBACK, fallback: true });
    }, 20_000);

    try {
      const response = await fetch("/api/poster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ run_id: input.runId, city: input.city, country: input.country }),
        signal: AbortSignal.timeout(55_000),
      });
      window.clearTimeout(slow);
      const payload = (await response.json()) as PosterResponse;
      if (payload.events?.length) appendRunEvents(payload.events);
      if (!response.ok || !payload.ok) {
        emit(input.istanbul ? fallbackOf(input.runId) : { runId: input.runId, status: "error", url: null, fallback: false });
        return;
      }
      const url = payload.url ?? `data:${payload.media_type};base64,${payload.b64}`;
      remember(input.runId, url, payload.events ?? []);
      if (showedFallback && input.istanbul) return;
      emit({ runId: input.runId, status: "live", url, fallback: false });
    } catch {
      window.clearTimeout(slow);
      emit(input.istanbul ? fallbackOf(input.runId) : { runId: input.runId, status: "error", url: null, fallback: false });
    }
  })();
}

function fallbackOf(runId: string): PosterSnapshot {
  return { runId, status: "fallback", url: ISTANBUL_FALLBACK, fallback: true };
}

/** Paris (and any non-Istanbul city) can try the live image again. */
export function retryPoster(input: PosterRequest) {
  started.delete(input.runId);
  ensurePoster(input);
}

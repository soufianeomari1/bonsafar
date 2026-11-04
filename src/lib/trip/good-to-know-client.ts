"use client";

import { appendRunEvents } from "@/lib/agent-client/store";
import type { RunEvent } from "@/lib/ai/events";
import type { Lang } from "@/lib/i18n";

export type GoodToKnowLine = { darija: string; fr: string; en: string; ar?: string };
export type GoodToKnowNotes = {
  timezone: GoodToKnowLine;
  plugs: GoodToKnowLine;
  currency: GoodToKnowLine;
  weather: GoodToKnowLine;
};

const CACHE = "bonsafar.good-to-know";

type Payload = { ok: true; notes: GoodToKnowNotes; events: RunEvent[] } | { ok: false; events?: RunEvent[] };

const inflight = new Map<string, Promise<GoodToKnowNotes | null>>();

/** Arabic notes are a separate call: the other languages share one. */
function cacheKey(runId: string, lang: Lang): string {
  return lang === "ar" ? `${CACHE}.${runId}.ar` : `${CACHE}.${runId}`;
}

type CachedNotes = { notes: GoodToKnowNotes; events?: RunEvent[] };

function readCache(key: string): CachedNotes | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      timezone?: GoodToKnowLine;
      weather?: GoodToKnowLine;
      plugs?: GoodToKnowLine;
      currency?: GoodToKnowLine;
      notes?: GoodToKnowNotes;
      events?: RunEvent[];
    };
    const notes: GoodToKnowNotes | undefined = parsed.notes?.timezone
      ? parsed.notes
      : parsed.timezone && parsed.weather && parsed.plugs && parsed.currency
        ? { timezone: parsed.timezone, plugs: parsed.plugs, currency: parsed.currency, weather: parsed.weather }
        : undefined;
    if (!notes?.timezone?.fr || !notes.weather?.en) return null;
    return { notes, events: parsed.events };
  } catch {
    return null;
  }
}

export type GoodToKnowInput = {
  runId: string;
  city: string;
  country: string;
  origin: string;
  month: string;
  script: "latn" | "arab";
  lang: Lang;
};

/** One Spark call per run. A refresh reads the note back and does not pay again. */
export function loadGoodToKnow(input: GoodToKnowInput): Promise<GoodToKnowNotes | null> {
  const key = cacheKey(input.runId, input.lang);
  const cached = readCache(key);
  if (cached) {
    if (cached.events?.length) appendRunEvents(cached.events);
    return Promise.resolve(cached.notes);
  }
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    try {
      const response = await fetch("/api/good-to-know", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          run_id: input.runId,
          city: input.city,
          country: input.country,
          origin: input.origin,
          month: input.month,
          script: input.script,
          lang: input.lang,
        }),
      });
      const payload = (await response.json()) as Payload;
      if (payload.events?.length) appendRunEvents(payload.events);
      if (!response.ok || !payload.ok) return null;
      try {
        sessionStorage.setItem(key, JSON.stringify({ notes: payload.notes, events: payload.events ?? [] }));
      } catch {
        // The note still shows for this view.
      }
      return payload.notes;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, job);
  return job;
}

"use client";

import { useEffect } from "react";
import { appendRunEvents, rememberGoodToKnow, type AgentRunSnapshot } from "@/lib/agent-client/store";
import type { RunEvent } from "@/lib/ai/events";
import { airportCity } from "@/lib/airports";
import { formatTravelMonth } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { scriptForLang, type Profile } from "@/lib/profile/schema";
import { asFlight, asHotel, pickOption } from "./selection";

export type GoodToKnowLine = { darija: string; fr: string; en: string; ar?: string };
export type GoodToKnowNotes = {
  timezone: GoodToKnowLine;
  plugs: GoodToKnowLine;
  currency: GoodToKnowLine;
  weather: GoodToKnowLine;
};

const CACHE = "bonsafar.good-to-know.v3";

type Payload = { ok: true; notes: GoodToKnowNotes; events: RunEvent[] } | { ok: false; events?: RunEvent[] };

const inflight = new Map<string, Promise<GoodToKnowNotes | null>>();

/** Arabic notes are a separate call: the other languages share one. */
export function cacheKey(runId: string, lang: Lang): string {
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
  originIata: string;
  destinationIata: string;
  departDate: string;
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
    rememberGoodToKnow(key, cached.notes);
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
          origin_iata: input.originIata,
          destination_iata: input.destinationIata,
          depart_date: input.departDate,
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
      rememberGoodToKnow(key, payload.notes);
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

/** Notes already in the run state or the session: screen 08 shows them on its first frame. */
export function peekGoodToKnow(run: AgentRunSnapshot, lang: Lang): GoodToKnowNotes | null {
  const runId = run.run?.run_id;
  if (!runId) return null;
  const key = cacheKey(runId, lang);
  const inRun = run.goodToKnow?.[key] as GoodToKnowNotes | undefined;
  if (inRun?.timezone) return inRun;
  return typeof window === "undefined" ? null : (readCache(key)?.notes ?? null);
}

function monthLabel(iso: string, lang: Lang): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return formatTravelMonth(iso, lang);
}

/** What /api/good-to-know needs for the chosen package of this run. */
export function goodToKnowInput(run: AgentRunSnapshot, profile: Profile, lang: Lang): GoodToKnowInput | null {
  const result = run.result;
  const runId = run.run?.run_id;
  if (!result || !runId) return null;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;
  const depart = hotel?.attrs.arrival ?? flight?.attrs.outbound.departure.slice(0, 10) ?? "";
  const originIata = (flight?.attrs.outbound.from ?? "").toUpperCase();
  const destinationIata = (flight?.attrs.outbound.to || result.destination.iata).toUpperCase();
  if (!depart || !/^[A-Z]{3}$/.test(originIata) || !/^[A-Z]{3}$/.test(destinationIata)) return null;
  return {
    runId,
    city: result.destination.city,
    country: result.destination.country,
    origin: airportCity(originIata) ?? originIata,
    originIata,
    destinationIata,
    departDate: depart,
    month: monthLabel(depart, lang),
    script: scriptForLang(lang, profile.darija_script),
    lang,
  };
}

/**
 * Starts "good to know" in the background as soon as the package is in
 * (screens 06 and 07), so screen 08 does not wait 11 to 15 seconds.
 */
export function usePrefetchGoodToKnow(run: AgentRunSnapshot, profile: Profile, lang: Lang) {
  const input = goodToKnowInput(run, profile, lang);
  const key = input
    ? `${input.runId}|${input.originIata}|${input.destinationIata}|${input.departDate}|${input.script}|${input.lang}`
    : "";
  useEffect(() => {
    if (!input) return;
    void loadGoodToKnow(input);
    // The key holds every field of the input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

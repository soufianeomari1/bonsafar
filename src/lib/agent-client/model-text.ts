"use client";

import { useEffect, useSyncExternalStore } from "react";
import { newRunId } from "@/lib/ai/events";
import type { Lang } from "@/lib/i18n";
import type { TranslateTarget } from "@/lib/intent/schema";
import { fetchTranslate, VoiceApiError } from "@/lib/voice/client";
import { appendRunEvents } from "./store";

/** A line written by a model in every language the interface may need. */
export type ModelLine = { darija: string; fr: string; en: string; ar?: string };

/** fr→fr, en→en, ar→ar, both darija interfaces→darija. */
export function modelLangFor(lang: Lang): keyof ModelLine {
  if (lang === "fr" || lang === "en" || lang === "ar") return lang;
  return "darija";
}

/** The line in the interface language, or null when an Arabic line is still missing. */
export function pickModelText(line: ModelLine, lang: Lang): string | null {
  const key = modelLangFor(lang);
  return line[key]?.trim() || null;
}

/**
 * Replays carry what the recorded run wrote: no "ar" line, and darija in the
 * script of the recorded profile. Those lines are translated from English.
 */
function missingTarget(line: ModelLine, lang: Lang): Extract<TranslateTarget, "ar" | "darija-arab"> | null {
  if (lang === "ar" && !line.ar?.trim()) return "ar";
  if (lang === "darija-arab" && !hasArabic(line.darija)) return "darija-arab";
  return null;
}

const CACHE = "bonsafar";
const RETRY_MS = 1200;
const memory = new Map<string, string>();
const failed = new Set<string>();
const inflight = new Set<string>();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

function storageKey(target: TranslateTarget, source: string): string {
  return `${CACHE}.${target}.${hash(source)}`;
}

function cached(key: string): string | null {
  const hit = memory.get(key);
  if (hit) return hit;
  try {
    const stored = sessionStorage.getItem(key);
    if (stored) memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

function snapshot(key: string): string {
  if (failed.has(key)) return "failed";
  return cached(key) ?? "";
}

/** One Spark translation per line, retried once, kept for the session. */
function requestTranslation(target: TranslateTarget, source: string, runId: string | null) {
  const key = storageKey(target, source);
  if (inflight.has(key) || failed.has(key) || cached(key)) return;
  inflight.add(key);
  const attempt = (retry: boolean): Promise<void> =>
    fetchTranslate(source, runId ?? newRunId(), undefined, target)
      .then((response) => {
        appendRunEvents(response.events);
        memory.set(key, response.translation);
        try {
          sessionStorage.setItem(key, response.translation);
        } catch {
          // The translation still shows for this view.
        }
      })
      .catch(async (error: unknown) => {
        if (error instanceof VoiceApiError) appendRunEvents(error.events);
        if (!retry) {
          failed.add(key);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
        await attempt(false);
      });
  void attempt(true).finally(() => {
    inflight.delete(key);
    emit();
  });
}

export type ModelTextState = {
  text: string;
  /** Waiting for a translation: show a skeleton. */
  pending: boolean;
  /** The text is written in Arabic letters. */
  arabic: boolean;
};

/**
 * The model line to show for this interface. A line missing in the interface
 * language or script asks /api/translate for it; if that fails, the Arabic
 * interface shows the English line and darija in Arabic letters shows the
 * darija line as recorded.
 */
export function useModelText(line: ModelLine | null | undefined, lang: Lang, runId: string | null = null): ModelTextState {
  const target = line ? missingTarget(line, lang) : null;
  const source = target && line ? line.en : "";
  const key = target && source ? storageKey(target, source) : "";
  const translated = useSyncExternalStore(
    subscribe,
    () => (key ? snapshot(key) : ""),
    () => "",
  );

  useEffect(() => {
    if (target && source) requestTranslation(target, source, runId);
  }, [target, source, runId]);

  if (!line) return { text: "", pending: false, arabic: false };
  if (!target || !source) {
    const text = pickModelText(line, lang) ?? line.en;
    return { text, pending: false, arabic: (lang === "ar" || lang === "darija-arab") && hasArabic(text) };
  }
  if (translated && translated !== "failed") return { text: translated, pending: false, arabic: true };
  if (translated === "failed") {
    const text = target === "ar" ? line.en : line.darija;
    return { text, pending: false, arabic: hasArabic(text) };
  }
  return { text: "", pending: true, arabic: true };
}

const ARABIC_LETTERS = /[\u0600-\u06FF]/;

export function hasArabic(text: string): boolean {
  return ARABIC_LETTERS.test(text);
}

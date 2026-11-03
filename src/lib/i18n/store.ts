import { DEFAULT_LANG, JURY_LANG, isLang, type Lang } from "./index";

/**
 * The chosen language as an external store, so components can read it with
 * useSyncExternalStore instead of syncing state inside an effect.
 *
 * It lives in localStorage until the Supabase profile takes over.
 */

export const LANG_STORAGE_KEY = "bonsafar.lang";

let langCache: Lang | null = null;
let juryCache: boolean | null = null;

const listeners = new Set<() => void>();

function detectJury(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("jury") === "1";
}

function detectLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  if (readJury()) return JURY_LANG;
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage blocked: fall back to the default.
  }
  return DEFAULT_LANG;
}

/** `?jury=1`: English UI and bilingual agent messages. */
export function readJury(): boolean {
  if (juryCache === null) juryCache = detectJury();
  return juryCache;
}

export function readLang(): Lang {
  if (langCache === null) langCache = detectLang();
  return langCache;
}

export function readServerLang(): Lang {
  return DEFAULT_LANG;
}

export function readServerJury(): boolean {
  return false;
}

export function subscribeToLang(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeLang(next: Lang): void {
  if (langCache === next) return;
  langCache = next;
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
  for (const listener of listeners) listener();
}

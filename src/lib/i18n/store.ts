import { JURY_UI_COOKIE } from "@/lib/jury/flags";
import { DEFAULT_LANG, JURY_LANG, isLang, type Lang } from "./index";
import { langFromQuery } from "./query";

/**
 * The chosen language as an external store, so components can read it with
 * useSyncExternalStore instead of syncing state inside an effect.
 *
 * Priority: jury mode, then `?lang=`, then localStorage, then French.
 * It lives in localStorage until the Supabase profile takes over.
 */

export const LANG_STORAGE_KEY = "bonsafar.lang";

let langCache: Lang | null = null;
let juryCache: boolean | null = null;

const listeners = new Set<() => void>();

/** The proxy keeps this flag in step with the signed, httpOnly jury cookie. */
export function readJuryAccess(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => part.trim() === `${JURY_UI_COOKIE}=1`);
}

/** `?jury=1` does nothing without jury access. */
function detectJury(): boolean {
  if (typeof window === "undefined") return false;
  return readJuryAccess() && new URLSearchParams(window.location.search).get("jury") === "1";
}

let embeddedCache: boolean | null = null;

/** The app running inside the phone frame of /jury. */
export function readJuryEmbedded(): boolean {
  if (embeddedCache !== null) return embeddedCache;
  if (typeof window === "undefined") return false;
  let embedded = false;
  try {
    embedded = readJury() && window.self !== window.top && window.parent.location.pathname === "/jury";
  } catch {
    embedded = false;
  }
  embeddedCache = embedded;
  return embedded;
}

export function readServerJuryEmbedded(): boolean {
  return false;
}

function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Storage blocked: the choice lasts for this page load only.
  }
}

function detectLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  if (readJury()) return JURY_LANG;
  const fromQuery = langFromQuery(new URLSearchParams(window.location.search).get("lang"));
  if (fromQuery) {
    rememberLang(fromQuery);
    return fromQuery;
  }
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage blocked: fall back to the default.
  }
  return DEFAULT_LANG;
}

/** `?jury=1` with jury access: English UI and bilingual agent messages. */
export function readJury(): boolean {
  if (juryCache === null) juryCache = detectJury();
  return juryCache;
}

export function readLang(): Lang {
  if (langCache === null) langCache = detectLang();
  return langCache;
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

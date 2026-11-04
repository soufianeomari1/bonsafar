"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setHapticsEnabled } from "@/lib/haptics";
import { FATIMA } from "@/lib/agent/scenarios";
import { readJury, readJuryEmbedded, readLang, writeLang } from "@/lib/i18n/store";
import {
  DEFAULT_PROFILE,
  PROFILE_COLUMNS,
  parseProfile,
  profileForLang,
  type Prefs,
  type Profile,
} from "./schema";

/**
 * The traveller profile as an external store shared by every screen.
 * Signed in: the Supabase `profiles` row (RLS: owner only). Signed out: the
 * same object in localStorage. At sign-in, a finished local profile is
 * copied to Supabase, then removed from the phone.
 */

export const PROFILE_STORAGE_KEY = "bonsafar.profile";

export type ProfileUser = {
  id: string;
  email: string | null;
  /** Google profile photo, as Google sent it at sign-in. No extra scope. */
  avatar: string | null;
  created_at: string | null;
};

export type ProfileState = {
  status: "loading" | "ready";
  profile: Profile;
  user: ProfileUser | null;
};

export type ProfilePatch = Partial<Omit<Profile, "prefs">> & { prefs?: Partial<Prefs> };

const SERVER_STATE: ProfileState = {
  status: "loading",
  profile: DEFAULT_PROFILE,
  user: null,
};

let state: ProfileState = SERVER_STATE;
let started = false;
let supabase: SupabaseClient | null = null;
const listeners = new Set<() => void>();

function setState(next: ProfileState) {
  state = next;
  for (const listener of listeners) listener();
}

function readLocal(): Profile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? parseProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeLocal(profile: Profile | null) {
  try {
    if (profile) window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    else window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Storage blocked: the profile lives for this session only.
  }
}

function columns(profile: Profile) {
  return Object.fromEntries(PROFILE_COLUMNS.map((key) => [key, profile[key]]));
}

/** The profile drives the UI language and the vibrations, except in jury mode. */
function applySideEffects(profile: Profile) {
  setHapticsEnabled(profile.haptics);
  if (profile.prefs.onboarded && !readJury()) writeLang(profile.ui_lang);
}

async function syncWithAccount() {
  const local = readLocal();
  const fallback = local ?? { ...DEFAULT_PROFILE, ui_lang: readLang() };

  if (!supabase) {
    setState({ status: "ready", profile: fallback, user: null });
    applySideEffects(fallback);
    return;
  }

  const { data } = await supabase.auth.getUser();
  const authUser = data.user;
  if (!authUser) {
    setState({ status: "ready", profile: fallback, user: null });
    applySideEffects(fallback);
    return;
  }

  const meta = authUser.user_metadata ?? {};
  const avatar = (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined) ?? null;
  const user: ProfileUser = {
    id: authUser.id,
    email: authUser.email ?? null,
    avatar: avatar && /^https:\/\//.test(avatar) ? avatar : null,
    created_at: authUser.created_at ?? null,
  };
  const { data: row } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  const metadataName =
    (authUser.user_metadata?.given_name as string | undefined) ??
    (authUser.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    null;
  const remote = parseProfile(row ?? {});
  const firstName = remote.first_name ?? metadataName;

  let profile: Profile;
  if (local && local.prefs.onboarded && !remote.prefs.onboarded) {
    profile = { ...local, first_name: firstName };
    await supabase.from("profiles").upsert({ id: authUser.id, ...columns(profile) });
  } else if (!row) {
    profile = { ...(local ?? fallback), first_name: firstName };
    await supabase.from("profiles").upsert({ id: authUser.id, ...columns(profile) });
  } else {
    profile = { ...remote, first_name: firstName };
  }
  writeLocal(null);

  setState({ status: "ready", profile, user });
  applySideEffects(profile);
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  if (readJuryEmbedded()) {
    // The judges play Fatima: in memory only, the visitor's own profile is never touched.
    setState({ status: "ready", profile: FATIMA, user: null });
    applySideEffects(FATIMA);
    return;
  }
  try {
    supabase = createClient();
  } catch {
    supabase = null; // Env not configured: local profile only.
  }

  void syncWithAccount().catch(() => {
    const profile = readLocal() ?? DEFAULT_PROFILE;
    setState({ status: "ready", profile, user: null });
  });

  supabase?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" && !state.user) {
      // Defer: Supabase forbids awaiting its own calls inside this callback.
      setTimeout(() => void syncWithAccount(), 0);
    } else if (event === "SIGNED_OUT") {
      setState({ status: "ready", profile: { ...DEFAULT_PROFILE, ui_lang: readLang() }, user: null });
    }
  });
}

export function subscribeToProfile(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readProfileState(): ProfileState {
  return state;
}

export function readServerProfileState(): ProfileState {
  return SERVER_STATE;
}

export async function updateProfile(patch: ProfilePatch): Promise<void> {
  const current = state.profile;
  const merged = parseProfile({
    ...current,
    ...patch,
    prefs: { ...current.prefs, ...patch.prefs },
  });
  const next = patch.ui_lang ? profileForLang(merged, patch.ui_lang) : merged;
  setState({ ...state, profile: next });

  if (patch.ui_lang && !readJury()) writeLang(next.ui_lang);
  if (patch.haptics !== undefined) setHapticsEnabled(next.haptics);

  if (readJuryEmbedded()) return;
  if (state.user && supabase) {
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: state.user.id, ...columns(next) });
    if (error) writeLocal(next);
  } else {
    writeLocal(next);
  }
}

export async function signInWithGoogle(next: string): Promise<string | null> {
  if (!supabase) return "unavailable";
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  return error ? error.message : null;
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

/** Every BonSafar key on this phone, for the export and for "Delete everything". */
export function localKeys(): string[] {
  try {
    return Object.keys(window.localStorage).filter((key) => key.startsWith("bonsafar."));
  } catch {
    return [];
  }
}

/** All the traveller's data: the account rows when signed in, and what this phone keeps. */
export async function exportData(): Promise<Record<string, unknown>> {
  const local: Record<string, unknown> = {};
  for (const key of localKeys()) {
    const raw = window.localStorage.getItem(key);
    try {
      local[key] = raw ? JSON.parse(raw) : raw;
    } catch {
      local[key] = raw;
    }
  }
  const out: Record<string, unknown> = { exported_at: new Date().toISOString(), on_this_phone: local };
  if (supabase && state.user) {
    const [profile, trips, alerts] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", state.user.id).maybeSingle(),
      supabase.from("trips").select("*").order("created_at", { ascending: false }),
      supabase.from("price_alerts").select("*"),
    ]);
    out.account = {
      email: state.user.email,
      created_at: state.user.created_at,
      profile: profile.data,
      trips: trips.data ?? [],
      price_alerts: alerts.data ?? [],
    };
  }
  return out;
}

/**
 * Deletes the account (server route, cascade on profile, trips and alerts)
 * when signed in, then every BonSafar key on this phone.
 */
export async function deleteEverything(): Promise<boolean> {
  if (state.user) {
    const response = await fetch("/api/account/delete", { method: "POST" });
    if (!response.ok) return false;
    await supabase?.auth.signOut();
  }
  for (const key of localKeys()) window.localStorage.removeItem(key);
  try {
    window.sessionStorage.clear();
  } catch {
    // Nothing more to clear.
  }
  setState({ status: "ready", profile: { ...DEFAULT_PROFILE, ui_lang: readLang() }, user: null });
  return true;
}

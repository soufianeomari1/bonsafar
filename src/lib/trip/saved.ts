"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentPackage } from "@/lib/agent/schema";
import type { FlightOffer, HotelOffer } from "@/lib/prices/store";
import type { PackageTotals } from "@/lib/prices/totals";
import type { FxRate } from "@/lib/prices/money";
import { createClient } from "@/lib/supabase/client";

/**
 * A finished trip. Prices are the store's numbers, frozen with their source
 * and capture time. Signed in: the `trips` row (RLS, owner only). Signed out:
 * the same object in localStorage, migrated after Google sign-in.
 */

const STORAGE_KEY = "bonsafar.saved-trips";

export type FrozenPackage = {
  destination: AgentPackage["destination"];
  origin_iata: string;
  origin_city: string;
  flight: FlightOffer;
  hotel: HotelOffer;
  totals: PackageTotals;
  fx: FxRate;
  prices_captured_at: string;
  entry: AgentPackage["entry"];
  ready_ok: number;
};

export type FrozenTrip = {
  id: string;
  run_id: string;
  created_at: string;
  transcript: string | null;
  intent: unknown;
  package: FrozenPackage;
  status: "ready";
  poster_url: string | null;
  synced_id: string | null;
};

type SaveState = {
  trips: FrozenTrip[];
  /** True once localStorage has been read. */
  ready: boolean;
};

const SERVER: SaveState = { trips: [], ready: false };
let state: SaveState = SERVER;
let supabase: SupabaseClient | null | undefined;
let listening = false;
const listeners = new Set<() => void>();

function emit(next: SaveState) {
  state = next;
  for (const listener of listeners) listener();
}

function db(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;
  try {
    supabase = createClient();
  } catch {
    supabase = null;
  }
  return supabase;
}

function readLocal(): FrozenTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FrozenTrip[];
    return Array.isArray(parsed) ? parsed.filter((trip) => trip?.run_id && trip.package?.totals) : [];
  } catch {
    return [];
  }
}

function writeLocal(trips: FrozenTrip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // The trip still lives in memory for this view.
  }
}

function replace(runId: string, patch: Partial<FrozenTrip>) {
  const trips = state.trips.map((trip) => (trip.run_id === runId ? { ...trip, ...patch } : trip));
  writeLocal(trips);
  emit({ ...state, trips });
}

async function pushOne(trip: FrozenTrip) {
  const client = db();
  if (!client || trip.synced_id) return;
  const { data } = await client.auth.getUser();
  const user = data.user;
  if (!user) return;
  const { data: row, error } = await client
    .from("trips")
    .insert({
      user_id: user.id,
      transcript: trip.transcript,
      intent: trip.intent,
      package: trip.package,
      status: trip.status,
      poster_url: trip.poster_url,
    })
    .select("id")
    .single();
  if (error || !row?.id) return;
  replace(trip.run_id, { synced_id: String(row.id) });
}

/** Copies phone-only trips into the account, then keeps the account list. */
export async function syncTrips() {
  const client = db();
  if (!client) return;
  const { data } = await client.auth.getUser();
  if (!data.user) return;
  const pending = state.trips.filter((trip) => !trip.synced_id);
  for (const trip of pending) await pushOne(trip);
  const { data: rows } = await client
    .from("trips")
    .select("id, transcript, intent, package, status, poster_url, created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!rows?.length) return;
  const known = new Set(state.trips.map((trip) => trip.synced_id).filter(Boolean));
  const extra: FrozenTrip[] = [];
  for (const row of rows) {
    if (known.has(row.id)) continue;
    const pack = row.package as FrozenPackage | null;
    if (!pack?.totals || !pack.flight || !pack.hotel) continue;
    extra.push({
      id: row.id,
      run_id: `account-${row.id}`,
      created_at: row.created_at,
      transcript: row.transcript,
      intent: row.intent,
      package: pack,
      status: "ready",
      poster_url: row.poster_url,
      synced_id: row.id,
    });
  }
  if (!extra.length) return;
  const trips = [...extra, ...state.trips];
  writeLocal(trips);
  emit({ trips, ready: true });
}

export function startTripSync() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  emit({ trips: readLocal(), ready: true });
  const client = db();
  void syncTrips();
  client?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") setTimeout(() => void syncTrips(), 0);
  });
}

export function subscribeSavedTrips(listener: () => void): () => void {
  startTripSync();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readSavedTrips(): SaveState {
  return state;
}

export function readServerSavedTrips(): SaveState {
  return SERVER;
}

/** Remembers the trip once per run. A signed-in traveller also gets the row. */
export async function rememberTrip(draft: Omit<FrozenTrip, "id" | "created_at" | "synced_id">): Promise<void> {
  if (typeof window === "undefined") return;
  if (!state.ready) emit({ trips: readLocal(), ready: true });
  const existing = state.trips.find((trip) => trip.run_id === draft.run_id);
  if (existing) {
    if (draft.poster_url && draft.poster_url !== existing.poster_url) replace(draft.run_id, { poster_url: draft.poster_url });
    if (!existing.synced_id) await pushOne({ ...existing, ...draft, poster_url: draft.poster_url ?? existing.poster_url });
    return;
  }
  const trip: FrozenTrip = {
    ...draft,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    synced_id: null,
  };
  const trips = [trip, ...state.trips].slice(0, 20);
  writeLocal(trips);
  emit({ trips, ready: true });
  await pushOne(trip);
}

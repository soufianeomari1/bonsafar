"use client";

import type { Partner } from "./saved";

/**
 * When the traveller opens Kiwi.com or trivago from screen 09, we note where
 * they went and when. Coming back to the tab (or opening the app later) asks
 * "So, is it booked?". Phone only: nothing about the partner visit leaves it.
 */

const KEY = "bonsafar.partner-departure";
/** A visit shorter than this is a mis-tap, not a booking attempt. */
const MIN_AWAY_MS = 4_000;
/** After a week the question no longer makes sense. */
const MAX_AWAY_MS = 7 * 24 * 3_600_000;

export type Departure = { partner: Partner; run_id: string; at: string };

export function recordDeparture(partner: Partner, runId: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ partner, run_id: runId, at: new Date().toISOString() }));
  } catch {
    // Storage blocked: no question on return.
  }
}

/** The pending visit, once the traveller has been away long enough. */
export function readDeparture(now = Date.now()): Departure | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Departure;
    const away = now - Date.parse(value.at);
    if (!value.run_id || (value.partner !== "kiwi.com" && value.partner !== "trivago")) return null;
    if (away > MAX_AWAY_MS) {
      clearDeparture();
      return null;
    }
    return away >= MIN_AWAY_MS ? value : null;
  } catch {
    return null;
  }
}

export function clearDeparture(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

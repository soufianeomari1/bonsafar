"use client";

/**
 * The 8 haptic patterns of docs/parcours-et-interfaces.md section 4.
 *
 * Every call also emits a DOM event so <HapticRing> can pulse: on iPhone and on
 * desktop `navigator.vibrate` does not exist, and the ring is what the demo
 * video shows instead.
 */

export const HAPTIC_PATTERNS = {
  /** Button or chip pressed, voice note sent, card flipped. */
  tap: 8,
  /** Answer to a question, profile choice, "take the direct flight". */
  select: 12,
  /** Microphone pressed. */
  start: 20,
  /** Voice note locked. */
  lock: [10, 40, 10],
  /** Voice note cancelled. */
  cancel: [25, 50, 25],
  /** Each stop of the flight plan, each "ok" tile, end of a split-flap. */
  tick: 6,
  /** Package landed, stamp dropped, profile finished. */
  success: [15, 70, 30],
  /** Microphone refused, network failure. */
  warn: [40, 60, 40],
} as const satisfies Record<string, number | number[]>;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

export const HAPTIC_EVENT = "bonsafar:haptic";

export type HapticEventDetail = {
  pattern: HapticPattern;
  /** False when the device has no vibration motor: only the ring shows. */
  vibrated: boolean;
};

const STORAGE_KEY = "bonsafar.haptics";
const MIN_INTERVAL_MS = 1000;

let enabled = true;
let flightPlan = false;
let lastFiredAt = 0;
let restored = false;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function restore() {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    enabled = window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Storage blocked: keep the default.
  }
}

export function areHapticsEnabled(): boolean {
  restore();
  return enabled;
}

export function setHapticsEnabled(next: boolean): void {
  restored = true;
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts for this session only.
  }
  notify();
}

/**
 * The flight plan fires one `tick` per stop in quick succession, which is the
 * one place where the "max one vibration per second" rule does not apply.
 */
export function setFlightPlanMode(next: boolean): void {
  flightPlan = next;
}

export function subscribeToHapticsSetting(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Fires a pattern, unless haptics are off or the throttle window is still open. */
export function haptic(pattern: HapticPattern): void {
  if (typeof window === "undefined") return;
  restore();
  if (!enabled) return;

  const now = Date.now();
  if (!flightPlan && now - lastFiredAt < MIN_INTERVAL_MS) return;
  lastFiredAt = now;

  let vibrated = false;
  // Before the first tap Chrome blocks the call and logs an error.
  const activated = navigator.userActivation?.hasBeenActive ?? true;
  if (canVibrate() && activated) {
    try {
      vibrated = navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch {
      vibrated = false;
    }
  }

  window.dispatchEvent(
    new CustomEvent<HapticEventDetail>(HAPTIC_EVENT, {
      detail: { pattern, vibrated },
    })
  );
}

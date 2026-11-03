"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { haptic } from "@/lib/haptics";
import {
  MAX_RECORDING_MS,
  RecorderError,
  VoiceRecorder,
  type RecorderErrorKind,
} from "@/lib/voice/recorder";

export type CaptureState =
  | { status: "idle" }
  | {
      status: "recording";
      locked: boolean;
      paused: boolean;
      /** Finger offset while holding, for the slide hints. */
      dragX: number;
      dragY: number;
      elapsedMs: number;
      /** One level per 100 ms, newest last. */
      bars: number[];
    };

export type CaptureError = RecorderErrorKind | "short";

/** Events of the press itself, for the /dev/voice log. */
export type PointerTrace = {
  type: "down" | "up" | "cancel" | "leave" | "capture";
  pointerId: number;
  note?: string;
};

/** WhatsApp gesture thresholds, in CSS pixels. */
const CANCEL_PX = 110;
const LOCK_PX = 90;
/** A press shorter than this is a tap: recording continues, locked. */
const TAP_MS = 350;
/**
 * Too-short takes are judged on captured audio (VoiceRecorder.elapsedMs),
 * which starts when the microphone opens, not when the finger went down.
 */
const MIN_TAKE_MS = 700;
const TICK_MS = 100;

type Gesture = {
  down: boolean;
  x: number;
  y: number;
  at: number;
  /** A real pointerup (or the keyboard). A pointercancel is never this. */
  released: boolean;
  /** The browser took the pointer (scroll, callout, permission sheet). */
  interrupted: boolean;
  rtl: boolean;
  pointerId: number;
  target: HTMLElement | null;
};

/**
 * Inline, because the CSS pipeline drops -webkit-touch-callout and
 * -webkit-user-select. Chrome Android needs both or a long press becomes a callout.
 */
export const micHoldStyle: CSSProperties = {
  touchAction: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
};

const MIC_HOLD_CSS = `.bs-mic-hold{touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}`;

/** The compiled stylesheet strips the WebKit properties, so the page adds them itself. */
function ensureMicHoldCss(): void {
  if (document.getElementById("bs-mic-hold-css")) return;
  const style = document.createElement("style");
  style.id = "bs-mic-hold-css";
  style.textContent = MIC_HOLD_CSS;
  document.head.appendChild(style);
}

/**
 * Stops the Android long-press callout. React's onTouchStart is passive, so
 * preventDefault there is ignored: this listener is not.
 */
export function bindMicHold(node: HTMLElement | null): void | (() => void) {
  if (!node) return;
  ensureMicHoldCss();
  node.style.setProperty("touch-action", "none");
  node.style.setProperty("user-select", "none");
  node.style.setProperty("-webkit-user-select", "none");
  node.style.setProperty("-webkit-touch-callout", "none");
  node.style.setProperty("-webkit-tap-highlight-color", "transparent");
  const blockTouch = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
  };
  const blockMenu = (event: Event) => event.preventDefault();
  node.addEventListener("touchstart", blockTouch, { passive: false });
  node.addEventListener("contextmenu", blockMenu);
  return () => {
    node.removeEventListener("touchstart", blockTouch);
    node.removeEventListener("contextmenu", blockMenu);
  };
}

/**
 * Press-and-hold voice capture (screen 3): slide left to cancel, slide up to
 * lock, release to send, 60 s maximum. Haptics: start, lock, cancel.
 */
export function useVoiceCapture({
  onTake,
  onError,
  onPointer,
}: {
  onTake: (take: Blob, durationMs: number, levels: number[]) => void;
  onError: (error: CaptureError) => void;
  onPointer?: (event: PointerTrace) => void;
}) {
  const [capture, setCapture] = useState<CaptureState>({ status: "idle" });
  const captureRef = useRef<CaptureState>({ status: "idle" });
  const recorder = useRef<VoiceRecorder | null>(null);
  /** False while the microphone is still opening (permission, device start). */
  const live = useRef(false);
  const gesture = useRef<Gesture>({
    down: false,
    x: 0,
    y: 0,
    at: 0,
    released: true,
    interrupted: false,
    rtl: false,
    pointerId: -1,
    target: null,
  });
  const level = useRef(0);
  const bars = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacks = useRef({ onTake, onError, onPointer });

  const setCaptureState = useCallback((update: CaptureState | ((current: CaptureState) => CaptureState)) => {
    const next = typeof update === "function" ? update(captureRef.current) : update;
    captureRef.current = next;
    setCapture(next);
  }, []);

  useEffect(() => {
    callbacks.current = { onTake, onError, onPointer };
  }, [onTake, onError, onPointer]);

  const trace = useCallback((event: PointerTrace) => {
    callbacks.current.onPointer?.(event);
  }, []);

  const stopTicking = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const releasePointer = useCallback(() => {
    const g = gesture.current;
    g.down = false;
    g.released = true;
    const target = g.target;
    if (target?.hasPointerCapture(g.pointerId)) {
      try {
        target.releasePointerCapture(g.pointerId);
      } catch {
        // Already gone, which is what we wanted.
      }
    }
  }, []);

  const finish = useCallback(async () => {
    const active = recorder.current;
    if (!active) return;
    recorder.current = null;
    live.current = false;
    releasePointer();
    stopTicking();
    const durationMs = active.elapsedMs();
    const take = await active.stop();
    setCaptureState({ status: "idle" });
    level.current = 0;
    if (durationMs < MIN_TAKE_MS || take.size === 0) {
      callbacks.current.onError("short");
      return;
    }
    callbacks.current.onTake(take, durationMs, bars.current.slice(-48));
  }, [releasePointer, setCaptureState, stopTicking]);

  const cancel = useCallback(() => {
    const active = recorder.current;
    recorder.current = null;
    live.current = false;
    releasePointer();
    stopTicking();
    active?.cancel();
    level.current = 0;
    haptic("cancel");
    setCaptureState({ status: "idle" });
  }, [releasePointer, setCaptureState, stopTicking]);

  const lock = useCallback(() => {
    if (captureRef.current.status !== "recording" || captureRef.current.locked) return;
    haptic("lock");
    setCaptureState((current) =>
      current.status === "recording" && !current.locked
        ? { ...current, locked: true, dragX: 0, dragY: 0 }
        : current,
    );
  }, [setCaptureState]);

  const tick = useCallback(() => {
    const active = recorder.current;
    if (!active) return;
    level.current = active.level();
    if (!active.paused) bars.current.push(level.current);
    const elapsedMs = active.elapsedMs();
    setCaptureState((current) =>
      current.status === "recording"
        ? { ...current, elapsedMs, paused: active.paused, bars: bars.current.slice(-40) }
        : current,
    );
    if (elapsedMs >= MAX_RECORDING_MS) void finish();
  }, [finish, setCaptureState]);

  const begin = useCallback(
    async (lockedFromStart: boolean) => {
      if (recorder.current) return;
      const next = new VoiceRecorder();
      recorder.current = next;
      live.current = false;
      bars.current = [];
      haptic("start");
      setCaptureState({
        status: "recording",
        locked: lockedFromStart,
        paused: false,
        dragX: 0,
        dragY: 0,
        elapsedMs: 0,
        bars: [],
      });
      try {
        await next.start();
      } catch (error) {
        if (recorder.current === next) recorder.current = null;
        live.current = false;
        releasePointer();
        setCaptureState({ status: "idle" });
        haptic("warn");
        callbacks.current.onError(error instanceof RecorderError ? error.kind : "failed");
        return;
      }
      if (recorder.current !== next) {
        next.cancel(); // The traveller cancelled while the permission prompt was open.
        return;
      }
      live.current = true;
      timer.current = setInterval(tick, TICK_MS);
      if (lockedFromStart) return;
      const g = gesture.current;
      const held = g.down && !g.released && !!g.target?.hasPointerCapture(g.pointerId);
      // A real lift, or a permission sheet that stole the pointer: keep the take
      // and lock it (there is no finger left to release). A finger still captured
      // starts in hold mode, the same as a press made with permission already granted.
      if (g.released || (g.interrupted && !held)) {
        g.down = false;
        lock();
      }
    },
    [lock, releasePointer, setCaptureState, tick],
  );

  /**
   * pointercancel and a lost capture are the browser giving up on the gesture.
   * They are never a finger lift: an open take stays open and locks, and a
   * take that is still waiting for permission is left alone.
   */
  const interrupt = useCallback(
    (pointerId: number) => {
      const g = gesture.current;
      if (!g.down || g.pointerId !== pointerId) return;
      g.interrupted = true;
      if (!live.current) return;
      const current = captureRef.current;
      if (current.status === "recording" && !current.locked) {
        g.down = false;
        lock();
      }
    },
    [lock],
  );

  useEffect(
    () => () => {
      stopTicking();
      recorder.current?.cancel();
      recorder.current = null;
    },
    [stopTicking],
  );

  const micHandlers = {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      trace({ type: "down", pointerId: event.pointerId });
      if (event.button !== 0) return;
      event.preventDefault();
      if (captureRef.current.status !== "idle") return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // The pointer can already be gone; the press still counts.
      }
      gesture.current = {
        down: true,
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        released: false,
        interrupted: false,
        rtl: getComputedStyle(event.currentTarget).direction === "rtl",
        pointerId: event.pointerId,
        target: event.currentTarget,
      };
      void begin(false);
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      const g = gesture.current;
      if (!g.down || g.pointerId !== event.pointerId) return;
      const current = captureRef.current;
      if (current.status !== "recording" || current.locked) return;
      const dx = (event.clientX - g.x) * (g.rtl ? -1 : 1);
      const dy = event.clientY - g.y;
      if (dx < -CANCEL_PX) {
        cancel();
      } else if (dy < -LOCK_PX) {
        g.down = false;
        lock();
      } else {
        setCaptureState((latest) =>
          latest.status === "recording" && !latest.locked
            ? { ...latest, dragX: Math.min(0, dx), dragY: Math.min(0, dy) }
            : latest,
        );
      }
    },
    onPointerUp(event: React.PointerEvent<HTMLElement>) {
      trace({ type: "up", pointerId: event.pointerId });
      const g = gesture.current;
      if (g.pointerId !== event.pointerId) return;
      const wasDown = g.down;
      g.down = false;
      g.released = true;
      const current = captureRef.current;
      if (!wasDown || current.status !== "recording" || current.locked) return;
      if (!live.current) return; // begin() locks once the microphone is open, if the finger is gone.
      if (performance.now() - g.at < TAP_MS) {
        lock();
        return;
      }
      if (recorder.current) void finish();
    },
    onPointerCancel(event: React.PointerEvent<HTMLElement>) {
      const opening = !live.current;
      trace({
        type: "cancel",
        pointerId: event.pointerId,
        note: opening ? "mic opening, gesture kept" : "locked",
      });
      interrupt(event.pointerId);
    },
    onPointerLeave(event: React.PointerEvent<HTMLElement>) {
      trace({ type: "leave", pointerId: event.pointerId });
    },
    onGotPointerCapture(event: React.PointerEvent<HTMLElement>) {
      trace({ type: "capture", pointerId: event.pointerId, note: "got" });
    },
    onLostPointerCapture(event: React.PointerEvent<HTMLElement>) {
      trace({ type: "capture", pointerId: event.pointerId, note: "lost" });
      interrupt(event.pointerId);
    },
    onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
      if ((event.key === "Enter" || event.key === " ") && captureRef.current.status === "idle") {
        event.preventDefault();
        gesture.current.released = true;
        gesture.current.down = false;
        void begin(true);
      }
    },
    onContextMenu(event: React.MouseEvent) {
      event.preventDefault();
    },
  };

  const getLevel = useCallback(() => level.current, []);

  const pause = useCallback(() => {
    recorder.current?.pause();
    setCaptureState((current) => (current.status === "recording" ? { ...current, paused: true } : current));
  }, [setCaptureState]);

  const resume = useCallback(() => {
    recorder.current?.resume();
    setCaptureState((current) => (current.status === "recording" ? { ...current, paused: false } : current));
  }, [setCaptureState]);

  return { capture, micHandlers, micRef: bindMicHold, getLevel, send: finish, cancel, pause, resume };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/** WhatsApp gesture thresholds, in CSS pixels. */
const CANCEL_PX = 110;
const LOCK_PX = 90;
/** A press shorter than this is a tap: recording continues, locked. */
const TAP_MS = 350;
const MIN_TAKE_MS = 700;
const TICK_MS = 100;

type Gesture = { down: boolean; x: number; y: number; at: number; released: boolean; rtl: boolean };

/**
 * Press-and-hold voice capture (screen 3): slide left to cancel, slide up to
 * lock, release to send, 60 s maximum. Haptics: start, lock, cancel.
 */
export function useVoiceCapture({
  onTake,
  onError,
}: {
  onTake: (take: Blob, durationMs: number, levels: number[]) => void;
  onError: (error: CaptureError) => void;
}) {
  const [capture, setCapture] = useState<CaptureState>({ status: "idle" });
  const recorder = useRef<VoiceRecorder | null>(null);
  /** False while the microphone is still opening (permission, device start). */
  const live = useRef(false);
  const gesture = useRef<Gesture>({ down: false, x: 0, y: 0, at: 0, released: true, rtl: false });
  const level = useRef(0);
  const bars = useRef<number[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbacks = useRef({ onTake, onError });

  useEffect(() => {
    callbacks.current = { onTake, onError };
  }, [onTake, onError]);

  const stopTicking = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const finish = useCallback(async () => {
    const active = recorder.current;
    if (!active) return;
    recorder.current = null;
    live.current = false;
    stopTicking();
    const durationMs = active.elapsedMs();
    const take = await active.stop();
    setCapture({ status: "idle" });
    level.current = 0;
    if (durationMs < MIN_TAKE_MS || take.size === 0) {
      callbacks.current.onError("short");
      return;
    }
    callbacks.current.onTake(take, durationMs, bars.current.slice(-48));
  }, [stopTicking]);

  const cancel = useCallback(() => {
    const active = recorder.current;
    recorder.current = null;
    live.current = false;
    stopTicking();
    active?.cancel();
    level.current = 0;
    gesture.current.down = false;
    haptic("cancel");
    setCapture({ status: "idle" });
  }, [stopTicking]);

  const lock = useCallback(() => {
    haptic("lock");
    setCapture((current) =>
      current.status === "recording" ? { ...current, locked: true, dragX: 0, dragY: 0 } : current
    );
  }, []);

  const tick = useCallback(() => {
    const active = recorder.current;
    if (!active) return;
    level.current = active.level();
    if (!active.paused) bars.current.push(level.current);
    const elapsedMs = active.elapsedMs();
    setCapture((current) =>
      current.status === "recording"
        ? { ...current, elapsedMs, paused: active.paused, bars: bars.current.slice(-40) }
        : current
    );
    if (elapsedMs >= MAX_RECORDING_MS) void finish();
  }, [finish]);

  const begin = useCallback(
    async (lockedFromStart: boolean) => {
      if (recorder.current) return;
      const next = new VoiceRecorder();
      recorder.current = next;
      live.current = false;
      bars.current = [];
      haptic("start");
      setCapture({
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
        setCapture({ status: "idle" });
        haptic("warn");
        callbacks.current.onError(error instanceof RecorderError ? error.kind : "failed");
        return;
      }
      if (recorder.current !== next) {
        next.cancel(); // Cancelled while the permission prompt was open.
        return;
      }
      live.current = true;
      // Finger lifted while the microphone was opening: keep listening, locked.
      if (gesture.current.released && !lockedFromStart) {
        setCapture((current) => (current.status === "recording" ? { ...current, locked: true } : current));
      }
      timer.current = setInterval(tick, TICK_MS);
    },
    [tick]
  );

  useEffect(
    () => () => {
      stopTicking();
      recorder.current?.cancel();
      recorder.current = null;
    },
    [stopTicking]
  );

  const micHandlers = {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      if (event.button !== 0 || capture.status !== "idle") return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.current = {
        down: true,
        x: event.clientX,
        y: event.clientY,
        at: performance.now(),
        released: false,
        rtl: getComputedStyle(event.currentTarget).direction === "rtl",
      };
      void begin(false);
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      const g = gesture.current;
      if (!g.down || capture.status !== "recording" || capture.locked) return;
      const dx = (event.clientX - g.x) * (g.rtl ? -1 : 1);
      const dy = event.clientY - g.y;
      if (dx < -CANCEL_PX) {
        cancel();
      } else if (dy < -LOCK_PX) {
        g.down = false;
        lock();
      } else {
        setCapture({ ...capture, dragX: Math.min(0, dx), dragY: Math.min(0, dy) });
      }
    },
    onPointerUp() {
      const g = gesture.current;
      const wasDown = g.down;
      g.down = false;
      g.released = true;
      if (!wasDown || capture.status !== "recording" || capture.locked) return;
      if (!live.current) return; // begin() locks once the microphone is open.
      if (performance.now() - g.at < TAP_MS) {
        lock();
        return;
      }
      if (recorder.current) void finish();
    },
    onPointerCancel() {
      const g = gesture.current;
      g.released = true;
      if (g.down && capture.status === "recording" && !capture.locked) cancel();
      g.down = false;
    },
    onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
      if ((event.key === "Enter" || event.key === " ") && capture.status === "idle") {
        event.preventDefault();
        gesture.current.released = true;
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
    setCapture((current) => (current.status === "recording" ? { ...current, paused: true } : current));
  }, []);

  const resume = useCallback(() => {
    recorder.current?.resume();
    setCapture((current) => (current.status === "recording" ? { ...current, paused: false } : current));
  }, []);

  return { capture, micHandlers, getLevel, send: finish, cancel, pause, resume };
}

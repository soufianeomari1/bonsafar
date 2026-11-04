"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CaretLeft,
  CaretUp,
  LockSimple,
  Microphone,
  PaperPlaneRight,
  Pause,
  Play,
  Trash,
} from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import { PulseRings } from "@/components/bs/VoiceRadar";
import { bindMicSurface, micHoldStyle, type CaptureState } from "@/components/voice/useVoiceCapture";
import { formatClock } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Recording = Extract<CaptureState, { status: "recording" }>;

const WAVE = 16;

/** Words of a real transcript, one after another. An empty string leaves the caret. */
function LiveWords({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const words = text.trim().length ? text.trim().split(/\s+/) : [];
  return (
    <p className="text-center text-2xl font-bold leading-[1.35] tracking-[-0.01em]" aria-live="polite">
      {words.map((word, index) => (
        <motion.span
          key={`${index}-${word}`}
          className="me-[0.3em] inline-block"
          initial={reduced ? false : { opacity: 0, y: 6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "none" }}
          transition={{
            duration: reduced ? 0.2 : 0.45,
            delay: reduced ? 0 : index * 0.3,
            ease: [0.23, 1, 0.32, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
      <motion.span
        aria-hidden
        className="inline-block h-[26px] w-[3px] translate-y-1 rounded-sm bg-blue align-middle"
        animate={reduced ? { opacity: 1 } : { opacity: [1, 1, 0, 0] }}
        transition={reduced ? { duration: 0.2 } : { duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </p>
  );
}

function useMicLevel(getLevel: () => number, active: boolean) {
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last = 0;
    const loop = (now: number) => {
      if (now - last > 50) {
        last = now;
        setLevel(Math.min(1, Math.max(0, getLevel())));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active, getLevel]);
  return active ? level : 0;
}

/** Screen 3. Look: design/motion/screens/03-voice.html. The hold, lock and cancel gestures stay. */
export function VocalScreen({
  capture,
  getLevel,
  onCancel,
  onSend,
  onPause,
  onResume,
}: {
  capture: Recording;
  getLevel: () => number;
  onCancel: () => void;
  onSend: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const { t, rtl } = useLanguage();
  const reduced = useReducedMotion();
  const level = useMicLevel(getLevel, !capture.paused);
  const bars = capture.bars.slice(-WAVE);
  const padded = [...Array(Math.max(0, WAVE - bars.length)).fill(0), ...bars];

  return (
    <motion.div
      ref={bindMicSurface}
      onContextMenu={(event) => event.preventDefault()}
      className="bs-mic-screen absolute inset-0 z-30 flex flex-col bg-voice-gradient"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <div className="flex justify-center px-5 pt-[22px]">
        <span className="inline-flex h-8 items-center gap-2 rounded-pill bg-card px-3 text-[13px] font-bold">
          <span
            className={cn(
              "size-2 rounded-pill bg-red",
              !capture.paused && "bs-motion animate-[bs-rec_1.2s_ease-in-out_infinite]"
            )}
          />
          {capture.paused ? t("voice.paused") : t("voice.pill")}
        </span>
      </div>

      <section aria-label={t("voice.pill")} className="relative flex h-[340px] items-center justify-center">
        <PulseRings core={150} duration={1.6} scale={2.3} delays={[0, 0.53, 1.06]} opacity={0.5} />
        <Safar state="listening" size={170} tilt={-10} level={level} />
      </section>

      <section className="min-h-[120px] px-7">
        {/* Transcription starts after send, so this caret waits for real words. */}
        <LiveWords text="" />
        <p className="mt-2.5 text-center text-[13px] text-muted">{t("voice.subtitle")}</p>
      </section>

      <div aria-hidden className="mt-3 flex h-12 items-center justify-center gap-1 px-7">
        {padded.map((value, index) => (
          <span
            key={index}
            className="w-1 rounded-sm bg-ink"
            style={{ height: 8 + Math.round(value * 38) }}
          />
        ))}
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-3 px-5 pb-[22px]">
        {capture.locked ? (
          <div className="flex items-center justify-center gap-1.5 text-[13px] text-muted">
            <LockSimple size={14} weight="light" aria-hidden />
            {t("voice.locked")}
          </div>
        ) : (
          <motion.div
            className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-muted"
            style={{ y: capture.dragY * 0.35 }}
          >
            <CaretUp size={14} weight="light" aria-hidden />
            <LockSimple size={14} weight="light" aria-hidden />
            {t("voice.slideLock")}
          </motion.div>
        )}

        <div className="flex h-[68px] items-center gap-2.5 rounded-pill bg-card px-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]">
          {capture.locked ? (
            <>
              <button
                type="button"
                aria-label={t("voice.delete")}
                onClick={onCancel}
                className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-red-soft text-red"
              >
                <Trash size={20} weight="light" />
              </button>
              <div className="flex min-w-0 flex-1 items-center gap-2 ps-1">
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-pill bg-red",
                    !capture.paused && "bs-motion animate-[bs-rec_1.2s_ease-in-out_infinite]"
                  )}
                />
                <span className="font-mono text-base font-semibold tabular">{formatClock(capture.elapsedMs)}</span>
                <span className="truncate text-xs text-muted">{t("voice.max")}</span>
              </div>
              <button
                type="button"
                aria-label={capture.paused ? t("voice.resume") : t("voice.pause")}
                onClick={() => {
                  haptic("tap");
                  if (capture.paused) onResume();
                  else onPause();
                }}
                className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-fill text-ink"
              >
                {capture.paused ? <Play size={16} weight="light" /> : <Pause size={16} weight="light" />}
              </button>
              <button
                type="button"
                aria-label={t("voice.send")}
                onClick={() => {
                  haptic("tap");
                  onSend();
                }}
                className="flex size-[52px] shrink-0 items-center justify-center rounded-pill bg-ink text-card"
              >
                <PaperPlaneRight size={20} weight="light" className="rtl:-scale-x-100" />
              </button>
            </>
          ) : (
            <>
              <motion.span
                className="flex min-w-0 flex-1 items-center gap-1.5 ps-3 text-[15px] font-semibold text-muted"
                style={{ x: capture.dragX * 0.6 * (rtl ? -1 : 1), opacity: 1 + capture.dragX / 160 }}
              >
                <CaretLeft size={16} weight="light" aria-hidden className="rtl:-scale-x-100" />
                {t("voice.slideCancel")}
              </motion.span>
              <span
                style={micHoldStyle}
                className="bs-mic-hold flex size-[52px] shrink-0 items-center justify-center rounded-pill bg-blue text-card"
              >
                <Microphone size={22} weight="light" aria-hidden />
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

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
import { VoiceRadar } from "@/components/bs/VoiceRadar";
import { bindMicHold, micHoldStyle, type CaptureState } from "@/components/voice/useVoiceCapture";
import { formatClock } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Recording = Extract<CaptureState, { status: "recording" }>;

const BAR_COUNT = 34;

/** Screen 3, mockup 03-Vocal. Shown over the home screen while recording. */
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
  const bars = capture.bars.slice(-BAR_COUNT);
  const padded = [...Array(Math.max(0, BAR_COUNT - bars.length)).fill(0), ...bars];

  return (
    <motion.div
      ref={bindMicHold}
      onContextMenu={(event) => event.preventDefault()}
      style={micHoldStyle}
      className="bs-mic-hold absolute inset-0 z-30 flex flex-col bg-card"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    >
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line pe-3 ps-1.5">
        <button
          type="button"
          aria-label={t("common.cancel")}
          onClick={onCancel}
          className="flex size-11 items-center justify-center text-ink"
        >
          <CaretLeft size={20} weight="bold" className="rtl:-scale-x-100" />
        </button>
        <span className="flex flex-col">
          <span className="text-[17px] font-bold" dir="ltr">
            BonSafar
          </span>
          <span className="text-[13px] font-medium text-blue">
            {capture.paused ? t("voice.paused") : t("voice.headerStatus")}
          </span>
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[22px] bg-listen-gradient px-4">
        <VoiceRadar listening={!capture.paused} getLevel={getLevel} size={300} core={96}>
          <span
            style={micHoldStyle}
            className="bs-mic-hold flex size-24 items-center justify-center rounded-pill bg-blue text-card shadow-[0_14px_34px_color-mix(in_srgb,var(--color-blue)_35%,transparent)]"
          >
            <Microphone size={40} weight="fill" aria-hidden />
          </span>
        </VoiceRadar>
        <div className="flex flex-col gap-1 text-center">
          <span className="text-[28px] font-extrabold tracking-[-0.02em]">{t("voice.title")}</span>
          <span className="text-base text-muted">{t("voice.subtitle")}</span>
        </div>
      </div>

      <div className="flex justify-center bg-listen px-4 pb-2.5">
        {capture.locked ? (
          <span className="flex h-8 items-center gap-1.5 rounded-pill bg-green-soft px-3 text-[13px] font-semibold text-green">
            <LockSimple size={14} weight="fill" aria-hidden />
            {t("voice.locked")}
          </span>
        ) : (
          <motion.span
            className="flex h-8 items-center gap-1.5 rounded-pill bg-card px-3 text-[13px] font-semibold text-muted shadow-soft"
            style={{ y: capture.dragY * 0.4 }}
          >
            <CaretUp size={14} weight="bold" aria-hidden />
            <LockSimple size={14} weight="fill" aria-hidden />
            {t("voice.slideLock")}
          </motion.span>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-line bg-card px-4 pb-[22px] pt-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-pill",
              capture.paused ? "bg-knob-off" : "bs-motion bg-red animate-[bs-rec_1.2s_ease-in-out_infinite]"
            )}
          />
          <span className="tabular text-xl font-bold" aria-live="off">
            {formatClock(capture.elapsedMs)}
          </span>
          <div aria-hidden className="flex h-10 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden" dir="ltr">
            {padded.map((value, index) => (
              <span
                key={index}
                className={cn("w-[3px] shrink-0 rounded-[3px]", index > BAR_COUNT - 10 ? "bg-ink" : "bg-knob-off")}
                style={{ height: 4 + Math.round(value * 34) }}
              />
            ))}
          </div>
        </div>

        {capture.locked ? (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label={t("voice.delete")}
              onClick={onCancel}
              className="flex size-[52px] shrink-0 items-center justify-center rounded-pill bg-red-soft text-red"
            >
              <Trash size={22} weight="fill" />
            </button>
            <button
              type="button"
              onClick={() => {
                haptic("tap");
                if (capture.paused) onResume();
                else onPause();
              }}
              className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-pill bg-fill text-base font-semibold text-ink"
            >
              {capture.paused ? (
                <Play size={16} weight="fill" aria-hidden />
              ) : (
                <Pause size={16} weight="fill" aria-hidden />
              )}
              {capture.paused ? t("voice.resume") : t("voice.pause")}
            </button>
            <button
              type="button"
              aria-label={t("voice.send")}
              onClick={() => {
                haptic("tap");
                onSend();
              }}
              className="flex size-[60px] shrink-0 items-center justify-center rounded-pill bg-ink text-card shadow-[0_8px_22px_rgba(11,11,15,0.25)]"
            >
              <PaperPlaneRight size={24} weight="fill" className="rtl:-scale-x-100" />
            </button>
          </div>
        ) : (
          <div className="flex h-[60px] items-center justify-between gap-3">
            <motion.span
              className="flex items-center gap-1.5 text-[15px] font-semibold text-muted"
              style={{ x: capture.dragX * 0.6 * (rtl ? -1 : 1), opacity: 1 + capture.dragX / 160 }}
            >
              <CaretLeft size={16} weight="bold" aria-hidden className="rtl:-scale-x-100" />
              {t("voice.slideCancel")}
            </motion.span>
            <span
              style={micHoldStyle}
              className="bs-mic-hold flex size-[60px] shrink-0 items-center justify-center rounded-pill bg-blue text-card"
            >
              <Microphone size={26} weight="fill" aria-hidden />
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

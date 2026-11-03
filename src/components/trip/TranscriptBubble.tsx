"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "@phosphor-icons/react";
import { formatClock } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { TranscriptPart } from "./chips";

const HIGHLIGHT = "linear-gradient(var(--color-yellow), var(--color-yellow))";

/** Darija mixes scripts mid-sentence: follow the dominant one, not the first letter. */
function textDir(text: string): "rtl" | "ltr" {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z\u00C0-\u024F]/g)?.length ?? 0;
  return arabic > latin ? "rtl" : "ltr";
}

/** The user's blue bubble of mockup 04: player, transcript, English line. */
export function TranscriptBubble({
  audioUrl,
  durationMs,
  levels,
  text,
  parts,
  highlighted,
  flying,
  layoutPrefix,
  pending,
  translation,
}: {
  audioUrl: string | null;
  durationMs: number;
  levels: number[];
  text: string;
  /** Keyword split, once the intent is known. */
  parts: TranscriptPart[] | null;
  /** Keywords are highlighted (A2, step 1). */
  highlighted: boolean;
  /** Keyword index to chip id, still in the sentence and about to fly. */
  flying: Map<number, string> | null;
  layoutPrefix: string;
  /** Words still arriving: shows a shimmer instead of an empty bubble. */
  pending: string | null;
  translation: string | null;
}) {
  const t = useT();
  const reduced = useReducedMotion();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const waveform = levels.length
    ? levels.filter((_, index) => index % Math.max(1, Math.floor(levels.length / 32)) === 0).slice(0, 32)
    : [];

  return (
    <div className="flex w-[80%] max-w-[312px] flex-col gap-2.5 self-end rounded-[22px] rounded-ee-md bg-blue px-3.5 py-3 text-card shadow-[0_8px_24px_color-mix(in_srgb,var(--color-blue)_22%,transparent)]">
      {audioUrl && (
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label={playing ? t("understood.pauseAudio") : t("understood.play")}
            onClick={() => {
              const element = audio.current;
              if (!element) return;
              if (element.paused) void element.play();
              else element.pause();
            }}
            className="flex size-7 shrink-0 items-center justify-center rounded-pill bg-card/20 text-card"
          >
            {playing ? <Pause size={13} weight="fill" /> : <Play size={13} weight="fill" />}
          </button>
          <span aria-hidden className="flex h-[22px] min-w-0 flex-1 items-center gap-[3px] overflow-hidden" dir="ltr">
            {waveform.length
              ? waveform.map((value, index) => (
                  <span
                    key={index}
                    className="w-[3px] shrink-0 rounded-[3px] bg-card/75"
                    style={{ height: 3 + Math.round(value * 19) }}
                  />
                ))
              : null}
          </span>
          <span className="tabular text-[13px] font-semibold">{formatClock(durationMs)}</span>
          <audio
            ref={audio}
            src={audioUrl}
            preload="metadata"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        </div>
      )}

      {pending !== null ? (
        <p dir={pending ? textDir(pending) : undefined} className="text-[15px] font-medium leading-[1.45]" aria-live="polite">
          {pending ? (
            pending
              .trim()
              .split(/\s+/)
              .map((word, index) => (
                <motion.span
                  key={index}
                  className="me-[0.28em] inline-block"
                  initial={reduced ? false : { opacity: 0, y: 6, filter: "blur(3px)" }}
                  animate={{ opacity: 1, y: 0, filter: "none" }}
                  transition={{ duration: reduced ? 0.2 : 0.45, ease: [0.23, 1, 0.32, 1] }}
                >
                  {word}
                </motion.span>
              ))
          ) : (
            <span className="shimmer [--color-muted:var(--color-card)] [--color-line:var(--color-blue-soft)]">
              {t("understood.transcribing")}
            </span>
          )}
        </p>
      ) : (
        <p dir={textDir(text)} className="text-[15px] font-medium leading-[1.45]">
          {textDir(text) === "ltr" && <span aria-hidden>« </span>}
          {(parts ?? [{ text, keyword: null }]).map((part, index) => {
            if (part.keyword === null) return <span key={index}>{part.text}</span>;
            const chipId = flying?.get(part.keyword);
            return (
              <span key={index} className="relative font-bold">
                <motion.span
                  className="rounded bg-no-repeat px-[3px] py-px text-ink [box-decoration-break:clone]"
                  style={{ backgroundImage: HIGHLIGHT, backgroundPosition: "0 90%" }}
                  initial={false}
                  animate={{ backgroundSize: highlighted ? "100% 100%" : "0% 100%" }}
                  transition={{ duration: reduced ? 0 : 0.4, delay: reduced ? 0 : 0.06 * part.keyword }}
                >
                  {part.text}
                </motion.span>
                {chipId && !reduced && (
                  <motion.span
                    aria-hidden
                    layoutId={`${layoutPrefix}-${chipId}`}
                    className="pointer-events-none absolute inset-0 rounded-pill"
                  />
                )}
              </span>
            );
          })}
          {textDir(text) === "ltr" && <span aria-hidden> »</span>}
        </p>
      )}

      {translation && (
        <p className="border-t border-card/30 pt-2 text-sm leading-[1.45] text-card/85" lang="en" dir="ltr">
          <strong className="font-bold">EN</strong> · {translation}
        </p>
      )}
    </div>
  );
}

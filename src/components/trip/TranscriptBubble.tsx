"use client";

import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "@phosphor-icons/react";
import { formatClock } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { TranscriptPart } from "./chips";

const HIGHLIGHT_COLOR = "color-mix(in srgb, var(--color-card) 24%, transparent)";
const HIGHLIGHT = `linear-gradient(${HIGHLIGHT_COLOR}, ${HIGHLIGHT_COLOR})`;

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
    <div className="flex w-[80%] max-w-[312px] flex-col gap-2.5 self-end rounded-[22px] rounded-ee-md bg-blue px-3.5 py-3 text-card">
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
            className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-card text-blue"
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
        <p dir={pending ? textDir(pending) : undefined} className="text-base leading-[1.6]" aria-live="polite">
          {pending ? (
            <span className="opacity-90">{pending}</span>
          ) : (
            <span className="shimmer [--color-muted:var(--color-card)] [--color-line:var(--color-blue-soft)]">
              {t("understood.transcribing")}
            </span>
          )}
        </p>
      ) : (
        <p dir={textDir(text)} className="text-base leading-[1.6]">
          {(parts ?? [{ text, keyword: null }]).map((part, index) => {
            if (part.keyword === null) return <span key={index}>{part.text}</span>;
            const chipId = flying?.get(part.keyword);
            return (
              <span key={index} className="relative font-bold">
                <motion.span
                  className="rounded-md bg-no-repeat px-[5px] py-px [box-decoration-break:clone]"
                  style={{ backgroundImage: HIGHLIGHT }}
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

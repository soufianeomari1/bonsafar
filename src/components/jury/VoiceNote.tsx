"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { HourglassMedium, Pause, Play } from "@phosphor-icons/react";
import { formatClock } from "@/lib/format";
import { JURY_COPY } from "@/lib/jury/copy";
import { cn } from "@/lib/utils";

export type VoiceNoteHandle = { play: () => void; stop: () => void };

/** Fixed bar heights: a drawing of a voice note, not a measure of this one. */
const BARS = [0.35, 0.6, 0.9, 0.55, 0.75, 1, 0.65, 0.4, 0.8, 0.95, 0.5, 0.7, 0.45, 0.85, 0.6, 0.3, 0.7, 0.9, 0.5, 0.35];

/** Blue voice bubble with play/pause and progress, or a clean placeholder while the file is missing. */
export const VoiceNote = forwardRef<VoiceNoteHandle, { src: string; available: boolean | null; label: string }>(
  function VoiceNote({ src, available, label }, ref) {
    const audio = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useImperativeHandle(ref, () => ({
      play: () => {
        const element = audio.current;
        if (!element) return;
        element.currentTime = 0;
        void element.play().catch(() => setPlaying(false));
      },
      stop: () => audio.current?.pause(),
    }));

    if (available === false) {
      return (
        <div className="flex h-12 items-center gap-2.5 rounded-[16px] border border-dashed border-line-strong bg-bg px-3.5">
          <HourglassMedium size={20} weight="light" className="shrink-0 text-muted" aria-hidden />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {JURY_COPY.audioSoon}
          </span>
        </div>
      );
    }

    return (
      <div className="flex h-12 items-center gap-3 rounded-[16px] bg-blue-soft pe-3.5 ps-1.5">
        <button
          type="button"
          disabled={!available}
          aria-label={`${playing ? JURY_COPY.pause : JURY_COPY.play}: ${label}`}
          onClick={() => {
            const element = audio.current;
            if (!element) return;
            if (element.paused) void element.play().catch(() => setPlaying(false));
            else element.pause();
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-blue text-card transition-transform active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:opacity-40"
        >
          {playing ? <Pause size={16} weight="fill" aria-hidden /> : <Play size={16} weight="fill" aria-hidden />}
        </button>
        <span aria-hidden className="flex h-6 min-w-0 flex-1 items-center gap-[3px]">
          {BARS.map((height, index) => (
            <span
              key={index}
              className={cn(
                "w-[3px] shrink-0 rounded-pill transition-colors",
                index / BARS.length < progress ? "bg-blue" : "bg-blue/30",
              )}
              style={{ height: `${Math.round(height * 100)}%` }}
            />
          ))}
        </span>
        <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-blue-deep">
          {formatClock((playing ? progress * duration : duration) * 1000)}
        </span>
        <audio
          ref={audio}
          src={src}
          preload="metadata"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
          onTimeUpdate={(event) => {
            const element = event.currentTarget;
            setProgress(element.duration ? element.currentTime / element.duration : 0);
          }}
        />
      </div>
    );
  },
);

"use client";

import { motion, useReducedMotion } from "motion/react";
import { GithubLogo, Microphone, PlayCircle, X } from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import { seconds } from "@/components/trip/UnderTheHood";
import { formatUsd, formatWhen } from "@/lib/format";
import { JURY_COPY, JURY_LINKS } from "@/lib/jury/copy";
import type { JuryScenario } from "@/lib/jury/scenarios";
import type { RunSummary } from "@/lib/jury/summary";
import { GateBadge } from "./GateBadge";

/** End card inside the phone: Safar found, the measured totals, then where to go next. */
export function EndCard({
  summary,
  next,
  videoUrl,
  onNext,
  onOwn,
  onClose,
}: {
  summary: RunSummary;
  next: JuryScenario;
  videoUrl: string | null;
  onNext: () => void;
  onOwn: () => void;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-labelledby="end-title"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-sky-gradient px-5 pb-6 pt-5 scroll-quiet"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          aria-label={JURY_COPY.endClose}
          className="flex size-11 items-center justify-center rounded-pill bg-card/80 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <X size={18} weight="light" aria-hidden />
        </button>
      </div>
      <div className="-mt-6 flex flex-col items-center text-center">
        <Safar state="found" size={104} />
        <h2 id="end-title" className="mt-2 text-[30px] font-extrabold tracking-[-0.025em]">
          {JURY_COPY.endTitle}
        </h2>
        <p className="text-[15px] text-muted">{JURY_COPY.endSubtitle}</p>
        {summary.replay && (
          <span className="mt-2 rounded-[6px] bg-yellow px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink">
            {JURY_COPY.replayBadge}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <Stat label={JURY_COPY.endTime} value={seconds(summary.totalMs)} />
        <Stat label={JURY_COPY.endCost} value={formatUsd(summary.costUsd)} />
        <div className="col-span-2 flex items-center justify-between gap-3 rounded-[18px] bg-card px-4 py-3 shadow-soft">
          <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            {JURY_COPY.endCaptured}
          </dt>
          <dd className="font-mono text-sm font-semibold tabular-nums">
            {summary.capturedAt ? formatWhen(summary.capturedAt, "en") : "–"}
          </dd>
        </div>
      </dl>

      <section aria-label={JURY_COPY.endModels} className="mt-2 rounded-[18px] bg-card px-4 py-3 shadow-soft">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
          {JURY_COPY.endModels}
        </p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {summary.models.map((entry) => (
            <li key={entry.model} className="flex items-center justify-between gap-3 text-sm">
              <span className="font-mono font-semibold">{entry.model}</span>
              <span className="text-muted">{JURY_COPY.endCalls(entry.calls)}</span>
            </li>
          ))}
          {summary.toolCalls > 0 && (
            <li className="flex items-center justify-between gap-3 border-t border-line pt-1 text-sm">
              <span className="text-muted">{JURY_COPY.endTools}</span>
              <span className="text-muted">{JURY_COPY.endCalls(summary.toolCalls)}</span>
            </li>
          )}
        </ul>
      </section>
      {summary.replay && <p className="mt-2 text-xs leading-snug text-muted">{JURY_COPY.endReplayNote}</p>}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button
          type="button"
          onClick={onNext}
          className="flex h-14 items-center justify-center gap-2.5 rounded-button bg-ink px-5 text-[17px] font-semibold text-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <GateBadge number={next.number} size="sm" />
          {JURY_COPY.endNext(String(next.number))}
        </button>
        <button
          type="button"
          onClick={onOwn}
          className="flex h-12 items-center justify-center gap-2 rounded-button border border-line bg-card px-5 text-base font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <Microphone size={18} weight="light" aria-hidden />
          {JURY_COPY.ownCta}
        </button>
        <div className="mt-1 flex justify-center gap-5 text-sm font-semibold">
          <a
            href={JURY_LINKS.github}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue"
          >
            <GithubLogo size={18} weight="light" aria-hidden />
            {JURY_COPY.github}
          </a>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-1.5 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue"
            >
              <PlayCircle size={18} weight="light" aria-hidden />
              {JURY_COPY.video}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] bg-card px-4 py-3 shadow-soft">
      <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt>
      <dd className="text-[26px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{value}</dd>
    </div>
  );
}

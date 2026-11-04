"use client";

import { forwardRef } from "react";
import { ArrowCounterClockwise, Lightning } from "@phosphor-icons/react";
import { StatusBadge } from "@/components/bs/StatusBadge";
import { formatWhen } from "@/lib/format";
import { JURY_COPY } from "@/lib/jury/copy";
import type { JuryStatus } from "@/lib/jury/protocol";
import type { JuryScenario } from "@/lib/jury/scenarios";
import { cn } from "@/lib/utils";
import { GateBadge } from "./GateBadge";
import { VoiceNote, type VoiceNoteHandle } from "./VoiceNote";

export type ScenarioCardProps = {
  scenario: JuryScenario;
  audio: boolean | null;
  replay: JuryStatus["replays"][string] | undefined;
  live: boolean;
  /** What this card is running right now, if anything. */
  active: "live" | "replay" | null;
  busy: boolean;
  onRunLive: () => void;
  onReplay: () => void;
};

export const ScenarioCard = forwardRef<VoiceNoteHandle, ScenarioCardProps>(function ScenarioCard(
  { scenario, audio, replay, live, active, busy, onRunLive, onReplay },
  ref,
) {
  const titleId = `scenario-${scenario.id}`;
  const canLive = live && audio === true && !busy;
  const canReplay = !!replay && !busy;
  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col gap-3 rounded-card bg-card p-4 shadow-soft transition-shadow duration-300",
        active !== null && "ring-2 ring-blue",
      )}
    >
      <header className="flex items-center gap-3">
        <GateBadge number={scenario.number} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <h3 id={titleId} className="text-[17px] font-extrabold leading-tight tracking-[-0.01em]">
            <span className="sr-only">Scenario {scenario.number}: </span>
            {scenario.title}
          </h3>
          <StatusBadge tone={scenario.status.tone} dot>
            {scenario.status.label}
          </StatusBadge>
        </div>
      </header>

      <VoiceNote ref={ref} src={scenario.audio} available={audio} label={scenario.title} />

      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-semibold leading-snug text-ink">
          <span className="sr-only">In darija: </span>
          {scenario.darija}
        </p>
        <p className="text-[13px] leading-snug text-muted">
          <span className="sr-only">In English: </span>
          {scenario.english}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!canLive}
          onClick={onRunLive}
          title={audio === false ? JURY_COPY.audioSoonHint : !live ? JURY_COPY.livePaused : undefined}
          className="flex h-11 items-center justify-center gap-2 rounded-button-sm bg-ink px-3 text-[15px] font-semibold text-card transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Lightning size={18} weight="light" aria-hidden />
          {active === "live" && busy ? JURY_COPY.running : JURY_COPY.runLive}
        </button>
        <button
          type="button"
          disabled={!canReplay}
          onClick={onReplay}
          className="flex h-11 items-center justify-center gap-2 rounded-button-sm border border-line bg-card px-3 text-[15px] font-semibold text-ink transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowCounterClockwise size={18} weight="light" aria-hidden />
          {active === "replay" && busy ? JURY_COPY.running : JURY_COPY.watchReplay}
        </button>
      </div>
      <p className="font-mono text-[11px] leading-snug text-muted">
        {replay
          ? replay.legacy
            ? JURY_COPY.replayLegacy(formatWhen(replay.captured_at, "en"))
            : JURY_COPY.replayFrom(formatWhen(replay.captured_at, "en"))
          : replay === null
            ? JURY_COPY.replayNone
            : "\u00A0"}
      </p>
    </article>
  );
});

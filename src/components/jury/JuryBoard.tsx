"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import {
  ArrowCounterClockwise,
  GithubLogo,
  Microphone,
  PlayCircle,
  UserFocus,
  WarningCircle,
} from "@phosphor-icons/react";
import { Wordmark } from "@/components/bs/Brand";
import { Clouds, type CloudLayer } from "@/components/bs/Clouds";
import { mergeEvents, UnderTheHoodView } from "@/components/trip/UnderTheHood";
import { readServerAgentRun, type AgentRunSnapshot } from "@/lib/agent-client/store";
import { JURY_COPY, JURY_LINKS } from "@/lib/jury/copy";
import { post, read, type JuryStatus, type PhoneMessage, type PhoneTrip } from "@/lib/jury/protocol";
import { JURY_SCENARIOS, type JuryScenario } from "@/lib/jury/scenarios";
import { summarize } from "@/lib/jury/summary";
import { cn } from "@/lib/utils";
import { EndCard } from "./EndCard";
import { GuidedStrip } from "./GuidedStrip";
import { OnboardingReplay } from "./OnboardingReplay";
import { ImpactFigures, PersonaCard } from "./PersonaCard";
import { ScenarioCard } from "./ScenarioCard";
import type { VoiceNoteHandle } from "./VoiceNote";

const PHONE = { width: 390, height: 844, bezel: 7 } as const;
/** Header, strip, gaps and paddings above and below the phone. */
const CHROME_PX = 150;
const TRUST_KEY = "bonsafar.trustSeen";

const subscribeNever = () => () => {};

const CLOUDS: CloudLayer[] = [
  { top: 84, width: 120, opacity: 0.95, duration: 46, delay: 0, pin: "start", inset: 380, drift: 30 },
  { top: 150, width: 70, opacity: 0.75, duration: 56, delay: -10, pin: "end", inset: 120, drift: -24 },
  { top: 40, width: 56, opacity: 0.7, duration: 38, delay: -4, pin: "end", inset: 520, drift: -18 },
];

type Phone = {
  ready: boolean;
  path: string;
  run: AgentRunSnapshot;
  trip: PhoneTrip | null;
};

type Active = { kind: "live" | "replay" | "own"; scenario: JuryScenario | null };

/** 1 to 5 from the phone's route, 0 at rest. */
function stageOf(phone: Phone, active: Active | null): number {
  const path = phone.path;
  if (/^\/trip\/(ready|check|file|poster)/.test(path)) return 5;
  if (/^\/trip\/(result|package)/.test(path)) return 4;
  if (/^\/trip\/(plan|search)/.test(path)) return 3;
  if (path.startsWith("/trip/understood")) return phone.trip?.phase === "transcribing" ? 1 : 2;
  return active?.kind === "live" ? 1 : 0;
}

/** The next scenario after this one that can run, live or as a replay. */
function nextScenario(current: JuryScenario | null, runnable: (scenario: JuryScenario) => boolean): JuryScenario {
  const start = current ? current.number : 0;
  for (let step = 0; step < JURY_SCENARIOS.length; step += 1) {
    const candidate = JURY_SCENARIOS[(start + step) % JURY_SCENARIOS.length];
    if (candidate.id !== current?.id && runnable(candidate)) return candidate;
  }
  return current ?? JURY_SCENARIOS[0];
}

/** The phone keeps its real 390 x 844 layout and is scaled to fit the window height. */
function usePhoneScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => setScale(Math.min(1, Math.max(0.72, (window.innerHeight - CHROME_PX) / PHONE.height)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

/**
 * The judges' board (/jury): who Fatima is, three real voice notes, the real
 * app running in a phone frame, and the live Under the hood panel. English only.
 */
export function JuryBoard({ silenceMs, videoUrl }: { silenceMs: number; videoUrl: string | null }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const notes = useRef<Record<string, VoiceNoteHandle | null>>({});
  const scale = usePhoneScale();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [phone, setPhone] = useState<Phone>({ ready: false, path: "/home", run: readServerAgentRun(), trip: null });
  const [active, setActive] = useState<Active | null>(null);
  const [overlay, setOverlay] = useState<"onboarding" | "end" | null>(null);
  const [status, setStatus] = useState<JuryStatus | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    void fetch("/api/jury/status", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<JuryStatus>) : null))
      .then((value) => value && setStatus(value))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // The trust card is part of the traveller's first visit, not of the demo.
    try {
      window.localStorage.setItem(TRUST_KEY, "1");
    } catch {
      // Blocked storage: the phone shows the card once.
    }
    refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = read<PhoneMessage>(event, frame.current?.contentWindow);
      if (!message) return;
      if (message.type === "ready") setPhone((current) => ({ ...current, ready: true }));
      if (message.type === "state") {
        setPhone({ ready: true, path: message.path, run: message.run, trip: message.trip });
      }
      if (message.type === "finished") {
        setOverlay("end");
        refreshStatus();
      }
      if (message.type === "failed") setNotice(JURY_COPY.audioSoonHint);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [refreshStatus]);

  const send = useCallback((message: Parameters<typeof post>[1]) => post(frame.current?.contentWindow, message), []);

  const stopNotes = () => {
    for (const note of Object.values(notes.current)) note?.stop();
  };

  const runLive = (scenario: JuryScenario) => {
    stopNotes();
    setOverlay(null);
    setNotice(null);
    setActive({ kind: "live", scenario });
    send({ type: "run-live", scenario: scenario.label, audio: scenario.audio, silenceMs });
    notes.current[scenario.id]?.play();
  };

  const runReplay = (scenario: JuryScenario) => {
    stopNotes();
    setOverlay(null);
    setNotice(null);
    setActive({ kind: "replay", scenario });
    send({ type: "run-replay", scenario: scenario.label });
  };

  const recordOwn = () => {
    stopNotes();
    setOverlay(null);
    setActive({ kind: "own", scenario: null });
    setNotice(JURY_COPY.ownHint);
    send({ type: "own", silenceMs });
  };

  const reset = () => {
    stopNotes();
    setOverlay(null);
    setNotice(null);
    setActive(null);
    send({ type: "reset" });
  };

  const busy = phone.run.status === "running" || phone.trip?.phase === "transcribing" || phone.trip?.phase === "understanding";
  const stage = stageOf(phone, active);
  const events = useMemo(() => mergeEvents(phone.trip?.events, phone.run.events), [phone.trip?.events, phone.run.events]);
  const summary = useMemo(() => summarize(phone.run, phone.trip?.events ?? [], events), [phone.run, phone.trip?.events, events]);
  const live = status?.live ?? true;
  const audio: Record<string, boolean | null> = status?.audio ?? {};
  const canLive = (scenario: JuryScenario) => live && audio[scenario.id] === true;
  const next = nextScenario(active?.scenario ?? null, (scenario) => canLive(scenario) || !!status?.replays[scenario.label]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[linear-gradient(180deg,var(--color-sky)_0%,var(--color-bg)_520px)] text-ink">
      <Clouds layers={CLOUDS} className="h-64" />
      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-3.5 px-6 pb-4 pt-3 min-[1400px]:h-dvh">
        <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 rounded-pill bg-card ps-5 pe-2 shadow-soft">
          <div className="flex min-w-0 items-center gap-3">
            <Wordmark size={20} mark={30} />
            <span className="hidden truncate text-sm text-muted min-[1180px]:block">{JURY_COPY.title}</span>
          </div>
          <nav aria-label="Project links" className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-[7px] bg-yellow px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-ink">
              {JURY_COPY.badge}
            </span>
            <a
              href={JURY_LINKS.github}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 items-center gap-1.5 rounded-pill px-3 text-sm font-semibold hover:bg-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            >
              <GithubLogo size={18} weight="light" aria-hidden />
              {JURY_COPY.github}
            </a>
            {videoUrl && (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center gap-1.5 rounded-pill bg-ink px-3.5 text-sm font-semibold text-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
              >
                <PlayCircle size={18} weight="light" aria-hidden />
                {JURY_COPY.video}
              </a>
            )}
          </nav>
        </header>

        <main
          className={cn(
            "grid min-h-0 flex-1 gap-x-5 gap-y-3",
            "grid-cols-[400px_minmax(0,1fr)] grid-rows-[auto_auto_auto]",
            "min-[1400px]:grid-cols-[400px_auto_minmax(0,1fr)] min-[1400px]:grid-rows-[auto_minmax(0,1fr)]",
          )}
        >
          <aside
            aria-label="Demo scenarios"
            className="row-span-3 flex min-h-0 flex-col gap-3 pb-2 min-[1400px]:row-span-2 min-[1400px]:-me-2 min-[1400px]:overflow-y-auto min-[1400px]:pe-2 min-[1400px]:[scrollbar-width:thin]"
          >
            <PersonaCard />
            <ImpactFigures />
            <h2 className="mt-1 px-1 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {JURY_COPY.scenariosLabel}
            </h2>
            {!live && (
              <p role="status" className="flex items-start gap-2 rounded-[14px] bg-orange-soft px-3.5 py-3 text-sm text-ink">
                <WarningCircle size={18} weight="light" className="mt-0.5 shrink-0 text-orange" aria-hidden />
                {JURY_COPY.livePaused}
              </p>
            )}
            {JURY_SCENARIOS.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                ref={(handle) => {
                  notes.current[scenario.id] = handle;
                }}
                scenario={scenario}
                audio={audio[scenario.id] ?? null}
                replay={status ? status.replays[scenario.label] : undefined}
                live={live}
                active={active?.scenario?.id === scenario.id && active.kind !== "own" ? active.kind : null}
                busy={busy}
                onRunLive={() => runLive(scenario)}
                onReplay={() => runReplay(scenario)}
              />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <ExtraCard
                icon={<Microphone size={22} weight="light" aria-hidden />}
                title={JURY_COPY.ownTitle}
                body={JURY_COPY.ownBody}
                onClick={recordOwn}
                disabled={busy || !live}
              />
              <ExtraCard
                icon={<UserFocus size={22} weight="light" aria-hidden />}
                title={JURY_COPY.onboardingTitle}
                body={JURY_COPY.onboardingBody}
                onClick={() => setOverlay("onboarding")}
              />
            </div>
          </aside>

          <GuidedStrip current={stage} className="col-start-2 min-[1400px]:col-span-2" />

          <section aria-label={JURY_COPY.phoneLabel} className="col-start-2 flex flex-col items-center gap-2">
            <div
              className="relative shrink-0 rounded-[52px] bg-ink shadow-[0_2px_4px_rgba(0,0,0,0.08),0_24px_60px_rgba(11,11,15,0.18)]"
              style={{
                width: PHONE.width * scale + PHONE.bezel * 2,
                height: PHONE.height * scale + PHONE.bezel * 2,
                padding: PHONE.bezel,
              }}
            >
              <div
                className="relative overflow-hidden rounded-[45px] bg-bg"
                style={{ width: PHONE.width * scale, height: PHONE.height * scale }}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{ width: PHONE.width, height: PHONE.height, transform: `scale(${scale})` }}
                >
                  {mounted && (
                    <iframe
                      ref={frame}
                      src="/home?jury=1"
                      title={JURY_COPY.phoneLabel}
                      allow="microphone; autoplay"
                      className="block size-full border-0 bg-bg"
                    />
                  )}
                  <AnimatePresence>
                    {overlay === "onboarding" && <OnboardingReplay key="onboarding" onClose={() => setOverlay(null)} />}
                    {overlay === "end" && (
                      <EndCard
                        key="end"
                        summary={summary}
                        next={next}
                        videoUrl={videoUrl}
                        onNext={() => (canLive(next) ? runLive(next) : runReplay(next))}
                        onOwn={recordOwn}
                        onClose={() => setOverlay(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="flex min-h-6 w-full max-w-[420px] items-center justify-between gap-3 px-2">
              <p role="status" aria-live="polite" className="min-w-0 text-[13px] leading-snug text-muted">
                {notice}
              </p>
              {active && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-card px-3 text-[13px] font-semibold shadow-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  <ArrowCounterClockwise size={15} weight="light" aria-hidden />
                  {JURY_COPY.reset}
                </button>
              )}
            </div>
          </section>

          <section
            aria-label="Under the hood"
            className="col-start-2 flex min-h-[640px] flex-col rounded-sheet bg-card p-6 shadow-soft min-[1400px]:col-start-3 min-[1400px]:row-start-2 min-[1400px]:min-h-0"
          >
            <UnderTheHoodView
              run={phone.run}
              tripEvents={phone.trip?.events}
              onToggleGloss={(show) => send({ type: "gloss", show })}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function ExtraCard({
  icon,
  title,
  body,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start gap-1.5 rounded-card bg-card p-4 text-start shadow-soft transition-transform motion-safe:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="flex size-10 items-center justify-center rounded-pill bg-blue-soft text-blue">{icon}</span>
      <span className="text-[15px] font-extrabold leading-tight">{title}</span>
      <span className="text-[12.5px] leading-snug text-muted">{body}</span>
    </button>
  );
}

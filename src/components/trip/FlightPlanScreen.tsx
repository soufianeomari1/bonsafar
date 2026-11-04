"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck } from "@phosphor-icons/react";
import { Clouds } from "@/components/bs/Clouds";
import { RichText } from "@/components/bs/Brand";
import { Safar, type SafarState } from "@/components/bs/Safar";
import { SplitFlap } from "@/components/bs/SplitFlap";
import { Button } from "@/components/bs/Button";
import { useAgentRun } from "@/lib/agent-client/context";
import {
  activeLegIndex,
  activeStep,
  ensureAgentRun,
  replayLastTrip,
  retryAgentRun,
  skipAgentAnimation,
  withTripSearch,
  type Leg,
} from "@/lib/agent-client/store";
import { readCount, readFlightRows, readHotelRows, readSources, readVisaNeeded } from "@/lib/agent-client/parse";
import { AGENT_STEPS, type AgentStep } from "@/lib/agent/schema";
import { formatTime, formatTripDate, formatWhen } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { translate, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import { useTrip } from "@/lib/trip/useTrip";
import { cn } from "@/lib/utils";
import { AirlineMarks } from "./AirlineMark";
import { PriceFact } from "./PriceFact";

const COPY: Record<AgentStep, { title: TranslationKey; hint: TranslationKey }> = {
  flights: { title: "plan.step.flights", hint: "plan.step.flights.hint" },
  hotels: { title: "plan.step.hotels", hint: "plan.step.hotels.hint" },
  price_trends: { title: "plan.step.price_trends", hint: "plan.step.price_trends.hint" },
  entry_requirements: { title: "plan.step.entry_requirements", hint: "plan.step.entry_requirements.hint" },
  package: { title: "plan.step.package", hint: "plan.step.package.hint" },
};

const ERROR_KEY: Record<string, TranslationKey> = {
  intent_incomplete: "plan.error.intent_incomplete",
  origin_missing: "plan.error.origin_missing",
  timeout: "plan.error.timeout",
  agent_invalid_output: "plan.error.agent_invalid_output",
  agent_failed: "plan.error.agent_failed",
  replay_unavailable: "plan.error.replay_unavailable",
  interrupted: "plan.error.interrupted",
};

const VISA_KEY: Record<string, TranslationKey> = {
  none: "visaKind.none",
  schengen: "visaKind.schengen",
  evisa: "visaKind.evisa",
  on_arrival: "visaKind.on_arrival",
  consular: "visaKind.consular",
  unknown: "visaKind.unknown",
};

let sentRunId: string | null = null;

function doneSignature(legs: Leg[]): string {
  return legs.map((leg) => AGENT_STEPS.map((step) => leg.steps[step].phase).join("")).join("|");
}

/** Screen 05. Safar flies the route; the steps are the stops. */
export function FlightPlanScreen() {
  const run = useAgentRun();
  const trip = useTrip();
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const router = useRouter();
  const [safarY, setSafarY] = useState(0);
  const legRef = useRef<HTMLDivElement>(null);
  const seenDone = useRef("");

  useEffect(() => {
    ensureAgentRun();
  }, []);

  const legIndex = activeLegIndex(run.legs);
  const leg = run.legs[legIndex];
  const step = activeStep(leg);
  const fatal = run.status === "error";
  const packageDone = run.legs.some((item) => item.steps.package.phase === "done");
  const safar: SafarState = fatal ? "oops" : packageDone ? "found" : "thinking";

  useEffect(() => {
    const signature = doneSignature(run.legs);
    if (seenDone.current && signature !== seenDone.current) {
      const previous = seenDone.current.split("|").join("");
      const next = signature.split("|").join("");
      if ([...next].filter((char, index) => char === "d" && previous[index] !== "d").length > 0) {
        // "done" is the only phase that starts with d. A new one is a landing.
        const prevDone = (previous.match(/done/g) ?? []).length;
        const nextDone = (next.match(/done/g) ?? []).length;
        if (nextDone > prevDone) haptic("tick");
      }
    }
    seenDone.current = signature;
  }, [run.legs]);

  useEffect(() => {
    const root = legRef.current;
    const stop = root?.querySelector<HTMLElement>(`[data-step="${step}"]`);
    if (!stop) return;
    setSafarY(stop.offsetTop);
  }, [step, legIndex, run.legs, run.skipped]);

  useEffect(() => {
    if (!run.result || fatal) return;
    if (run.run?.run_id && sentRunId === run.run.run_id) return;
    const go = () => {
      if (!run.run?.run_id || sentRunId === run.run.run_id) return;
      sentRunId = run.run.run_id;
      router.push(withTripSearch("/trip/result"));
    };
    if (run.skipped || reduced) {
      go();
      return;
    }
    const timer = setTimeout(go, 1600);
    return () => clearTimeout(timer);
  }, [run.result, run.run?.run_id, run.skipped, fatal, reduced, router]);

  const kicker = useMemo(() => {
    const origin = trip?.intent?.origin_iata ?? "";
    const dest = run.result?.destination.iata ?? trip?.intent?.destination?.iata ?? "";
    const depart = trip?.intent?.depart_date;
    const back = trip?.intent?.return_date;
    if (!origin && !dest) return "";
    const dates = depart && back ? `${formatTripDate(depart, lang)} → ${formatTripDate(back, lang)}` : "";
    return [origin && dest ? `${origin} → ${dest}` : origin || dest, dates].filter(Boolean).join(" · ");
  }, [trip, run.result, lang]);

  const trailHeight = Math.max(0, safarY);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-sky to-bg">
      <Clouds className="h-40" />
      <header className="relative px-6 pt-[22px]">
        {run.run?.replay && (
          <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-orange">
            {t("plan.replay")}
            {run.run.captured_at ? ` · ${t("plan.captured", { time: formatWhen(run.run.captured_at, lang) })}` : ""}
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {kicker && (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              <bdi>{kicker}</bdi>
            </p>
          )}
          <h1 className="mt-1.5 text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] whitespace-pre-line">
            {t("plan.title")}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => skipAgentAnimation()}
          className="flex h-11 items-center rounded-pill bg-card/80 px-3.5 text-sm font-semibold text-muted"
        >
          {t("plan.skip")}
        </button>
        </div>
      </header>

      <section
        aria-label={t("plan.title")}
        className="relative mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-sheet bg-card px-5 pt-6 shadow-[0_-8px_24px_rgba(0,0,0,0.05)]"
      >
        {run.status === "idle" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-[17px] text-muted">{t("plan.empty")}</p>
            <Link href="/home" className="font-semibold underline underline-offset-4">
              {t("understood.backHome")}
            </Link>
          </div>
        )}

        {run.legs.map((item, index) => {
          const current = index === legIndex && !fatal;
          const visa = readVisaNeeded(item.steps.entry_requirements.done);
          const sources = readSources(item.steps.entry_requirements.progress);
          return (
            <div key={`${item.destination}-${index}`} className="relative mb-6" ref={current ? legRef : undefined}>
              {index > 0 && (
                <p className="mb-4 rounded-[18px] bg-green-soft px-3.5 py-3 text-[15px] font-bold">
                  {t("plan.alt.title", { city: item.destination })}
                </p>
              )}
              {current && (
                <>
                  <div
                    aria-hidden
                    className="absolute start-[27px] top-3 w-1 rounded-sm bg-[repeating-linear-gradient(180deg,var(--color-line)_0_8px,transparent_8px_14px)]"
                    style={{ height: 520 }}
                  />
                  <motion.div
                    aria-hidden
                    className="absolute start-[27px] top-3 w-1 rounded-sm bg-blue"
                    animate={{ height: run.skipped || reduced ? trailHeight : trailHeight }}
                    transition={run.skipped || reduced ? { duration: 0.2 } : { type: "spring", duration: 0.6, bounce: 0.2 }}
                  />
                  <motion.div
                    className="absolute start-0 z-10"
                    animate={{ y: safarY }}
                    transition={run.skipped || reduced ? { duration: 0.2 } : { type: "spring", duration: 0.6, bounce: 0.2 }}
                  >
                    <Safar state={safar} size={62} tilt={-12} />
                  </motion.div>
                </>
              )}
              <ol className="relative flex flex-col gap-[22px] ps-[72px]">
                {AGENT_STEPS.map((name) => (
                  <StepRow key={name} leg={item} name={name} />
                ))}
              </ol>
              {visa?.visa_needed && (
                <div className="ms-[72px] mt-4 rounded-card bg-orange-soft p-3.5">
                  <p className="text-[15px] font-bold">
                    {t("plan.visa.title", {
                      city: item.destination,
                      kind: t(VISA_KEY[visa.visa_kind ?? "unknown"] ?? "visaKind.unknown"),
                    })}
                  </p>
                  {sources[0] && (
                    <a href={sources[0].url} className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-blue underline" target="_blank" rel="noreferrer">
                      {t("plan.visa.source")} · {sources[0].title}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {packageDone && !fatal && (
          <p className="mb-3 ps-[72px] text-sm font-semibold text-green">{t("plan.landed")}</p>
        )}

        {fatal && run.error && (
          <div role="alert" className="mb-4 flex items-start gap-2">
            <Safar state="oops" size={64} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <p className="text-[15px] leading-snug">{t(ERROR_KEY[run.error.code] ?? "plan.error.agent_failed")}</p>
              <div className="grid grid-cols-1 gap-2">
                <Button onClick={() => retryAgentRun()}>{t("common.retry")}</Button>
                <Button variant="secondary" onClick={() => replayLastTrip()}>
                  {t("plan.replayLast")}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2.5 rounded-button bg-bg px-3.5 py-3 mb-5">
          <ShieldCheck size={18} weight="fill" className="shrink-0 text-blue" aria-hidden />
          <p className="text-[13px] leading-snug text-muted">
            <RichText text={t("plan.pricesNote")} />
          </p>
        </div>
      </section>
    </div>
  );
}

function StepRow({ leg, name }: { leg: Leg; name: AgentStep }) {
  const { t, jury, lang } = useLanguage();
  const { profile } = useProfile();
  const run = useAgentRun();
  const phase = leg.steps[name].phase;
  const copy = COPY[name];
  const title = t(copy.title);
  const darija = profile.darija_script === "arab" ? "darija-arab" : "darija-latn";
  const gloss = jury ? translate(darija, copy.title) : t(copy.hint);
  const glossArabic = jury && darija === "darija-arab";
  const running = phase === "start" || phase === "progress";
  const count = readCount(leg.steps[name].done);
  const label =
    phase === "done" && name === "flights" && count != null
      ? t("plan.flightsCount", { count })
      : phase === "done" && name === "hotels" && count != null
        ? t("plan.hotelsCount", { count })
        : phase === "done"
          ? t("plan.status.done")
          : phase === "error"
            ? t("plan.status.error")
            : running
              ? t("plan.status.running")
              : t("plan.status.next");
  const tone =
    phase === "done" ? "bg-green text-card" : phase === "error" ? "bg-orange text-card" : running ? "bg-blue text-card" : "bg-fill text-muted";

  return (
    <li data-step={name} className={cn(phase === "pending" && "opacity-55")}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[17px] font-extrabold">{title}</p>
          {(!jury || run.showGloss) && (
            <p
              className={cn("text-[13px]", running && "shimmer font-semibold", jury ? "italic text-muted" : "text-muted", glossArabic && "font-arabic")}
              dir={glossArabic ? "rtl" : undefined}
              lang={glossArabic ? "ar" : undefined}
            >
              {gloss}
            </p>
          )}
        </div>
        <span className={cn("rounded-md px-1.5 py-1 font-mono text-[11px] font-semibold uppercase", tone)}>
          {phase === "pending" ? label : <SplitFlap value={label} cellClassName="text-[11px]" />}
        </span>
      </div>
      {name === "flights" && <FlightRows data={leg.steps.flights.progress} lang={lang} />}
      {name === "hotels" && <HotelRows data={leg.steps.hotels.progress} lang={lang} />}
    </li>
  );
}

function FlightRows({ data, lang }: { data: unknown; lang: Parameters<typeof PriceFact>[0]["lang"] }) {
  const { t } = useLanguage();
  const run = useAgentRun();
  const rows = readFlightRows(data);
  if (!rows.length) return null;
  return (
    <ul className="mt-2.5 flex flex-col gap-1.5">
      {rows.map((row, index) => {
        const offer = run.offers[row.id];
        const outbound = offer?.kind === "flight" ? offer.attrs.outbound : null;
        return (
          <motion.li
            key={row.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center gap-2 rounded-xl bg-bg px-2.5 py-1"
          >
            <AirlineMarks
              flights={outbound?.flights ?? []}
              carriers={outbound?.carriers ?? row.carriers}
              className="shrink-0 flex-col items-start"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold tabular-nums text-green">
                <bdi>
                  {formatTime(row.departure)} → {formatTime(row.arrival)}
                </bdi>
              </span>
              <span className="block truncate text-xs text-muted">
                {row.stops <= 0 ? t("plan.direct") : row.stops === 1 ? t("plan.stops.one") : t("plan.stops.other", { count: row.stops })}
              </span>
            </span>
            <PriceFact
              amount={offer?.price_mad_display ?? row.price_mad_display}
              source={offer?.source ?? "kiwi.com"}
              fetchedAt={offer?.fetched_at}
              fx={offer?.fx ?? run.run?.fx}
              lang={lang}
              className="text-sm"
            />
          </motion.li>
        );
      })}
    </ul>
  );
}

function HotelRows({ data, lang }: { data: unknown; lang: Parameters<typeof PriceFact>[0]["lang"] }) {
  const run = useAgentRun();
  const rows = readHotelRows(data);
  if (!rows.length) return null;
  return (
    <ul className="mt-2.5 flex flex-col gap-1.5">
      {rows.map((row) => {
        const offer = run.offers[row.id];
        return (
          <li key={row.id} className="flex items-center gap-2 rounded-xl bg-bg px-2.5 py-1">
            <span className="min-w-0 flex-1 truncate text-sm font-bold">{row.name}</span>
            <PriceFact
              amount={offer?.price_mad_display ?? row.price_mad_display}
              source={offer?.source ?? "trivago"}
              fetchedAt={offer?.fetched_at}
              fx={offer?.fx ?? run.run?.fx}
              lang={lang}
              className="text-sm"
            />
          </li>
        );
      })}
    </ul>
  );
}

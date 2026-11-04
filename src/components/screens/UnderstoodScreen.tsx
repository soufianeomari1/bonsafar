"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { CaretLeft, MagnifyingGlass, SealCheck } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Safar, SafarBubble } from "@/components/bs/Safar";
import { ChipEditor } from "@/components/trip/ChipEditor";
import { JuryLabel, JuryLine } from "@/components/trip/JuryLine";
import { QuestionCard } from "@/components/trip/QuestionCard";
import { TranscriptBubble } from "@/components/trip/TranscriptBubble";
import { VisaConflictChoices, VisaIdeaChoices, VisaWarningNote } from "@/components/trip/VisaFollowUp";
import {
  chipsFor,
  flightPairs,
  splitTranscript,
  type IntentChipModel,
} from "@/components/trip/chips";
import { fillBudgetMarker } from "@/lib/intent/budget-marker";
import { haptic } from "@/lib/haptics";
import { hasIndispensableInfo } from "@/lib/intent/edits";
import type { Intent } from "@/lib/intent/schema";
import { useLanguage } from "@/lib/i18n/provider";
import { PRESS_SCALE, PRESS_TRANSITION } from "@/lib/motion";
import { profileForLang, type Airport } from "@/lib/profile/schema";
import { useProfile } from "@/lib/profile/useProfile";
import { replayFromLocation, scenarioFor, startAgentRun, withTripSearch } from "@/lib/agent-client/store";
import { answerTrip, keepVisaDestination, retryTrip } from "@/lib/trip/store";
import { applyVisaPolicy, assessVisa } from "@/lib/visa/policy";
import { useTrip } from "@/lib/trip/useTrip";
import { cn } from "@/lib/utils";

/** Time the highlighted words stay in the sentence before flying (A2). */
const FLIGHT_DELAY_MS = 650;

function originFromProfile(intent: Intent, airport: Airport | null): boolean {
  if (!airport || intent.origin_iata !== airport) return false;
  return !intent.keywords.some((keyword) => keyword.slot === "origin");
}

/** Screen 4. Look: design/motion/screens/04-understood.html. */
export function UnderstoodScreen() {
  const { t, lang, jury } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const job = useTrip();
  const { profile } = useProfile();
  const [english, setEnglish] = useState<boolean | null>(null);
  const [landedRev, setLandedRev] = useState(0);
  const [editing, setEditing] = useState<IntentChipModel | null>(null);

  const showEnglish = english ?? jury;
  const intent = job?.intent ?? null;
  const rev = job?.rev ?? 0;
  const landed = reduced || landedRev === rev;

  useEffect(() => {
    if (!intent || landedRev === rev) return;
    const timer = setTimeout(() => setLandedRev(rev), FLIGHT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [intent, rev, landedRev]);

  const corpus = job ? [job.transcript, ...job.answers.map((answer) => answer.answer)].join("\n") : "";
  const shownIntent = intent ? applyVisaPolicy(intent, profile, corpus) : null;
  const visa = shownIntent ? assessVisa({ intent: shownIntent, profile, corpus, keptCity: job?.visaKeptCity }) : null;
  const fromProfile = !!shownIntent && originFromProfile(shownIntent, profile.home_airport);
  const chips = shownIntent ? chipsFor(shownIntent, lang, t, { originFromProfile: fromProfile }) : [];
  const pairs = shownIntent ? flightPairs(shownIntent, chips) : null;
  const parts =
    intent && job?.transcript ? splitTranscript(job.transcript, intent.keywords) : null;

  if (!job) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-[17px] text-muted">{t("understood.empty")}</p>
        <Link href="/home" className="font-semibold underline underline-offset-4">
          {t("understood.backHome")}
        </Link>
      </div>
    );
  }

  const layoutPrefix = `kw-${job.id}-${rev}`;
  const flyingIds = new Set(pairs?.values() ?? []);
  const translation =
    showEnglish && intent?.translation_en
      ? fillBudgetMarker(intent.translation_en, intent.budget_mad)
      : null;
  const transcribing = job.phase === "transcribing";
  const understanding = job.phase === "understanding";
  const failed = job.phase === "error";
  const visaHold = !!visa && (visa.conflictOpen || visa.ideaIds !== null);
  const canSearch =
    job.phase === "ready" && !!shownIntent && hasIndispensableInfo(shownIntent) && !visa?.conflictOpen;
  /** Nothing to retry: the take itself was too short or silent. */
  const dead = job.error === "short" || job.error === "empty";
  const showChips = !!intent && landed && !failed;
  const asking = showChips && !!intent.question && !visaHold && !understanding && !transcribing;
  const showFound = showChips && !intent.question && !visaHold && !understanding && !transcribing;
  const showVisaFollowUp = showChips && visaHold && !understanding && !transcribing;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg">
      <header className="flex items-center gap-3 px-5 pt-[18px]">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.push("/home")}
          className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-card text-ink"
        >
          <CaretLeft size={18} weight="light" className="rtl:-scale-x-100" />
        </button>
        <h1 className="min-w-0 flex-1 text-xl font-extrabold tracking-[-0.02em]">
          {t("understood.title")}
        </h1>
        <button
          type="button"
          role="switch"
          aria-checked={showEnglish}
          aria-label={t("understood.enToggle")}
          onClick={() => {
            haptic("select");
            setEnglish(!showEnglish);
          }}
          className="flex h-8 shrink-0 items-center rounded-pill bg-card pe-1.5 ps-1.5 shadow-soft"
        >
          <span className="sr-only">{t("understood.enToggle")}</span>
          <span
            aria-hidden
            className={cn(
              "relative inline-block h-5 w-[34px] rounded-pill transition-colors",
              showEnglish ? "bg-green-bright" : "bg-line-strong"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-pill bg-card transition-[inset-inline-start] duration-200",
                showEnglish ? "start-4" : "start-0.5"
              )}
            />
          </span>
        </button>
      </header>

      <LayoutGroup>
        <div className="flex min-h-0 flex-1 flex-col gap-3 scroll-quiet overflow-y-auto px-5 pb-3 pt-5">
          <TranscriptBubble
            audioUrl={job.audioUrl}
            durationMs={job.durationMs}
            levels={job.levels}
            text={job.transcript}
            parts={parts}
            highlighted={!!intent}
            flying={landed ? null : pairs}
            layoutPrefix={layoutPrefix}
            pending={transcribing ? job.partial : null}
            translation={translation}
          />

          {job.transcription?.fallback && (
            <p className="self-end text-xs text-muted">{t("understood.fallback")}</p>
          )}

          {failed ? (
            <div className="flex items-start gap-2">
              <Safar state="oops" size={64} className="shrink-0" />
              <div role="alert" className="flex min-w-0 flex-1 flex-col gap-3 rounded-card bg-card p-3.5 shadow-soft">
                <span className="text-[15px] leading-[1.45]">
                  {job.error === "short"
                    ? t("home.tooShort")
                    : job.error === "empty"
                      ? t("understood.nothingHeard")
                      : t("understood.error")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {!dead && (
                    <Button variant="quiet" onClick={() => void retryTrip()} className="h-12">
                      {t("common.retry")}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/home")}
                    className={cn("h-12", dead && "col-span-2")}
                  >
                    {t("understood.backHome")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showFound && (
                <SafarBubble state="found" size={64} className="-ms-2">
                  <p className="text-base font-bold">{t("understood.safar")}</p>
                  <JuryLine k="understood.safar" />
                </SafarBubble>
              )}

              {!showFound && !asking && !showVisaFollowUp && (
                <SafarBubble state="thinking" size={64} className="-ms-2">
                  <p className="shimmer text-[15px] font-semibold" aria-live="polite">
                    {transcribing ? t("understood.transcribing") : t("understood.thinking")}
                  </p>
                </SafarBubble>
              )}

              {showChips && (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip, index) => {
                    const flies = !reduced && flyingIds.has(chip.id);
                    return (
                      <motion.button
                        key={chip.id}
                        type="button"
                        layoutId={flies ? `${layoutPrefix}-${chip.id}` : undefined}
                        initial={flies || reduced ? false : { opacity: 0, y: -18, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          type: "spring",
                          duration: 0.55,
                          bounce: 0.15,
                          delay: flies ? 0 : 0.6 + index * 0.15,
                        }}
                        whileTap={reduced ? undefined : { scale: PRESS_SCALE, transition: PRESS_TRANSITION }}
                        onClick={() => {
                          haptic("select");
                          setEditing(chip);
                        }}
                        className="flex min-h-11 items-center gap-2 rounded-pill border border-line bg-card pe-3.5 ps-2 text-[15px] font-bold text-ink"
                      >
                        <span className={cn("flex size-[30px] items-center justify-center rounded-pill", chip.tone)}>
                          <chip.icon size={16} weight="light" aria-hidden />
                        </span>
                        <span className="flex flex-col items-start leading-tight">
                          <bdi>{chip.label}</bdi>
                          {chip.note && (
                            <span className="text-[11px] font-medium text-muted">{chip.note}</span>
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                  {visa?.showVisaFreeChip && (
                    <div className="flex min-h-11 items-center gap-2 rounded-pill border border-line bg-card pe-3.5 ps-2 text-[15px] font-bold text-ink">
                      <span className="flex size-[30px] items-center justify-center rounded-pill bg-green-soft text-green">
                        <SealCheck size={16} weight="light" aria-hidden />
                      </span>
                      <bdi>{t("understood.visaFree")}</bdi>
                    </div>
                  )}
                </div>
              )}

              {showChips && visa?.warning && <VisaWarningNote warning={visa.warning} />}

              <AnimatePresence mode="wait" initial={false}>
                {showVisaFollowUp && visa?.ideaIds && (
                  <motion.div
                    key="visa-ideas"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-16 shrink-0 pt-1">
                      <Safar state="thinking" size={64} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <VisaIdeaChoices
                        ids={visa.ideaIds}
                        onPick={(answer) => void answerTrip(t("understood.visaWhere"), answer)}
                      />
                    </div>
                  </motion.div>
                )}
                {showVisaFollowUp && visa?.conflictOpen && shownIntent?.destination && (
                  <motion.div
                    key="visa-conflict"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-16 shrink-0 pt-1">
                      <Safar state="thinking" size={64} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <VisaConflictChoices
                        city={shownIntent.destination.city}
                        onIdeas={() => {
                          haptic("select");
                          const path = withTripSearch("/home");
                          const url = new URL(path, window.location.origin);
                          url.searchParams.set("ideas", "visa-free");
                          router.push(`${url.pathname}${url.search}`);
                        }}
                        onKeep={() => {
                          haptic("select");
                          keepVisaDestination(shownIntent.destination?.city ?? "");
                        }}
                      />
                    </div>
                  </motion.div>
                )}
                {asking && intent.question && (
                  <motion.div
                    key={`question-${intent.question.field}`}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-start gap-2"
                  >
                    <div className="w-16 shrink-0 pt-1">
                      <Safar state="thinking" size={64} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <QuestionCard
                        question={intent.question}
                        onAnswer={(question, answer) => void answerTrip(question, answer)}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </LayoutGroup>

      <div className="flex flex-col gap-2.5 px-5 pb-[22px] pt-2">
        <p className="text-center text-[13px] text-muted">{t("understood.tapHint")}</p>
        <Button
          full
          disabled={!canSearch}
          onClick={() => {
            const replay = replayFromLocation();
            if (replay) startAgentRun({ replay: true, scenario: replay }, replay);
            else if (shownIntent) {
              const scenario = scenarioFor(shownIntent);
              startAgentRun({ intent: shownIntent, profile: profileForLang(profile, lang), lang, jury, scenario }, scenario);
            }
            router.push(withTripSearch("/trip/plan"));
          }}
          className="font-bold"
        >
          <MagnifyingGlass size={18} weight="light" aria-hidden />
          <JuryLabel k="understood.go" />
        </Button>
      </div>

      <ChipEditor chip={editing} intent={intent} onClose={() => setEditing(null)} />
    </div>
  );
}

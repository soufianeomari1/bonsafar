"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CaretLeft, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Logo } from "@/components/bs/Brand";
import { ChipEditor } from "@/components/trip/ChipEditor";
import { QuestionCard } from "@/components/trip/QuestionCard";
import { TranscriptBubble } from "@/components/trip/TranscriptBubble";
import {
  chipsFor,
  flightPairs,
  splitTranscript,
  type IntentChipModel,
} from "@/components/trip/chips";
import { formatAmount } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { hasIndispensableInfo } from "@/lib/intent/edits";
import { useLanguage } from "@/lib/i18n/provider";
import { PRESS_SCALE, PRESS_TRANSITION } from "@/lib/motion";
import { answerTrip, retryTrip } from "@/lib/trip/store";
import { useTrip } from "@/lib/trip/useTrip";
import { cn } from "@/lib/utils";

/** Time the highlighted words stay in the sentence before flying (A2). */
const FLIGHT_DELAY_MS = 650;

/** Screen 4, mockup 04-Compris. */
export function UnderstoodScreen() {
  const { t, lang, jury } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const job = useTrip();
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

  const chips = intent ? chipsFor(intent, lang, t) : [];
  const pairs = intent ? flightPairs(intent, chips) : null;
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
      ? intent.translation_en.replaceAll(
          "{budget}",
          intent.budget_mad ? `${formatAmount(intent.budget_mad, "en")} DH` : ""
        )
      : null;
  const transcribing = job.phase === "transcribing";
  const understanding = job.phase === "understanding";
  const canSearch = job.phase === "ready" && !!intent && hasIndispensableInfo(intent);
  /** Nothing to retry: the take itself was too short or silent. */
  const dead = job.error === "short" || job.error === "empty";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bg">
      <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-line bg-card pe-4 ps-2">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.push("/home")}
          className="flex size-10 items-center justify-center text-ink"
        >
          <CaretLeft size={20} weight="bold" className="rtl:-scale-x-100" />
        </button>
        <Logo size="sm" />
        <span className="flex-1 text-[17px] font-bold" dir="ltr">
          BonSafar
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={showEnglish}
          onClick={() => {
            haptic("select");
            setEnglish(!showEnglish);
          }}
          className="flex h-8 items-center gap-2 rounded-pill bg-fill pe-1.5 ps-3 text-[13px] font-semibold"
        >
          {t("understood.enToggle")}
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
        <div className="flex min-h-0 flex-1 flex-col gap-3 scroll-quiet overflow-y-auto px-3.5 pb-3 pt-3.5">
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

          {job.phase === "error" ? (
            <div role="alert" className="flex flex-col gap-3 rounded-card bg-card p-3.5">
              <span className="flex items-start gap-2 text-[15px] leading-[1.45]">
                <WarningCircle size={20} weight="fill" className="shrink-0 text-red" aria-hidden />
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
          ) : (
            <section className="flex flex-col gap-2.5 rounded-card bg-card p-3.5">
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[19px] font-extrabold">{t("understood.title")}</span>
                {intent && <span className="text-[13px] text-muted">{t("understood.editHint")}</span>}
              </span>
              {intent && landed ? (
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip, index) => {
                    const flies = !reduced && flyingIds.has(chip.id);
                    return (
                      <motion.button
                        key={chip.id}
                        type="button"
                        layoutId={flies ? `${layoutPrefix}-${chip.id}` : undefined}
                        initial={flies || reduced ? false : { opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          type: "spring",
                          duration: 0.55,
                          bounce: 0.15,
                          delay: flies ? 0 : 0.2 + index * 0.06,
                        }}
                        whileTap={reduced ? undefined : { scale: PRESS_SCALE, transition: PRESS_TRANSITION }}
                        onClick={() => {
                          haptic("select");
                          setEditing(chip);
                        }}
                        className="flex h-11 items-center gap-2 rounded-pill border border-line bg-card pe-3.5 ps-1.5 text-[15px] font-semibold text-ink"
                      >
                        <span className={cn("flex size-8 items-center justify-center rounded-pill", chip.tone)}>
                          <chip.icon size={17} weight="fill" aria-hidden />
                        </span>
                        <bdi>{chip.label}</bdi>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <span className="shimmer text-[15px] font-semibold" aria-live="polite">
                  {transcribing ? t("understood.transcribing") : t("understood.thinking")}
                </span>
              )}
            </section>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {intent?.question && job.phase !== "error" &&
              (understanding ? (
                <motion.div
                  key="question-thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.2 : 0.3 }}
                  className="rounded-card bg-card p-3.5"
                >
                  <span className="shimmer text-[15px] font-semibold">{t("understood.thinking")}</span>
                </motion.div>
              ) : (
                <motion.div
                  key={`question-${intent.question.field}`}
                  initial={false}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
                >
                  <QuestionCard
                    question={intent.question}
                    onAnswer={(question, answer) => void answerTrip(question, answer)}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      <div className="px-3.5 pb-[22px] pt-3">
        <Button
          full
          disabled={!canSearch}
          onClick={() => router.push("/trip/search")}
          className="gap-2.5"
        >
          {t("understood.go")}
          <ArrowRight size={18} weight="bold" className="rtl:-scale-x-100" aria-hidden />
        </Button>
      </div>

      <ChipEditor chip={editing} intent={intent} onClose={() => setEditing(null)} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { QUESTION_FIELDS, QUESTION_TEXT } from "@/components/profile/ExpressQuestions";
import { GoogleAvatar } from "@/components/profile/GoogleAvatar";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import { QUESTIONS, isAnswered, type Profile, type Question } from "@/lib/profile/schema";
import type { ProfilePatch } from "@/lib/profile/store";
import { useProfile } from "@/lib/profile/useProfile";
import { readTrip } from "@/lib/trip/store";
import { cn } from "@/lib/utils";

/** What the last request already told us: never asked again, only confirmed. */
function guessFromLastRequest(profile: Profile): ProfilePatch {
  const intent = readTrip()?.intent;
  if (!intent) return {};
  const patch: ProfilePatch = {};
  if (!profile.home_airport && intent.origin_iata) patch.home_airport = intent.origin_iata;
  if (!profile.companions) {
    if (intent.children > 0) patch.companions = "family";
    else if (intent.adults === 1) patch.companions = "solo";
    else if (intent.adults === 2) patch.companions = "duo";
  }
  return patch;
}

/**
 * Screen 01, the express profile: four questions, one per screen, right after
 * Google ("Compte 1" and "Compte 2" of postfetch-compte-v2.html). Only the
 * questions not answered yet are asked; "Later" is always there.
 */
export function OnboardingScreen() {
  const router = useRouter();
  const { ready, profile } = useProfile();

  const onboarded = ready && profile.prefs.onboarded;
  useEffect(() => {
    if (onboarded) router.replace("/home");
  }, [onboarded, router]);

  if (!ready || onboarded) return <div className="flex-1 bg-bg" />;
  return <ExpressProfile />;
}

/** Mounted once the profile is loaded: the questions to ask are fixed at that moment. */
function ExpressProfile() {
  const { t, lang, jury } = useLanguage();
  const reduced = useReducedMotion();
  const { profile, user, update } = useProfile();
  const [steps] = useState<Question[]>(() => QUESTIONS.filter((question) => !isAnswered(profile, question)));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // The language picked on screen 0 is kept in the profile.
    const guess = { ...guessFromLastRequest(profile), ...(!jury && profile.ui_lang !== lang ? { ui_lang: lang } : {}) };
    if (Object.keys(guess).length) void update(guess);
    if (steps.length === 0) void update({ prefs: { onboarded: true } });
    // Once, with the profile as it was loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (steps.length === 0) return <div className="flex-1 bg-bg" />;

  const question = steps[index];
  const Fields = QUESTION_FIELDS[question];
  const text = QUESTION_TEXT[question];
  const last = index === steps.length - 1;
  const position = QUESTIONS.indexOf(question);
  const name = profile.first_name?.trim();

  function finish() {
    haptic("success");
    void update({ prefs: { onboarded: true } });
  }

  function next() {
    if (last) finish();
    else setIndex(index + 1);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[linear-gradient(180deg,var(--color-sky)_0,var(--color-blue-soft)_200px,var(--color-bg)_340px)]"
      />

      <div className="relative px-5 pt-5">
        <div className="flex h-9 items-center justify-between gap-3">
          {index > 0 ? (
            <button
              type="button"
              aria-label={t("common.back")}
              onClick={() => setIndex(index - 1)}
              className="flex size-9 items-center justify-center rounded-pill bg-card shadow-soft"
            >
              <ArrowLeft size={18} className="rtl:-scale-x-100" aria-hidden />
            </button>
          ) : (
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted rtl:font-arabic rtl:text-xs rtl:tracking-normal">
              {t("express.step", { current: position + 1, total: QUESTIONS.length })}
            </span>
          )}
          {index > 0 && (
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted rtl:font-arabic rtl:text-xs rtl:tracking-normal">
              {t("express.step", { current: position + 1, total: QUESTIONS.length })}
            </span>
          )}
          <button
            type="button"
            onClick={finish}
            className="min-h-11 text-[13px] font-semibold text-muted underline decoration-line-strong underline-offset-[3px]"
          >
            {t("express.later")}
          </button>
        </div>
        <div className="mt-2.5 flex gap-[5px]" aria-hidden>
          {QUESTIONS.map((q, i) => (
            <span key={q} className={cn("h-1 flex-1 rounded-sm", i <= position ? "bg-ink" : "bg-track")} />
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 scroll-quiet overflow-y-auto px-5 pb-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={question}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            {user && index === 0 && <GoogleAvatar className="mt-6" />}
            <h1 className="mt-6 whitespace-pre-line text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] rtl:leading-tight rtl:tracking-normal">
              {index === 0 && name ? `${t("express.hello", { name })}\n` : ""}
              {t(text.title)}
            </h1>
            <p className="mt-2 text-[14.5px] leading-[1.45] text-muted">{t(text.why)}</p>
            <div className="mt-5">
              <Fields profile={profile} update={update} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative px-5 pb-[22px] pt-2">
        <Button full feedback={last ? null : "tap"} onClick={next} className="font-bold">
          {last ? t("common.finish") : t("common.next")}
        </Button>
      </div>
    </div>
  );
}

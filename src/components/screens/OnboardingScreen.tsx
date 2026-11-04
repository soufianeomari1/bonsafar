"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CaretLeft } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Clouds } from "@/components/bs/Clouds";
import { ProgressSegments } from "@/components/bs/Choice";
import { SafarBubble } from "@/components/bs/Safar";
import {
  LanguageFields,
  PapersFields,
  StyleFields,
  TripFields,
  type FieldsProps,
} from "@/components/profile/ProfileFields";
import { haptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

type Step = {
  ask: TranslationKey;
  gloss: TranslationKey;
  Fields: (props: FieldsProps) => React.ReactNode;
};

const STEPS: Step[] = [
  {
    ask: "onboarding.language.ask",
    gloss: "onboarding.language.title",
    Fields: LanguageFields,
  },
  {
    ask: "onboarding.trip.title",
    gloss: "onboarding.trip.subtitle",
    Fields: TripFields,
  },
  {
    ask: "onboarding.papers.title",
    gloss: "onboarding.papers.subtitle",
    Fields: PapersFields,
  },
  {
    ask: "onboarding.style.title",
    gloss: "onboarding.style.subtitle",
    Fields: StyleFields,
  },
];

/** Screen 1, the 4 profile questions. Look: design/motion/screens/01a-onboarding.html. */
export function OnboardingScreen() {
  const { t, lang, jury } = useLanguage();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { ready, profile, update } = useProfile();
  const [index, setIndex] = useState(0);

  const onboarded = ready && profile.prefs.onboarded;
  useEffect(() => {
    if (onboarded) router.replace("/home");
  }, [onboarded, router]);

  // The language picked on screen 0 is the starting answer of step 1.
  useEffect(() => {
    if (ready && !profile.prefs.onboarded && !jury && profile.ui_lang !== lang) {
      void update({ ui_lang: lang });
    }
    // Only once the profile is loaded; later changes come from step 1 itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const language = index === 0;

  function next() {
    if (!last) {
      setIndex(index + 1);
      return;
    }
    haptic("success");
    void update({ prefs: { onboarded: true } });
  }

  function back() {
    if (index === 0) router.push("/");
    else setIndex(index - 1);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-sky to-bg"
      />
      <Clouds layers={[{ top: 120, width: 80, opacity: 1, duration: 44, delay: 0 }]} />

      <div className="relative flex items-center gap-3 px-5 pt-[18px]">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={back}
          className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-card text-ink"
        >
          <CaretLeft size={18} weight="light" className="rtl:-scale-x-100" />
        </button>
        <ProgressSegments
          total={STEPS.length}
          done={index + 1}
          label={t("onboarding.step", { current: index + 1, total: STEPS.length })}
          pendingClassName="bg-card"
          className="flex-1"
        />
        <button
          type="button"
          onClick={next}
          className="shrink-0 text-[15px] font-semibold text-muted"
        >
          {t("common.skip")}
        </button>
      </div>

      <div className="relative min-h-0 flex-1 scroll-quiet overflow-y-auto px-5 pb-4 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-5"
          >
            <SafarBubble state="idle" size={language ? 96 : 64} className="-ms-1">
              <p className="text-lg font-bold leading-snug">{t(step.ask)}</p>
              <p className="mt-1 text-sm text-muted">{t(step.gloss)}</p>
            </SafarBubble>
            <step.Fields profile={profile} update={update} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative flex flex-col gap-2.5 px-5 pb-[22px]">
        {language && (
          <p className="text-center text-[13px] text-muted">{t("onboarding.language.note")}</p>
        )}
        <Button full feedback={last ? null : "tap"} onClick={next} className="font-bold">
          {last ? t("common.finish") : t("common.next")}
        </Button>
      </div>
    </div>
  );
}

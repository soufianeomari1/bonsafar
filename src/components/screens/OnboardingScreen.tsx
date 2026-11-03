"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AirplaneTakeoff,
  IdentificationCard,
  Sparkle,
  Translate,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { IconCircle } from "@/components/bs/IconCircle";
import { ProgressSegments } from "@/components/bs/Choice";
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
  icon: Icon;
  title: TranslationKey;
  subtitle: TranslationKey;
  Fields: (props: FieldsProps) => React.ReactNode;
};

const STEPS: Step[] = [
  {
    icon: Translate,
    title: "onboarding.language.title",
    subtitle: "onboarding.language.subtitle",
    Fields: LanguageFields,
  },
  {
    icon: AirplaneTakeoff,
    title: "onboarding.trip.title",
    subtitle: "onboarding.trip.subtitle",
    Fields: TripFields,
  },
  {
    icon: IdentificationCard,
    title: "onboarding.papers.title",
    subtitle: "onboarding.papers.subtitle",
    Fields: PapersFields,
  },
  {
    icon: Sparkle,
    title: "onboarding.style.title",
    subtitle: "onboarding.style.subtitle",
    Fields: StyleFields,
  },
];

/** Screen 1, the 4 profile questions (mockups 01a and 01b). */
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

  function next() {
    if (!last) {
      setIndex(index + 1);
      return;
    }
    haptic("success");
    void update({ prefs: { onboarded: true } });
  }

  const hello = profile.first_name
    ? ` · ${t("onboarding.hello", { name: profile.first_name })}`
    : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="text-[13px] font-semibold text-muted">
          {t("onboarding.step", { current: index + 1, total: STEPS.length })}
          {hello}
        </span>
        <Button variant="link" feedback={null} onClick={next} className="h-10 px-3">
          {t("common.skip")}
        </Button>
      </div>

      <div className="min-h-0 flex-1 scroll-quiet overflow-y-auto px-5 pb-4 pt-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <IconCircle icon={step.icon} tone="blue" size={48} />
              <h1 className="mt-1 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em]">
                {t(step.title)}
              </h1>
              <p className="text-[17px] leading-[1.45] text-muted">{t(step.subtitle)}</p>
            </div>
            <step.Fields profile={profile} update={update} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3.5 px-5 pb-[22px] pt-2">
        <ProgressSegments total={STEPS.length} done={index + 1} />
        <Button full feedback={last ? null : "tap"} onClick={next}>
          {last ? t("common.finish") : t("common.next")}
        </Button>
      </div>
    </div>
  );
}

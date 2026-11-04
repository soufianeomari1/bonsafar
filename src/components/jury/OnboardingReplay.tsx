"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, X } from "@phosphor-icons/react";
import { Clouds } from "@/components/bs/Clouds";
import { SafarBubble } from "@/components/bs/Safar";
import { JURY_COPY } from "@/lib/jury/copy";
import { cn } from "@/lib/utils";

/** Each step: the question, then her answer lands. */
const STEP_MS = 2600;
const ANSWER_MS = 900;

/** Fatima's four profile steps, sped up, inside the phone. */
export function OnboardingReplay({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();
  const steps = JURY_COPY.onboarding;
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const done = index >= steps.length;

  useEffect(() => {
    if (done) {
      const timer = setTimeout(onClose, 2200);
      return () => clearTimeout(timer);
    }
    const answer = setTimeout(() => setAnswered(true), ANSWER_MS);
    const next = setTimeout(() => {
      setAnswered(false);
      setIndex((value) => value + 1);
    }, STEP_MS);
    return () => {
      clearTimeout(answer);
      clearTimeout(next);
    };
  }, [index, done, onClose]);

  const step = steps[Math.min(index, steps.length - 1)];
  const fade = { duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] as const };

  return (
    <motion.div
      role="dialog"
      aria-modal="false"
      aria-label={JURY_COPY.onboardingTitle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={fade}
      className="absolute inset-0 z-20 flex flex-col bg-sky-gradient"
    >
      <Clouds />
      <div className="relative flex items-center justify-between px-5 pt-5">
        <ol className="flex gap-1.5" aria-label={done ? JURY_COPY.onboardingDone : JURY_COPY.onboardingStep(index + 1)}>
          {steps.map((item, i) => (
            <li
              key={item.question}
              className={cn(
                "h-1.5 w-10 rounded-pill transition-colors duration-300",
                i < index || done ? "bg-ink" : i === index ? "bg-blue" : "bg-card",
              )}
            />
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the onboarding"
          className="flex size-11 items-center justify-center rounded-pill bg-card/80 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
        >
          <X size={18} weight="light" aria-hidden />
        </button>
      </div>

      <div className="relative mt-16 flex flex-1 flex-col gap-6 px-5" aria-live="polite">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          {done ? JURY_COPY.onboardingDone : JURY_COPY.onboardingStep(index + 1)}
        </p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={done ? "done" : index}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={fade}
            className="flex flex-col gap-5"
          >
            <SafarBubble state={done ? "found" : "idle"} size={64}>
              <p className="text-[17px] font-bold leading-snug">
                {done ? JURY_COPY.onboardingDone : step.question}
              </p>
            </SafarBubble>
            {!done && (
              <motion.div
                initial={false}
                animate={answered ? { opacity: 1, y: 0 } : { opacity: 0, y: reduced ? 0 : 10 }}
                transition={fade}
                className="flex h-16 items-center justify-between rounded-[18px] border-2 border-ink bg-card px-4"
              >
                <span className="text-base font-bold">{step.answer}</span>
                <span className="flex size-6 items-center justify-center rounded-full bg-ink text-card">
                  <Check size={14} weight="bold" aria-hidden />
                </span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

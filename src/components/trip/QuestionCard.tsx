"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import type { Intent } from "@/lib/intent/schema";
import { enterTransition, enterVariants } from "@/lib/motion";

type Question = NonNullable<Intent["question"]>;

/** The single question of mockup 04, with quick replies. */
export function QuestionCard({
  question,
  onAnswer,
}: {
  question: Question;
  onAnswer: (question: string, answer: string) => void;
}) {
  const { t, lang, jury } = useLanguage();
  const reduced = useReducedMotion();
  const [other, setOther] = useState(false);
  const [text, setText] = useState("");

  const english = jury || lang === "en";
  const title = english ? question.en : question.darija;
  const subtitle = english ? question.darija : question.fr;
  const asked = english ? question.en : question.fr;

  function answer(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    haptic("select");
    onAnswer(asked, trimmed);
  }

  return (
    <motion.section
      variants={enterVariants(reduced)}
      initial="hidden"
      animate="visible"
      transition={enterTransition(reduced)}
      className="flex flex-col gap-3 rounded-card bg-card p-3.5"
    >
      <span className="self-start rounded-md bg-yellow px-2 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-ink">
        {t("understood.questionBadge")}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-extrabold" dir="auto">
          {title}
        </span>
        <span className="text-[15px] text-muted" dir="auto">
          {subtitle}
        </span>
      </span>
      {question.options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((option, index) => {
            const label = english ? option.en : option.darija;
            return (
              <button
                key={index}
                type="button"
                onClick={() => answer(english ? option.en : option.fr)}
                dir="auto"
                className="flex min-h-[52px] items-center justify-center rounded-button-sm bg-fill px-3 text-center text-[17px] font-bold text-ink"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
      {other ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            answer(text);
          }}
          className="flex h-[52px] items-center gap-2 rounded-button bg-bg pe-2 ps-4"
        >
          <input
            autoFocus
            dir="auto"
            value={text}
            aria-label={t("understood.answerPlaceholder")}
            placeholder={t("understood.answerPlaceholder")}
            onChange={(event) => setText(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label={t("home.send")}
            disabled={!text.trim()}
            className="flex size-9 items-center justify-center rounded-xl bg-ink text-card disabled:opacity-40"
          >
            <ArrowRight size={16} weight="bold" className="rtl:-scale-x-100" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOther(true)}
          className="h-9 text-[15px] font-semibold text-ink underline underline-offset-4"
        >
          {t("understood.otherAnswer")}
        </button>
      )}
    </motion.section>
  );
}

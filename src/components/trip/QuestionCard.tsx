"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { useModelText, type ModelLine } from "@/lib/agent-client/model-text";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import type { Intent } from "@/lib/intent/schema";
import { enterTransition, enterVariants } from "@/lib/motion";

type Question = NonNullable<Intent["question"]>;

/** The single question of mockup 04, with quick replies, in the interface language. */
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
  const title = useModelText(question, lang);

  function answer(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    haptic("select");
    onAnswer(title.text || question.en, trimmed);
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
        {title.pending ? (
          <span aria-busy="true" className="block h-7 w-4/5 animate-pulse rounded-full bg-fill" />
        ) : (
          <span className={title.arabic ? "font-arabic text-xl font-extrabold" : "text-xl font-extrabold"} dir="auto">
            {title.text}
          </span>
        )}
        {jury && (
          <span className="text-[15px] text-muted" dir="auto">
            {question.darija}
          </span>
        )}
      </span>
      {question.options.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((option, index) => (
            <OptionButton key={index} option={option} onPick={answer} />
          ))}
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

function OptionButton({ option, onPick }: { option: ModelLine; onPick: (answer: string) => void }) {
  const { lang } = useLanguage();
  const label = useModelText(option, lang);
  return (
    <button
      type="button"
      disabled={label.pending}
      onClick={() => onPick(label.text || option.en)}
      dir="auto"
      className={
        label.arabic
          ? "flex min-h-[52px] items-center justify-center rounded-button-sm bg-fill px-3 text-center font-arabic text-[17px] font-bold text-ink"
          : "flex min-h-[52px] items-center justify-center rounded-button-sm bg-fill px-3 text-center text-[17px] font-bold text-ink"
      }
    >
      {label.pending ? <span aria-hidden className="block h-4 w-16 animate-pulse rounded-full bg-line" /> : label.text}
    </button>
  );
}

"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CaretDown, Check, Globe } from "@phosphor-icons/react";
import { Sheet } from "@/components/bs/Sheet";
import { haptic } from "@/lib/haptics";
import type { Lang, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const NAME: Record<Lang, TranslationKey> = {
  fr: "lang.fr",
  "darija-latn": "lang.darija-latn",
  "darija-arab": "lang.darija-arab",
  ar: "lang.ar",
  en: "lang.en",
};

const SAMPLE: Record<Lang, TranslationKey> = {
  fr: "lang.sample.fr",
  "darija-latn": "lang.sample.darija-latn",
  "darija-arab": "lang.sample.darija-arab",
  ar: "lang.sample.ar",
  en: "lang.sample.en",
};

type Option = {
  id: string;
  code: string;
  lang: Lang;
  /** Darija keeps the script already chosen. */
  matches: (lang: Lang) => boolean;
  pick: (lang: Lang) => Lang;
  arabic?: boolean;
};

/** The four languages of screen 0. Script choice stays in onboarding. */
const OPTIONS: Option[] = [
  {
    id: "fr",
    code: "FR",
    lang: "fr",
    matches: (lang) => lang === "fr",
    pick: () => "fr",
  },
  {
    id: "darija",
    code: "DR",
    lang: "darija-latn",
    matches: (lang) => lang === "darija-latn" || lang === "darija-arab",
    pick: (lang) => (lang === "darija-arab" ? "darija-arab" : "darija-latn"),
  },
  {
    id: "ar",
    code: "AR",
    lang: "ar",
    arabic: true,
    matches: (lang) => lang === "ar",
    pick: () => "ar",
  },
  {
    id: "en",
    code: "EN",
    lang: "en",
    matches: (lang) => lang === "en",
    pick: () => "en",
  },
];

function codeFor(lang: Lang): string {
  return OPTIONS.find((option) => option.matches(lang))?.code ?? "FR";
}

/** Globe, language code, chevron. Opens a sheet with the four languages. */
export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const root =
    open && typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-phone-root]")
      : null;

  const sheet = (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title={t("onboarding.language.groupLabel")}
    >
      <div
        role="radiogroup"
        aria-label={t("onboarding.language.groupLabel")}
        className="mt-4 flex flex-col gap-2.5"
      >
        {OPTIONS.map((option) => {
          const selected = option.matches(lang);
          const nameLang = option.id === "darija" && lang === "darija-arab" ? "darija-arab" : option.lang;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                haptic("select");
                setLang(option.pick(lang));
                setOpen(false);
              }}
              className={cn(
                "flex h-16 items-center justify-between rounded-[18px] bg-card px-4 text-start",
                selected ? "border-2 border-ink" : "border border-line"
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className={cn("text-base font-bold", option.arabic && "font-arabic")}>
                  {t(NAME[nameLang])}
                </span>
                <span
                  className={cn(
                    "text-[13px] text-muted",
                    (option.arabic || nameLang === "darija-arab") && "font-arabic leading-relaxed"
                  )}
                >
                  {t(SAMPLE[nameLang])}
                </span>
              </span>
              {selected ? (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink text-card">
                  <Check size={14} weight="bold" aria-hidden />
                </span>
              ) : (
                <span aria-hidden className="size-[22px] shrink-0 rounded-full border-2 border-line" />
              )}
            </button>
          );
        })}
      </div>
    </Sheet>
  );

  return (
    <>
      <button
        type="button"
        aria-label={t("welcome.language.change", { language: t(NAME[lang]) })}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-pill border border-line bg-card px-3 text-sm font-semibold text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
          className
        )}
      >
        <Globe size={16} weight="bold" aria-hidden />
        <span dir="ltr">{codeFor(lang)}</span>
        <CaretDown size={12} weight="bold" className="text-muted" aria-hidden />
      </button>
      {root ? createPortal(sheet, root) : null}
    </>
  );
}

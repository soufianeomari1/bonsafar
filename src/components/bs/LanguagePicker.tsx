"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
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
  lang: Lang;
  /** Darija keeps the script already chosen. */
  matches: (lang: Lang) => boolean;
  pick: (lang: Lang) => Lang;
  arabic?: boolean;
};

/** Codes shown on the welcome pill, as in 00-welcome-v12.html. */
const CODE: Record<Lang, string> = {
  fr: "FR",
  en: "EN",
  ar: "ع",
  "darija-latn": "DARIJA",
  "darija-arab": "دارجة",
};

/** The four languages of screen 0. Script choice stays in onboarding. */
const OPTIONS: Option[] = [
  {
    id: "fr",
    lang: "fr",
    matches: (lang) => lang === "fr",
    pick: () => "fr",
  },
  {
    id: "darija",
    lang: "darija-latn",
    matches: (lang) => lang === "darija-latn" || lang === "darija-arab",
    pick: (lang) => (lang === "darija-arab" ? "darija-arab" : "darija-latn"),
  },
  {
    id: "ar",
    lang: "ar",
    arabic: true,
    matches: (lang) => lang === "ar",
    pick: () => "ar",
  },
  {
    id: "en",
    lang: "en",
    matches: (lang) => lang === "en",
    pick: () => "en",
  },
];

/**
 * Globe, language code, chevron. Opens a sheet with the four languages.
 * `legal` adds the judges' pill and the terms links, used on the welcome screen
 * so they stay one tap from the top without crowding the one-page layout.
 */
export function LanguagePicker({
  className,
  legal = false,
}: {
  className?: string;
  legal?: boolean;
}) {
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
      {legal && (
        <nav className="mt-5 flex justify-center gap-4 border-t border-line pt-4 text-[13px]">
          <Link
            href="/terms"
            className="font-semibold text-ink underline underline-offset-2"
            onClick={() => setOpen(false)}
          >
            {t("welcome.legal.terms")}
          </Link>
          <Link
            href="/privacy"
            className="font-semibold text-ink underline underline-offset-2"
            onClick={() => setOpen(false)}
          >
            {t("welcome.legal.privacy")}
          </Link>
        </nav>
      )}
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
          "flex h-[38px] shrink-0 items-center gap-1.5 rounded-[13px] bg-bg px-3 font-sans text-[13px] font-semibold text-ink",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
          className
        )}
      >
        <Globe size={16} weight="bold" aria-hidden />
        <span dir="ltr" className={lang === "ar" || lang === "darija-arab" ? "font-arabic" : undefined}>
          {CODE[lang]}
        </span>
        <CaretDown size={12} weight="bold" className="text-muted" aria-hidden />
      </button>
      {root ? createPortal(sheet, root) : null}
    </>
  );
}

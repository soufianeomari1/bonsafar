"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { LANGUAGES, isRtl, type Lang } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";

const SHORT_LABELS: Record<Lang, string> = {
  fr: "FR",
  "darija-latn": "Darija",
  "darija-arab": "دارجة",
  ar: "عربي",
  en: "EN",
};

/** The language pill of screen 0, with the 5 dictionaries we ship. */
export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-pill bg-card p-1 shadow-soft",
        className
      )}
    >
      {LANGUAGES.map((option) => {
        const selected = option === lang;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              haptic("select");
              setLang(option);
            }}
            className={cn(
              "flex h-8 items-center rounded-pill px-2.5 text-[13px] font-semibold transition-colors",
              selected ? "bg-ink text-card" : "text-ink",
              isRtl(option) && "font-arabic text-sm"
            )}
          >
            {SHORT_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

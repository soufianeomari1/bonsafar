"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import type { Lang } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";

type PickerOption = { id: string; label: string; arabic?: boolean; matches: (lang: Lang) => boolean; pick: (lang: Lang) => Lang };

/** Darija keeps the script already chosen; the onboarding asks for it. */
const OPTIONS: PickerOption[] = [
  { id: "fr", label: "FR", matches: (l) => l === "fr", pick: () => "fr" },
  {
    id: "darija",
    label: "Darija",
    matches: (l) => l === "darija-latn" || l === "darija-arab",
    pick: (l) => (l === "darija-arab" ? "darija-arab" : "darija-latn"),
  },
  { id: "ar", label: "عربي", arabic: true, matches: (l) => l === "ar", pick: () => "ar" },
  { id: "en", label: "EN", matches: (l) => l === "en", pick: () => "en" },
];

/** The language pill of screen 0. */
export function LanguagePicker({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      dir="ltr"
      className={cn(
        "inline-flex gap-1 rounded-pill bg-card p-1 shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      {OPTIONS.map((option) => {
        const selected = option.matches(lang);
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              haptic("select");
              setLang(option.pick(lang));
            }}
            className={cn(
              "flex h-[30px] items-center rounded-pill px-2.5 text-[13px] font-semibold transition-colors",
              selected ? "bg-ink text-card" : "text-ink",
              option.arabic && "font-arabic text-sm"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

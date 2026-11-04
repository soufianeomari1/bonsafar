"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { JuryLabel, JuryLine } from "@/components/trip/JuryLine";
import { haptic } from "@/lib/haptics";
import type { Lang, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import type { Idea } from "@/lib/ideas";
import type { VisaWarning } from "@/lib/visa/policy";
import { countryName } from "@/lib/visa/schengen";

const IDEA_TITLE: Record<Idea["id"], TranslationKey> = {
  istanbul: "idea.istanbul.title",
  paris: "idea.paris.title",
  omra: "idea.omra.title",
  tunis: "idea.tunis.title",
  barcelona: "idea.barcelona.title",
};

const OPTION =
  "flex min-h-[52px] items-center justify-center rounded-button-sm bg-fill px-3 py-2 text-center text-[15px] font-bold leading-tight text-ink";

function localeFor(lang: Lang): "en" | "fr" | "ar" {
  if (lang === "ar" || lang === "darija-arab") return "ar";
  if (lang === "fr" || lang === "darija-latn") return "fr";
  return "en";
}

function QuestionBadge() {
  const { t } = useLanguage();
  return (
    <span className="self-start rounded-md bg-yellow px-2 py-1 font-mono text-[11px] font-bold tracking-[0.08em] text-ink">
      {t("understood.questionBadge")}
    </span>
  );
}

/** The no-visa request met a Schengen country. Replaces the Visa-free chip. */
export function VisaWarningNote({ warning }: { warning: VisaWarning }) {
  const { t, lang } = useLanguage();
  const country = countryName(warning.countryCode, localeFor(lang));
  const values = { city: warning.city, country };
  return (
    <p
      role="status"
      className="flex items-start gap-2 rounded-card bg-orange-soft px-3.5 py-3 text-[15px] font-bold leading-snug text-ink"
    >
      <WarningCircle size={20} weight="light" className="mt-0.5 shrink-0 text-orange" aria-hidden />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span>{t("understood.visaSchengen", values)}</span>
        <JuryLine k="understood.visaSchengen" values={values} />
      </span>
    </p>
  );
}

/** Two ways forward: verified ideas, or keep the city and its usual visa warning. */
export function VisaConflictChoices({
  city,
  onIdeas,
  onKeep,
}: {
  city: string;
  onIdeas: () => void;
  onKeep: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-card p-3.5">
      <QuestionBadge />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onIdeas} className={OPTION}>
          <JuryLabel k="understood.visaIdeas" />
        </button>
        <button type="button" onClick={onKeep} className={OPTION}>
          <JuryLabel k="understood.visaKeep" values={{ city }} />
        </button>
      </div>
    </section>
  );
}

/** The where-question, limited to idea cards that are visa-free for this profile. */
export function VisaIdeaChoices({
  ids,
  onPick,
}: {
  ids: Idea["id"][];
  onPick: (answer: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <section className="flex flex-col gap-3 rounded-card bg-card p-3.5">
      <QuestionBadge />
      <span className="flex flex-col gap-0.5">
        <span className="text-xl font-extrabold">{t("understood.visaWhere")}</span>
        <JuryLine k="understood.visaWhere" />
      </span>
      <div className="grid grid-cols-2 gap-2">
        {ids.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              haptic("select");
              onPick(t(IDEA_TITLE[id]));
            }}
            className={OPTION}
          >
            {t(IDEA_TITLE[id])}
          </button>
        ))}
      </div>
    </section>
  );
}

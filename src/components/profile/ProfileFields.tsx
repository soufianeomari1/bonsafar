"use client";

import { Info, Minus, Plus } from "@phosphor-icons/react";
import { ChoiceButton, ChoiceCard } from "@/components/bs/Choice";
import { Switch, SwitchGroup } from "@/components/bs/Switch";
import { translate, type Lang, type TranslationKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { haptic } from "@/lib/haptics";
import { AIRPORTS, COMPANIONS, PASSPORTS, STYLES, type Profile } from "@/lib/profile/schema";
import type { ProfilePatch } from "@/lib/profile/store";

export type FieldsProps = {
  profile: Profile;
  update: (patch: ProfilePatch) => void;
};

function FieldLabel({ children, weight = "bold" }: { children: React.ReactNode; weight?: "bold" | "semibold" }) {
  return (
    <span className={weight === "bold" ? "text-[15px] font-bold" : "text-[15px] font-semibold"}>
      {children}
    </span>
  );
}

/** Language names and sample sentences live in the English dictionary, in their own script. */
const native = (key: TranslationKey) => translate("en", key);

const LANGUAGE_CHOICES: {
  lang: Lang;
  titleArabic?: boolean;
  sampleArabic?: boolean;
  script?: "latn" | "arab";
}[] = [
  { lang: "darija-latn", script: "latn" },
  { lang: "darija-arab", sampleArabic: true, script: "arab" },
  { lang: "fr" },
  { lang: "ar", titleArabic: true, sampleArabic: true },
  { lang: "en" },
];

/** Step 1: one card per language, darija split by script (01a). */
export function LanguageFields({ profile, update }: FieldsProps) {
  const t = useT();

  return (
    <div role="radiogroup" aria-label={t("onboarding.language.groupLabel")} className="flex flex-col gap-2.5">
      {LANGUAGE_CHOICES.map((choice, index) => {
        const sample = native(`lang.sample.${choice.lang}`);
        const script =
          choice.script === "latn"
            ? t("onboarding.language.scriptLatin")
            : choice.script === "arab"
              ? native("onboarding.language.scriptArabic")
              : null;
        return (
          <ChoiceCard
            key={choice.lang}
            compact
            enterDelay={index * 0.05}
            selected={profile.ui_lang === choice.lang}
            onSelect={() =>
              update({
                ui_lang: choice.lang,
                ...(choice.script ? { darija_script: choice.script } : {}),
              })
            }
            title={native(`lang.${choice.lang}`)}
            titleArabic={choice.titleArabic}
            subtitle={script ? `${sample} · ${script}` : sample}
            subtitleArabic={choice.sampleArabic}
          />
        );
      })}
    </div>
  );
}

/** Step 2: home airport and who travels. */
export function TripFields({ profile, update }: FieldsProps) {
  const t = useT();
  return (
    <>
      <div className="flex flex-col gap-2">
        <FieldLabel>{t("onboarding.trip.airportLabel")}</FieldLabel>
        <div role="radiogroup" aria-label={t("onboarding.trip.airportLabel")} className="grid grid-cols-2 gap-2">
          {AIRPORTS.map((code) => (
            <ChoiceButton
              key={code}
              selected={profile.home_airport === code}
              onSelect={() => update({ home_airport: code })}
              className="justify-between px-3.5"
            >
              <span>{t(`airport.${code}`)}</span>
              <span className="font-mono text-[13px] font-medium text-muted">{code}</span>
            </ChoiceButton>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>{t("onboarding.trip.companionsLabel")}</FieldLabel>
        <div role="radiogroup" aria-label={t("onboarding.trip.companionsLabel")} className="grid grid-cols-2 gap-2">
          {COMPANIONS.map((companions) => (
            <ChoiceButton
              key={companions}
              selected={profile.companions === companions}
              onSelect={() =>
                update({
                  companions,
                  children_count:
                    companions === "family" ? Math.max(1, profile.children_count) : 0,
                })
              }
            >
              {t(`companions.${companions}`)}
            </ChoiceButton>
          ))}
        </div>
      </div>

      {profile.companions === "family" && (
        <Stepper
          label={t("onboarding.trip.children")}
          value={profile.children_count}
          min={1}
          max={9}
          lessLabel={t("onboarding.trip.childrenLess")}
          moreLabel={t("onboarding.trip.childrenMore")}
          onChange={(children_count) => update({ children_count })}
        />
      )}
    </>
  );
}

/** Step 3: passport, Schengen visa, validity and bank card (mockup 01b). */
export function PapersFields({ profile, update }: FieldsProps) {
  const t = useT();
  const passportKeys = { ma: "moroccan", fr: "french", both: "both", other: "other" } as const;
  const needsSchengen = profile.passport_country !== "fr" && profile.passport_country !== "both";

  return (
    <>
      <div className="flex flex-col gap-2">
        <FieldLabel>{t("onboarding.papers.passportLabel")}</FieldLabel>
        <div role="radiogroup" aria-label={t("onboarding.papers.passportLabel")} className="grid grid-cols-2 gap-2">
          {PASSPORTS.map((passport) => (
            <ChoiceButton
              key={passport}
              selected={profile.passport_country === passport}
              onSelect={() => update({ passport_country: passport })}
            >
              {t(`passport.${passportKeys[passport]}`)}
            </ChoiceButton>
          ))}
        </div>
      </div>

      <SwitchGroup>
        {needsSchengen && (
          <Switch
            checked={profile.has_schengen}
            onChange={(has_schengen) => update({ has_schengen })}
            label={t("onboarding.papers.schengen")}
            hint={t("onboarding.papers.schengenHint")}
          />
        )}
        <Switch
          checked={profile.passport_6m}
          onChange={(passport_6m) => update({ passport_6m })}
          label={t("onboarding.papers.passport6m")}
          hint={t("onboarding.papers.passport6mHint")}
        />
        <Switch
          checked={profile.intl_card}
          onChange={(intl_card) => update({ intl_card })}
          label={t("onboarding.papers.card")}
          hint={t("onboarding.papers.cardHint")}
        />
      </SwitchGroup>

      {needsSchengen && !profile.has_schengen && (
        <div className="flex items-start gap-2.5 rounded-button bg-blue-soft px-3.5 py-3 text-sm leading-[1.45]">
          <Info size={20} weight="fill" className="shrink-0 text-blue" aria-hidden />
          <span>{t("onboarding.papers.note")}</span>
        </div>
      )}
    </>
  );
}

const PREF_KEYS = ["direct_only", "breakfast", "halal", "accessibility"] as const;

/** Step 4: hotel standard, flight options and vibrations. */
export function StyleFields({ profile, update }: FieldsProps) {
  const t = useT();
  return (
    <>
      <div role="radiogroup" aria-label={t("onboarding.style.title")} className="flex flex-col gap-2.5">
        {STYLES.map((style) => (
          <ChoiceCard
            key={style}
            selected={profile.travel_style === style}
            onSelect={() => update({ travel_style: style })}
            title={t(`style.${style}`)}
            subtitle={t(`style.${style}.hint`)}
            className="min-h-[72px]"
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel>{t("onboarding.style.optionsLabel")}</FieldLabel>
        <SwitchGroup>
          {PREF_KEYS.map((key) => (
            <Switch
              key={key}
              checked={profile.prefs[key]}
              onChange={(value) => update({ prefs: { [key]: value } })}
              label={t(`prefs.${key}`)}
              hint={t(`prefs.${key}.hint`)}
            />
          ))}
          <Switch
            checked={profile.haptics}
            onChange={(haptics) => update({ haptics })}
            label={t("prefs.haptics")}
            hint={t("prefs.haptics.hint")}
          />
        </SwitchGroup>
      </div>
    </>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  lessLabel,
  moreLabel,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  lessLabel: string;
  moreLabel: string;
  onChange: (value: number) => void;
}) {
  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    haptic("select");
    onChange(next);
  };
  return (
    <div className="flex items-center justify-between rounded-[20px] border border-line bg-card px-3.5 py-2.5">
      <span className="text-base font-bold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={lessLabel}
          disabled={value <= min}
          onClick={() => step(-1)}
          className="flex size-11 items-center justify-center rounded-pill bg-fill text-ink disabled:opacity-40"
        >
          <Minus size={18} weight="bold" />
        </button>
        <span className="tabular w-6 text-center text-lg font-bold" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={moreLabel}
          disabled={value >= max}
          onClick={() => step(1)}
          className="flex size-11 items-center justify-center rounded-pill bg-fill text-ink disabled:opacity-40"
        >
          <Plus size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}

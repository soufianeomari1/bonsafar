"use client";

import { useState } from "react";
import {
  CalendarBlank,
  CheckCircle,
  CreditCard,
  IdentificationCard,
  LockSimple,
  MagnifyingGlass,
  MapPin,
} from "@phosphor-icons/react";
import { ChoiceButton, ChoiceCard } from "@/components/bs/Choice";
import { Switch, SwitchGroup } from "@/components/bs/Switch";
import { AIRPORTS as AIRPORT_TABLE, placeName } from "@/lib/airports";
import { localeFor } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { BUDGETS, COMPANIONS, PASSPORTS, STYLES, type Profile, type Question } from "@/lib/profile/schema";
import type { ProfilePatch } from "@/lib/profile/store";
import { cn } from "@/lib/utils";
import { Stepper } from "./ProfileFields";

export type QuestionProps = { profile: Profile; update: (patch: ProfilePatch) => void };

export const QUESTION_TEXT: Record<Question, { title: TranslationKey; why: TranslationKey }> = {
  airport: { title: "express.airport.title", why: "express.airport.why" },
  who: { title: "express.who.title", why: "express.who.why" },
  papers: { title: "express.papers.title", why: "express.papers.why" },
  style: { title: "express.style.title", why: "express.style.why" },
};

const QUICK = ["CMN", "RAK", "RBA", "TNG"] as const;

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] font-bold">{children}</p>;
}

/** Q1: the four big Moroccan airports, then a search over the static airport table. */
export function AirportQuestion({ profile, update }: QuestionProps) {
  const { t, lang } = useLanguage();
  const custom = profile.home_airport && !QUICK.includes(profile.home_airport as (typeof QUICK)[number]);
  const [searching, setSearching] = useState(!!custom);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? Object.values(AIRPORT_TABLE)
        .filter(
          (a) =>
            a.iata.toLowerCase().startsWith(q) ||
            a.city.toLowerCase().includes(q) ||
            placeName(a.iata, lang).toLowerCase().includes(q),
        )
        .slice(0, 6)
    : [];

  const pick = (iata: string) => {
    haptic("select");
    update({ home_airport: iata });
  };

  return (
    <div className="flex flex-col gap-2">
      <div role="radiogroup" aria-label={t("express.airport.title")} className="flex flex-col gap-2">
        {QUICK.map((iata) => (
          <AirportCard
            key={iata}
            selected={profile.home_airport === iata}
            onSelect={() => pick(iata)}
            title={placeName(iata, lang, t(`airport.${iata}`))}
            sub={`${t(`airportName.${iata}`)} · ${iata}`}
          />
        ))}
        {custom && (
          <AirportCard
            selected
            onSelect={() => undefined}
            title={placeName(profile.home_airport!, lang)}
            sub={profile.home_airport!}
          />
        )}
      </div>
      {searching ? (
        <div className="mt-1 flex flex-col gap-2">
          <label className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-card px-3.5">
            <MagnifyingGlass size={20} className="shrink-0 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("express.airport.search")}
              aria-label={t("express.airport.search")}
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </label>
          {q && results.length === 0 && <p className="px-1 text-sm text-muted">{t("express.airport.none")}</p>}
          {results.map((a) => (
            <button
              key={a.iata}
              type="button"
              onClick={() => {
                pick(a.iata);
                setQuery("");
              }}
              className="flex min-h-11 items-center justify-between rounded-[14px] bg-card px-3.5 text-start text-[15px]"
            >
              <span>{placeName(a.iata, lang)}</span>
              <span className="font-mono text-[13px] text-muted">{a.iata}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSearching(true)}
          className="mt-1 flex min-h-12 items-center gap-2 rounded-[14px] border border-dashed border-line-strong px-3.5 text-start text-sm text-muted"
        >
          <MapPin size={18} className="shrink-0" aria-hidden />
          {t("express.airport.other")}
        </button>
      )}
    </div>
  );
}

function AirportCard({
  selected,
  onSelect,
  title,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-center justify-between gap-2 rounded-button bg-card px-4 text-start",
        selected ? "border-2 border-ink py-[13px]" : "border border-line py-[14px]",
      )}
    >
      <span>
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="mt-0.5 block text-[12.5px] text-muted">{sub}</span>
      </span>
      {selected ? (
        <CheckCircle size={22} weight="fill" className="shrink-0 text-ink" aria-hidden />
      ) : (
        <span aria-hidden className="size-[22px] shrink-0 rounded-pill border-[1.5px] border-line-strong" />
      )}
    </button>
  );
}

/** Q2: who travels; a family adds the number and ages of the children. */
export function WhoQuestion({ profile, update }: QuestionProps) {
  const { t } = useLanguage();
  const ages = profile.children_ages;
  const setCount = (count: number) => {
    const next = Array.from({ length: count }, (_, index) => ages[index] ?? 8);
    update({ children_count: count, children_ages: next });
  };
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={t("express.who.title")} className="grid grid-cols-2 gap-2">
        {COMPANIONS.map((companions) => (
          <ChoiceButton
            key={companions}
            selected={profile.companions === companions}
            onSelect={() => {
              const count = companions === "family" ? Math.max(1, profile.children_count) : 0;
              update({
                companions,
                children_count: count,
                children_ages: companions === "family" ? Array.from({ length: count }, (_, i) => ages[i] ?? 8) : [],
              });
            }}
          >
            {t(`companions.${companions}`)}
          </ChoiceButton>
        ))}
      </div>
      {profile.companions === "family" && (
        <>
          <Stepper
            label={t("onboarding.trip.children")}
            value={profile.children_count}
            min={1}
            max={9}
            lessLabel={t("onboarding.trip.childrenLess")}
            moreLabel={t("onboarding.trip.childrenMore")}
            onChange={setCount}
          />
          <Label>{t("express.who.ages")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: profile.children_count }, (_, index) => (
              <label key={index} className="flex h-12 items-center justify-between gap-2 rounded-[14px] border border-line bg-card px-3.5">
                <span className="text-sm text-muted">{t("express.who.child", { n: index + 1 })}</span>
                <select
                  value={ages[index] ?? 8}
                  onChange={(event) => {
                    const next = Array.from({ length: profile.children_count }, (_, i) => ages[i] ?? 8);
                    next[index] = Number(event.target.value);
                    update({ children_ages: next });
                  }}
                  className="bg-transparent text-[15px] font-semibold outline-none"
                >
                  {Array.from({ length: 18 }, (_, age) => (
                    <option key={age} value={age}>
                      {t("express.who.years", { count: age })}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthYear({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  label: string;
}) {
  const { t, lang } = useLanguage();
  const now = new Date();
  const [year, month] = value ? value.split("-").map(Number) : [null, null];
  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() + i);
  const monthName = (m: number) =>
    new Intl.DateTimeFormat(localeFor(lang), { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 1)));
  const set = (m: number | null, y: number | null) => {
    if (m && y) onChange(`${y}-${String(m).padStart(2, "0")}`);
  };
  return (
    <div className="flex gap-2" aria-label={label} role="group">
      <select
        aria-label={t("express.papers.month")}
        value={month ?? ""}
        onChange={(event) => set(Number(event.target.value), year ?? now.getFullYear() + 1)}
        className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-bg px-2 text-sm font-semibold capitalize"
      >
        <option value="" disabled>
          {t("express.papers.month")}
        </option>
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {monthName(i + 1)}
          </option>
        ))}
      </select>
      <select
        aria-label={t("express.papers.year")}
        value={year ?? ""}
        onChange={(event) => set(month ?? 1, Number(event.target.value))}
        className="h-10 w-24 rounded-xl border border-line bg-bg px-2 text-sm font-semibold"
      >
        <option value="" disabled>
          {t("express.papers.year")}
        </option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Q3: passport, its expiry month, Schengen visa and its expiry, international card. */
export function PapersQuestion({ profile, update }: QuestionProps) {
  const { t } = useLanguage();
  const passportKeys = { ma: "moroccan", fr: "french", both: "both", other: "other" } as const;
  const needsSchengen = profile.passport_country !== "fr" && profile.passport_country !== "both";
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted rtl:font-arabic rtl:text-xs rtl:tracking-normal">
        {t("onboarding.papers.passportLabel")}
      </p>
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
      <div className="rounded-card bg-card px-4 py-0.5 shadow-soft">
        <div className="flex flex-col gap-2.5 py-3.5">
          <div className="flex items-center gap-3.5">
            <CalendarBlank size={22} className="shrink-0" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-semibold">{t("express.papers.expiry")}</span>
              <span className="block text-[12.5px] text-muted">{t("express.papers.expiryHint")}</span>
            </span>
          </div>
          <MonthYear
            value={profile.passport_expiry}
            label={t("express.papers.expiry")}
            onChange={(passport_expiry) =>
              update({ passport_expiry, passport_6m: passport_expiry ? sixMonthsAhead(passport_expiry) : profile.passport_6m })
            }
          />
        </div>
        {needsSchengen && (
          <div className="border-t border-line py-1">
            <div className="flex items-center gap-3.5">
              <IdentificationCard size={22} className="shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <Switch
                  checked={profile.has_schengen}
                  onChange={(has_schengen) => update({ has_schengen, schengen_expiry: has_schengen ? profile.schengen_expiry : null })}
                  label={t("onboarding.papers.schengen")}
                  hint={t("onboarding.papers.schengenHint")}
                  className="px-0"
                />
              </div>
            </div>
            {profile.has_schengen && (
              <div className="flex flex-col gap-2 pb-3 ps-9">
                <span className="text-[12.5px] text-muted">{t("express.papers.schengenUntil")}</span>
                <MonthYear
                  value={profile.schengen_expiry}
                  label={t("express.papers.schengenUntil")}
                  onChange={(schengen_expiry) => update({ schengen_expiry })}
                />
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-3.5 border-t border-line py-1">
          <CreditCard size={22} className="shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <Switch
              checked={profile.intl_card}
              onChange={(intl_card) => update({ intl_card })}
              label={t("onboarding.papers.card")}
              hint={t("onboarding.papers.cardHint")}
              className="px-0"
            />
          </div>
        </div>
      </div>
      <p className="flex items-start gap-2.5 text-[12.5px] leading-[1.45] text-muted">
        <LockSimple size={18} className="shrink-0" aria-hidden />
        {t("express.papers.never")}
      </p>
    </div>
  );
}

function sixMonthsAhead(yearMonth: string): boolean {
  const [y, m] = yearMonth.split("-").map(Number);
  const now = new Date();
  return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1)) >= 6;
}

/** Q4: budget per person, hotel standard, breakfast and favourite months. */
export function StyleQuestion({ profile, update }: QuestionProps) {
  const { t, lang } = useLanguage();
  const monthShort = (m: number) =>
    new Intl.DateTimeFormat(localeFor(lang), { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 1)));
  return (
    <div className="flex flex-col gap-3">
      <Label>{t("express.style.budget")}</Label>
      <div role="radiogroup" aria-label={t("express.style.budget")} className="flex flex-wrap gap-2">
        {BUDGETS.map((band) => (
          <Chip key={band} selected={profile.budget_band === band} onClick={() => update({ budget_band: band })} role="radio">
            {t(`budget.${band}`)}
          </Chip>
        ))}
      </div>
      <Label>{t("express.style.hotel")}</Label>
      <div role="radiogroup" aria-label={t("express.style.hotel")} className="flex flex-col gap-2">
        {STYLES.map((style) => (
          <ChoiceCard
            key={style}
            compact
            selected={profile.travel_style === style}
            onSelect={() => update({ travel_style: style })}
            title={t(`style.${style}`)}
            subtitle={t(`style.${style}.hint`)}
          />
        ))}
      </div>
      <SwitchGroup>
        <Switch
          checked={profile.prefs.breakfast}
          onChange={(breakfast) => update({ prefs: { breakfast } })}
          label={t("prefs.breakfast")}
          hint={t("prefs.breakfast.hint")}
        />
      </SwitchGroup>
      <Label>{t("express.style.months")}</Label>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
          const on = profile.fav_months.includes(m);
          return (
            <Chip
              key={m}
              selected={on}
              role="checkbox"
              onClick={() =>
                update({ fav_months: on ? profile.fav_months.filter((x) => x !== m) : [...profile.fav_months, m].sort((a, b) => a - b) })
              }
              className="justify-center capitalize"
            >
              {monthShort(m)}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  role,
  className,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  role: "radio" | "checkbox";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={() => {
        haptic("select");
        onClick();
      }}
      className={cn(
        "flex min-h-11 items-center rounded-pill px-3.5 text-sm font-semibold",
        selected ? "bg-ink text-card" : "border border-line bg-card text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export const QUESTION_FIELDS: Record<Question, (props: QuestionProps) => React.ReactNode> = {
  airport: AirportQuestion,
  who: WhoQuestion,
  papers: PapersQuestion,
  style: StyleQuestion,
};

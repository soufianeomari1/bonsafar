import type { Lang } from "@/lib/i18n";

/**
 * fr-MA for travellers, en-GB for the judges and the English UI. Darija in
 * Arabic letters keeps the Moroccan months (دجنبر, ar-MA); Modern Standard
 * Arabic takes the standard ones (ديسمبر, ar). Digits stay Latin everywhere.
 */
export function localeFor(lang: Lang): string {
  switch (lang) {
    case "en":
      return "en-GB";
    case "ar":
      return "ar";
    case "darija-arab":
      return "ar-MA";
    default:
      return "fr-MA";
  }
}

/**
 * Amounts are formatted by code, never written by a model. Grouping follows
 * the mockups ("15 000 DH"): fr-MA would print "15.000".
 */
export function formatAmount(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "en" ? "en-GB" : "fr-FR", {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(Math.round(amount));
}

function utcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** "15" + "22 déc." when the month is the same, else "28 déc." + "4 janv.". */
export function dateRangeParts(
  depart: string,
  ret: string,
  lang: Lang
): { from: string; to: string } {
  const a = utcDate(depart);
  const b = utcDate(ret);
  const locale = localeFor(lang);
  const full = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  });
  const sameMonth =
    a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  const from = sameMonth
    ? new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(a)
    : full.format(a);
  return { from, to: full.format(b) };
}

export function formatDay(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(utcDate(iso));
}

export function nightsBetween(depart: string, ret: string): number {
  return Math.round((utcDate(ret).getTime() - utcDate(depart).getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 0:07 style timer. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function formatUsd(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(5)}`;
  return `$${value.toFixed(4)}`;
}

/** Whole dirhams, grouped with a non-breaking space: "14 015 DH". */
export function formatMad(amount: number): string {
  return `${formatGrouped(Math.round(amount))}\u00A0DH`;
}

/** The same number without the currency, for a split-flap that sits beside "DH". */
export function formatMadNumber(amount: number): string {
  return formatGrouped(Math.round(amount));
}

/** Euros as the provider gave them. A whole number stays whole. */
export function formatEur(amount: number): string {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const digits = Number.isInteger(round2eur(abs)) ? 0 : 2;
  const body = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    numberingSystem: "latn",
  })
    .format(abs)
    .replace(/[\u202f ]/g, "\u00A0");
  return `${negative ? "\u2212" : ""}${body}\u00A0\u20AC`;
}

function round2eur(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatGrouped(amount: number): string {
  const negative = amount < 0;
  const body = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
  return `${negative ? "\u2212" : ""}${body}`;
}

/**
 * "8 h 55", "3 h 10", "45 min". Arabic script: "3 س 10 د", "45 د", Latin
 * digits. Minutes come from the offer, already whole.
 */
export function formatDuration(minutes: number, lang?: Lang): string {
  const negative = minutes < 0;
  const abs = Math.abs(Math.round(minutes));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const arabic = lang === "ar" || lang === "darija-arab";
  const body = arabic
    ? hours === 0
      ? `${mins} د`
      : mins === 0
        ? `${hours} س`
        : `${hours} س ${mins} د`
    : hours === 0
      ? `${mins} min`
      : `${hours} h ${String(mins).padStart(2, "0")}`;
  return negative ? `\u2212${body}` : body;
}

/** Clock time already on the offer ("09:15"), Latin digits, no timezone shift. */
export function formatTime(value: string): string {
  const match = /(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}

/** "Tue 15 Dec" style, Latin digits, the calendar date of an ISO day. */
export function formatTripDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(localeFor(lang), {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(utcDate(iso));
}

/** "Dec" from "2026-12". */
export function formatMonth(yearMonth: string, lang: Lang): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return new Intl.DateTimeFormat(localeFor(lang), {
    month: "short",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** When a price was captured, with the time. Latin digits. */
export function formatWhen(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(localeFor(lang), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    numberingSystem: "latn",
  }).format(date);
}

/** Whole days from today in Morocco until an ISO departure date. */
export function daysUntil(iso: string): number {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return Math.round((utcDate(iso).getTime() - utcDate(today).getTime()) / 86_400_000);
}

import type { Lang } from "@/lib/i18n";

/**
 * fr-MA for French, en-GB for English, ar for Modern Standard Arabic.
 * Darija does not trust ICU for month names: Latin letters always use the
 * French names, Arabic letters the Moroccan French-origin names. Digits stay
 * Latin everywhere.
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

const FRENCH_LONG = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

const FRENCH_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

/** Moroccan months of French origin, used in darija written with Arabic letters. */
const DARIJA_ARAB_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "ماي",
  "يونيو",
  "يوليوز",
  "غشت",
  "شتنبر",
  "أكتوبر",
  "نونبر",
  "دجنبر",
] as const;

function imposedMonth(lang: Lang, index: number, width: "long" | "short"): string | null {
  if (index < 0 || index > 11) return null;
  if (lang === "darija-latn") return width === "long" ? FRENCH_LONG[index] : FRENCH_SHORT[index];
  if (lang === "darija-arab") return DARIJA_ARAB_MONTHS[index];
  return null;
}

function monthIndexInZone(date: Date, timeZone: string | undefined): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    month: "numeric",
    timeZone,
    numberingSystem: "latn",
  }).formatToParts(date);
  const value = parts.find((part) => part.type === "month")?.value;
  return value ? Number(value) - 1 : date.getUTCMonth();
}

function formatInLocale(date: Date, lang: Lang, options: Intl.DateTimeFormatOptions): string {
  const fmt = new Intl.DateTimeFormat(localeFor(lang), { ...options, numberingSystem: "latn" });
  const width = options.month === "long" ? "long" : options.month ? "short" : null;
  const imposed = width
    ? imposedMonth(
        lang,
        monthIndexInZone(date, typeof options.timeZone === "string" ? options.timeZone : undefined),
        width,
      )
    : null;
  if (!imposed) return fmt.format(date);
  return fmt.formatToParts(date).map((part) => (part.type === "month" ? imposed : part.value)).join("");
}

/** Month name for pickers. 1 = January. Darija uses the imposed tables. */
export function formatMonthName(month: number, lang: Lang, width: "long" | "short" = "short"): string {
  return formatInLocale(new Date(Date.UTC(2026, month - 1, 1)), lang, { month: width, timeZone: "UTC" });
}

/** "15 novembre 2026" style, Latin digits, calendar date of an ISO day. */
export function formatLongDate(iso: string, lang: Lang): string {
  return formatInLocale(utcDate(iso), lang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "novembre 2026", in the viewer's timezone. */
export function formatMonthYear(date: Date, lang: Lang): string {
  return formatInLocale(date, lang, { month: "long", year: "numeric" });
}

/** "novembre 2026" for an ISO departure day. Passed to models as the travel month. */
export function formatTravelMonth(iso: string, lang: Lang): string {
  return formatInLocale(utcDate(iso), lang, { month: "long", year: "numeric", timeZone: "UTC" });
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
  const full = (date: Date) =>
    formatInLocale(date, lang, { day: "numeric", month: "short", timeZone: "UTC" });
  const sameMonth =
    a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  const from = sameMonth
    ? formatInLocale(a, lang, { day: "numeric", timeZone: "UTC" })
    : full(a);
  return { from, to: full(b) };
}

export function formatDay(iso: string, lang: Lang): string {
  return formatInLocale(utcDate(iso), lang, { day: "numeric", month: "short", timeZone: "UTC" });
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
  return formatInLocale(utcDate(iso), lang, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** "Dec" from "2026-12". */
export function formatMonth(yearMonth: string, lang: Lang): string {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month) return yearMonth;
  return formatInLocale(new Date(Date.UTC(year, month - 1, 1)), lang, { month: "short", timeZone: "UTC" });
}

/** When a price was captured, with the time. Latin digits. */
export function formatWhen(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return formatInLocale(date, lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
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

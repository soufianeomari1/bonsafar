import type { Lang } from "@/lib/i18n";

/** fr-MA for travellers, en-GB for the judges and the English UI. */
export function localeFor(lang: Lang): string {
  switch (lang) {
    case "en":
      return "en-GB";
    case "ar":
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

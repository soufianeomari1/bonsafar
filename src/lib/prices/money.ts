import { serverEnv } from "@/lib/env";

export type FxRate = {
  /** MAD for 1 EUR, Bank Al-Maghrib reference rate entered by hand. */
  rate: number;
  /** Date of that rate, YYYY-MM-DD. */
  date: string;
};

export function eurMadRate(): FxRate {
  const env = serverEnv();
  return { rate: env.EUR_MAD_RATE, date: env.EUR_MAD_DATE };
}

/** Money kept to the cent, so totals are exact sums of stored values. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function madValue(amount: number, currency: string, fx: FxRate): number | null {
  if (currency === "MAD") return amount;
  if (currency === "EUR") return amount * fx.rate;
  return null;
}

export function toMad(amount: number, currency: string, fx: FxRate): number | null {
  const value = madValue(amount, currency, fx);
  return value == null ? null : round2(value);
}

/**
 * Whole dirhams shown on a price line, rounded from the unrounded conversion
 * so a value is never rounded twice. Displayed totals add these up.
 */
export function toDisplayMad(amount: number, currency: string, fx: FxRate): number | null {
  const value = madValue(amount, currency, fx);
  return value == null ? null : Math.round(value);
}

/**
 * Parses a provider-formatted amount such as "MAD 13,886", "€1.234,50" or
 * "1 984 MAD". Returns null when no number can be read safely.
 */
export function parseFormattedAmount(text: string): number | null {
  const raw = text.replace(/[^\d.,]/g, "");
  if (!raw || !/\d/.test(raw)) return null;

  let normalized: string;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) normalized = raw.replace(/,/g, "");
  else if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) normalized = raw.replace(/\./g, "").replace(",", ".");
  else if (/^\d+,\d{1,2}$/.test(raw)) normalized = raw.replace(",", ".");
  else if (/^\d+(\.\d+)?$/.test(raw)) normalized = raw;
  else return null;

  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

import type { RunLog } from "@/lib/ai/events";

/**
 * Price guardrail: models never write an amount of money. Every model text
 * field is scanned; amounts are only ever formatted by code from stored
 * numbers.
 */

const CURRENCY =
  "(?:dh|dhs|mad|dirhams?|درهم|دراهم|eur|euros?|€|\\$|usd|dollars?)";
const NUMBER = "(?:\\d[\\d\\s.,\\u202f\\u00a0]*\\d|\\d)";
const WORD_NUMBER = "(?:mille|milles|thousand|alf|alaf|ألف|آلاف|million|mlyoun)";
/** A price word next to a number. Star ratings, dates and durations are not in this list. */
const PRICE_WORD = "(?:prix|price|co[uû]t|tarif)";

const MONEY = new RegExp(
  [
    `${NUMBER}\\s*(?:k\\s*)?${CURRENCY}(?![\\p{L}])`,
    `${CURRENCY}\\s*${NUMBER}`,
    `${WORD_NUMBER}\\s+${CURRENCY}(?![\\p{L}])`,
    `${NUMBER}\\s*${PRICE_WORD}(?![\\p{L}])`,
    `${PRICE_WORD}\\s*${NUMBER}`,
  ].join("|"),
  "giu"
);

export function containsMoney(text: string): boolean {
  MONEY.lastIndex = 0;
  return MONEY.test(text);
}

export function scrubMoney(text: string, replacement: string): string {
  return text.replace(MONEY, replacement);
}

export type GuardrailVerdict = { passed: boolean; blocked: string[]; scanned: number };

/**
 * Scans every string of a model output and logs one "price_guardrail" event,
 * passed or blocked. The caller decides what a block means (repair, scrub).
 */
export function guardModelText(
  value: unknown,
  log: RunLog,
  label: string,
): GuardrailVerdict {
  const strings = collectStrings(value);
  const blocked = strings.filter(containsMoney);
  log.add({
    step: "price_guardrail",
    model: "code",
    latency_ms: 0,
    status: blocked.length ? "blocked" : "passed",
    note: blocked.length
      ? `${label}: ${blocked.length} of ${strings.length} text fields carried an amount`
      : `${label}: ${strings.length} text fields scanned`,
  });
  return { passed: blocked.length === 0, blocked, scanned: strings.length };
}

/** Collects every string in a JSON value, to scan a whole model output. */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

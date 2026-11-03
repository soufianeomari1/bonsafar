/**
 * Price guardrail: models never write an amount of money. Every model text
 * field is scanned; amounts are only ever formatted by code from stored
 * numbers.
 */

const CURRENCY =
  "(?:dh|dhs|mad|dirhams?|درهم|دراهم|eur|euros?|€|\\$|usd|dollars?)";
const NUMBER = "(?:\\d[\\d\\s.,\\u202f\\u00a0]*\\d|\\d)";
const WORD_NUMBER = "(?:mille|milles|thousand|alf|alaf|ألف|آلاف|million|mlyoun)";

const MONEY = new RegExp(
  [
    `${NUMBER}\\s*(?:k\\s*)?${CURRENCY}(?![\\p{L}])`,
    `${CURRENCY}\\s*${NUMBER}`,
    `${WORD_NUMBER}\\s+${CURRENCY}(?![\\p{L}])`,
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

/** Collects every string in a JSON value, to scan a whole model output. */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const item of value) collectStrings(item, out);
  else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

/**
 * A budget the traveller said, in digits or in words. This is their data,
 * not a price written by a model, so the price guardrail never clears it.
 * Dirhams only. Returns null when no amount was said.
 */

const THOUSAND = 1000;
const MAX_MAD = 10_000_000;

/** Latin and Arabizi amounts, longest keys first so "khamstash" wins over "khamsa". */
const WORDS: Record<string, number> = {
  quatorze: 14,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  khamstash: 15,
  khamstach: 15,
  khmstach: 15,
  khmstash: 15,
  "3achrin": 20,
  treize: 13,
  quinze: 15,
  seize: 16,
  trente: 30,
  vingt: 20,
  ishrin: 20,
  achrin: 20,
  onze: 11,
  douze: 12,
  trois: 3,
  quatre: 4,
  wahed: 1,
  jouj: 2,
  tlata: 3,
  tleta: 3,
  rb3a: 4,
  khamsa: 5,
  khmsa: 5,
  setta: 6,
  stta: 6,
  sb3a: 7,
  tmnya: 8,
  tmenya: 8,
  ts3a: 9,
  tse3a: 9,
  "3achra": 10,
  achra: 10,
  mille: THOUSAND,
  milles: THOUSAND,
  thousand: THOUSAND,
  cent: 100,
  mya: 100,
  mia: 100,
  deux: 2,
  cinq: 5,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  six: 6,
  une: 1,
  un: 1,
};

const WORD_PATTERN = Object.keys(WORDS)
  .sort((a, b) => b.length - a.length)
  .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");

/** Arabic amounts, after alef folding. Longer phrases first. */
const ARABIC: { pattern: RegExp; value: number }[] = [
  { pattern: /خمستاش|خمسطاش|خمسة\s*عشر/, value: 15 },
  { pattern: /عشرين/, value: 20 },
  { pattern: /ثلاثين/, value: 30 },
  { pattern: /ثمانية|تمانية|تمنية/, value: 8 },
  { pattern: /تسعة|تسعه/, value: 9 },
  { pattern: /سبعة/, value: 7 },
  { pattern: /اربعة/, value: 4 },
  { pattern: /ثلاثة|تلاتة/, value: 3 },
  { pattern: /اثنين|اثنان/, value: 2 },
  { pattern: /مية|مئة|مائه/, value: 100 },
  { pattern: /عشرة/, value: 10 },
  { pattern: /ستة/, value: 6 },
  { pattern: /خمسة/, value: 5 },
  { pattern: /واحد/, value: 1 },
];

/** Same phrases, longest first, for the "N thousand" scan. */
const ARABIC_NUMBER =
  "خمستاش|خمسطاش|خمسة\\s*عشر|عشرين|ثلاثين|ثمانية|تمانية|تمنية|تسعة|تسعه|سبعة|اربعة|ثلاثة|تلاتة|اثنين|اثنان|عشرة|ستة|خمسة|واحد";

const THOUSAND_WORD = /(?:alf|alaf|mille|milles|thousand)(?![\p{L}])|الف|الاف/iu;
const NUMBER_WORD = new RegExp(String.raw`(?:\d{1,4}|${WORD_PATTERN})`, "iu");

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

function inRange(amount: number): number | null {
  if (!Number.isInteger(amount) || amount <= 0 || amount > MAX_MAD) return null;
  return amount;
}

function wordValue(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  const latin = WORDS[token];
  if (latin && latin < THOUSAND) return latin;
  for (const entry of ARABIC) {
    if (entry.pattern.test(token)) return entry.value;
  }
  return null;
}

/** "15 alf", "quinze mille", "خمستاش الاف", "عشرين ألف". */
function timesThousand(text: string): number | null {
  const re = new RegExp(
    String.raw`(${NUMBER_WORD.source}|${ARABIC_NUMBER})\s*(${THOUSAND_WORD.source})`,
    "giu",
  );
  for (const match of text.matchAll(re)) {
    const base = wordValue(match[1].replace(/\s+/g, " ").trim());
    if (base != null && base < THOUSAND) return inRange(base * THOUSAND);
  }
  return null;
}

/** "15 000 dh" or "15000 dirhams", with no thousand-word already counted. */
function plainDirhams(text: string): number | null {
  const match = text.match(
    /(\d{1,3}(?:[\s\u00a0.,]\d{3})+|\d{3,7})\s*(?:dh|dhs|mad|dirhams?|درهم|دراهم)(?![\p{L}])/iu,
  );
  if (!match) return null;
  const digits = match[1].replace(/[^\d]/g, "");
  return inRange(Number(digits));
}

/** The trip budget in dirhams, or null when the traveller named no amount. */
export function spokenBudgetMad(text: string): number | null {
  const folded = fold(text);
  return timesThousand(folded) ?? plainDirhams(folded);
}

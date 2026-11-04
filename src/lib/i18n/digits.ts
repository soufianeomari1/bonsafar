import type { Lang } from "./index";

/**
 * Models sometimes write "سبع ليالٍ" or "sb3 lyali" although the prompts ask
 * for digits. Before display, the most common number words (1 to 365) in
 * front of a day, night, week, month, hour or year are turned into Latin
 * digits. Only in front of those words, so "كل واحد" (each one) stays.
 */

const AR_UNITS: Record<string, number> = {
  واحد: 1, واحدة: 1, وحدة: 1,
  اثنان: 2, اثنين: 2, اثنتان: 2, اثنتين: 2, إثنين: 2, جوج: 2,
  ثلاث: 3, ثلاثة: 3, تلاتة: 3, تلت: 3,
  أربع: 4, أربعة: 4, اربع: 4, اربعة: 4, ربعة: 4,
  خمس: 5, خمسة: 5,
  ست: 6, ستة: 6,
  سبع: 7, سبعة: 7,
  ثمان: 8, ثماني: 8, ثمانية: 8, تمنية: 8, تمن: 8,
  تسع: 9, تسعة: 9, تسعود: 9,
  عشر: 10, عشرة: 10,
  حضاش: 11, طناش: 12, تلطاش: 13, ربعطاش: 14, خمسطاش: 15, سطاش: 16, سبعطاش: 17, تمنطاش: 18, تسعطاش: 19,
  عشرون: 20, عشرين: 20,
  ثلاثون: 30, ثلاثين: 30, تلاتين: 30,
  أربعون: 40, أربعين: 40, اربعين: 40, ربعين: 40,
  خمسون: 50, خمسين: 50,
  ستون: 60, ستين: 60,
  سبعون: 70, سبعين: 70,
  ثمانون: 80, ثمانين: 80, تمانين: 80,
  تسعون: 90, تسعين: 90,
  مائة: 100, مئة: 100, مية: 100,
  مائتان: 200, مائتين: 200, مئتان: 200, مئتين: 200, ميتين: 200,
  ثلاثمائة: 300, ثلاثمئة: 300, تلتمية: 300,
};

const AR_TEEN = /^(أحد|إحدى|احدى|اثنا|اثني|اثنتا|اثنتي)$/;

const AR_AFTER =
  "(?:يوم|يومًا|يوما|يومين|أيام|ايام|يام|نهار|ليلة|ليال|ليالٍ|ليالي|أسبوع|أسابيع|سيمانة|سيمانات|شهر|شهرًا|شهرا|أشهر|شهور|ساعة|ساعات|سوايع|دقيقة|دقائق|دقايق|سنة|سنوات|عام|أعوام|كيلومتر|كلم)";

const LATN_UNITS: Record<string, number> = {
  wa7ed: 1, wahed: 1, wa7da: 1, jouj: 2, jooj: 2, zouj: 2, tlata: 3, tlat: 3, rb3a: 4, reb3a: 4, rab3a: 4,
  khamsa: 5, khmsa: 5, khams: 5, stta: 6, setta: 6, sb3a: 7, seb3a: 7, sb3: 7, tmnya: 8, tmenya: 8, tmanya: 8,
  ts3oud: 9, tes3oud: 9, tes3a: 9, "3achra": 10, "3chra": 10, "3echra": 10,
  "7dach": 11, tnach: 12, tlettach: 13, rb3tach: 14, khmstach: 15, settach: 16, sb3tach: 17, tmntach: 18, ts3tach: 19,
  "3chrin": 20, "3echrin": 20, tlatin: 30, rb3in: 40, reb3in: 40, khamsin: 50, sttin: 60, settin: 60,
  sb3in: 70, seb3in: 70, tmanin: 80, ts3in: 90, tes3in: 90, mya: 100, myatin: 200,
};

const LATN_AFTER = "(?:youm|yom|iyam|ayam|yam|lila|lyali|liali|simana|simanat|chhar|chhor|chhour|sa3a|sa3at|d9i9a|dqiqa|3am|snin|km)";

function escape(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const AR_WORD = Object.keys(AR_UNITS)
  .concat(["أحد", "إحدى", "احدى", "اثنا", "اثني", "اثنتا", "اثنتي"])
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join("|");

// "خمسة وعشرين يومًا", "ثلاثمائة وخمسة وستون يومًا", "اثنا عشر شهرًا".
const AR_PHRASE = new RegExp(
  `(?<![\\u0600-\\u06FF])((?:${AR_WORD})(?:\\s+(?:و\\s*)?(?:${AR_WORD}))*)(?=\\s+${AR_AFTER}(?![\\u0621-\\u064A]))`,
  "g",
);

const LATN_WORD = Object.keys(LATN_UNITS)
  .sort((a, b) => b.length - a.length)
  .map(escape)
  .join("|");

const LATN_PHRASE = new RegExp(
  `(?<![A-Za-z0-9])((?:${LATN_WORD})(?:\\s+w\\s*(?:${LATN_WORD}))*)(?=\\s+${LATN_AFTER}\\b)`,
  "gi",
);

function arabicValue(phrase: string): number | null {
  const words = phrase.split(/\s+/).flatMap((word) => (word.startsWith("و") && !(word in AR_UNITS) ? [word.slice(1)] : [word]));
  let total = 0;
  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    const next = words[i + 1];
    // "X عشر" / "X عشرة": the teens.
    if (next && /^عشرة?$/.test(next) && (AR_TEEN.test(word) || (AR_UNITS[word] ?? 0) < 10)) {
      total += 10 + (AR_TEEN.test(word) ? (/^(أحد|إحدى|احدى)$/.test(word) ? 1 : 2) : AR_UNITS[word]);
      i += 1;
      continue;
    }
    const value = AR_UNITS[word];
    if (value == null) return null;
    total += value;
  }
  return total >= 1 && total <= 365 ? total : null;
}

function latinValue(phrase: string): number | null {
  let total = 0;
  for (const word of phrase.toLowerCase().split(/\s+w\s*|\s+/)) {
    if (!word) continue;
    const value = LATN_UNITS[word];
    if (value == null) return null;
    total += value;
  }
  return total >= 1 && total <= 365 ? total : null;
}

/** Arabic and darija model lines only: the other interfaces never get this. */
export function numberWordsToDigits(text: string, lang: Lang): string {
  if (lang === "ar" || lang === "darija-arab") {
    return text.replace(AR_PHRASE, (match) => {
      const value = arabicValue(match);
      return value == null ? match : String(value);
    });
  }
  if (lang === "darija-latn") {
    return text.replace(LATN_PHRASE, (match) => {
      const value = latinValue(match);
      return value == null ? match : String(value);
    });
  }
  return text;
}

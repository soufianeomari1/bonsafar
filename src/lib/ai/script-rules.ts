/**
 * Shared writing rules for every model line in Arabic or darija. The
 * interface also converts the most common number words to digits
 * (src/lib/i18n/digits.ts), in case a model forgets.
 */
export const SCRIPT_RULES = `Numbers: always Latin digits (0-9), never written as words, in every language ("7 nights", "7 lyali", "7 ليالٍ"). Months in Modern Standard Arabic ("ar") use the standard names: يناير، فبراير، مارس، أبريل، مايو، يونيو، يوليو، أغسطس، سبتمبر، أكتوبر، نوفمبر، ديسمبر. Moroccan darija in Arabic letters uses the Moroccan names: يناير، فبراير، مارس، أبريل، ماي، يونيو، يوليوز، غشت، شتنبر، أكتوبر، نونبر، دجنبر.`;

/**
 * Shared writing rules for every model line in Arabic or darija. The
 * interface also converts the most common number words to digits
 * (src/lib/i18n/digits.ts), in case a model forgets.
 */
export const SCRIPT_RULES = `Numbers: always Latin digits (0-9), never written as words, in every language ("7 nights", "7 lilat", "7 ليلات").
Months follow the language. French and English use that language's normal names (novembre, décembre / November, December). Modern Standard Arabic ("ar") uses the standard names: يناير، فبراير، مارس، أبريل، مايو، يونيو، يوليو، أغسطس، سبتمبر، أكتوبر، نوفمبر، ديسمبر. Darija in Latin letters ALWAYS uses the French month names: janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre. Never Arabizi month names (not "dujanbir", not "novanbir"). Darija in Arabic letters uses the Moroccan names: يناير، فبراير، مارس، أبريل، ماي، يونيو، يوليوز، غشت، شتنبر، أكتوبر، نونبر، دجنبر.
Darija in Latin letters: write "hôtel" (never "otel" or "lotel"), "lilat" for nights (never "lyali"), and people as "N d nass" ("2 d nass", "3 d nass"), never "kbar: N".
Darija in Arabic letters: nights are "ليلات" and people are "N ديال الناس" ("2 ديال الناس").`;

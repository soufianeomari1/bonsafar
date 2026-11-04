import type { Passport } from "@/lib/profile/schema";

const CODES: Record<Exclude<Passport, "other">, readonly string[]> = {
  ma: ["MA"],
  fr: ["FR"],
  both: ["MA", "FR"],
};

const NAMES: Record<string, readonly string[]> = {
  MA: ["morocco", "maroc", "المغرب"],
  FR: ["france", "فرنسا"],
};

/**
 * The destination is the traveller's own country, so no visa web check is needed.
 * "other" never matches: we do not know which country that passport is.
 */
export function isHomeCountry(
  passport: Passport | null | undefined,
  country: string,
  countryCode: string | null,
): boolean {
  if (!passport || passport === "other") return false;
  const codes = CODES[passport];
  if (countryCode && codes.includes(countryCode.toUpperCase())) return true;
  const name = country
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  return codes.some((code) => NAMES[code]?.includes(name));
}

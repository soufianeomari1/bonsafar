/**
 * `?lang=` on a shared link. Aliases are exact; anything else is ignored.
 * `ar` here means darija in Arabic letters, not Modern Standard Arabic.
 */

export type QueryLang = "fr" | "en" | "darija-latn" | "darija-arab";

const QUERY_LANG: Record<string, QueryLang> = {
  "darija-latn": "darija-latn",
  "darija-arab": "darija-arab",
  fr: "fr",
  en: "en",
  darija: "darija-latn",
  ma: "darija-latn",
  ar: "darija-arab",
  "darija-ar": "darija-arab",
};

/** Request header set by the proxy so the first HTML matches `?lang=`. */
export const LANG_HEADER = "x-bonsafar-lang";

export function langFromQuery(value: string | null): QueryLang | null {
  if (!value) return null;
  return QUERY_LANG[value] ?? null;
}

/** Only the resolved codes. A spoofed header cannot select another language. */
export function langFromHeader(value: string | null): QueryLang | null {
  if (
    value === "fr" ||
    value === "en" ||
    value === "darija-latn" ||
    value === "darija-arab"
  ) {
    return value;
  }
  return null;
}

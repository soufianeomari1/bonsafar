import { ar } from "./ar";
import { darijaArab } from "./darija-arab";
import { darijaLatn } from "./darija-latn";
import { en, type Dictionary, type TranslationKey } from "./en";
import { fr } from "./fr";

export type { Dictionary, TranslationKey };

export const LANGUAGES = [
  "fr",
  "darija-latn",
  "darija-arab",
  "ar",
  "en",
] as const;

export type Lang = (typeof LANGUAGES)[number];

export const DEFAULT_LANG: Lang = "fr";

/** Language forced for the judges, who read English everywhere. */
export const JURY_LANG: Lang = "en";

export const RTL_LANGS: readonly Lang[] = ["darija-arab", "ar"];

export function isRtl(lang: Lang): boolean {
  return RTL_LANGS.includes(lang);
}

/** The `lang` attribute to put on the html element. */
export function htmlLang(lang: Lang): string {
  switch (lang) {
    case "darija-latn":
      return "ary-Latn";
    case "darija-arab":
      return "ary";
    default:
      return lang;
  }
}

const DICTIONARIES: Record<Lang, Dictionary> = {
  en,
  fr,
  "darija-latn": darijaLatn,
  "darija-arab": darijaArab,
  ar,
};

export type TranslateValues = Record<string, string | number>;

function interpolate(template: string, values?: TranslateValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
}

export function translate(
  lang: Lang,
  key: TranslationKey,
  values?: TranslateValues
): string {
  const localised = DICTIONARIES[lang]?.[key];
  if (localised !== undefined) return interpolate(localised, values);

  const fallback = en[key];
  if (fallback !== undefined) {
    if (process.env.NODE_ENV === "development" && lang !== "en") {
      console.warn(`[i18n] missing key "${key}" for "${lang}", using English.`);
    }
    return interpolate(fallback, values);
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[i18n] unknown key "${key}".`);
  }
  return key;
}

export function isLang(value: unknown): value is Lang {
  return (
    typeof value === "string" && (LANGUAGES as readonly string[]).includes(value)
  );
}

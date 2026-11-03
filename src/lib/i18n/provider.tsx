"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  htmlLang,
  isRtl,
  translate,
  type Lang,
  type TranslateValues,
  type TranslationKey,
} from "./index";
import {
  readJury,
  readLang,
  readServerJury,
  readServerLang,
  subscribeToLang,
  writeLang,
} from "./store";

export { LANG_STORAGE_KEY } from "./store";

type Translate = (key: TranslationKey, values?: TranslateValues) => string;

type LanguageContextValue = {
  lang: Lang;
  /** `?jury=1`: English UI, bilingual agent messages. */
  jury: boolean;
  rtl: boolean;
  setLang: (lang: Lang) => void;
  t: Translate;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(
    subscribeToLang,
    readLang,
    readServerLang
  );
  const jury = useSyncExternalStore(
    subscribeToLang,
    readJury,
    readServerJury
  );

  // The html element is an external system, so an effect is the right place.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = htmlLang(lang);
    root.dir = isRtl(lang) ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((next: Lang) => writeLang(next), []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      jury,
      rtl: isRtl(lang),
      setLang,
      t: (key, values) => translate(lang, key, values),
    }),
    [lang, jury, setLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage() must be used inside <LanguageProvider>.");
  }
  return value;
}

/** Shorthand for components that only need to translate. */
export function useT(): Translate {
  return useLanguage().t;
}

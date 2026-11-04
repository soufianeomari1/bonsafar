"use client";

import { translate, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

/** In jury mode the English line is the title; darija sits under it. */
export function JuryLine({
  k,
  values,
}: {
  k: TranslationKey;
  values?: Record<string, string | number>;
}) {
  const { jury } = useLanguage();
  const { profile } = useProfile();
  if (!jury) return null;
  const lang = profile.darija_script === "arab" ? "darija-arab" : "darija-latn";
  const arabic = lang === "darija-arab";
  return (
    <p className={arabic ? "font-arabic text-sm italic text-muted" : "text-sm italic text-muted"} dir={arabic ? "rtl" : undefined} lang={arabic ? "ar" : undefined}>
      {translate(lang, k, values)}
    </p>
  );
}

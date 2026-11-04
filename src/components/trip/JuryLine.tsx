"use client";

import { translate, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

function useJuryDarija() {
  const { jury } = useLanguage();
  const { profile } = useProfile();
  const lang = profile.darija_script === "arab" ? "darija-arab" : "darija-latn";
  return { jury, lang, arabic: lang === "darija-arab" } as const;
}

/** In jury mode the English line is the title; darija sits under it. */
export function JuryLine({
  k,
  values,
}: {
  k: TranslationKey;
  values?: Record<string, string | number>;
}) {
  const { jury, lang, arabic } = useJuryDarija();
  if (!jury) return null;
  return (
    <p className={arabic ? "font-arabic text-sm italic text-muted" : "text-sm italic text-muted"} dir={arabic ? "rtl" : undefined} lang={arabic ? "ar" : undefined}>
      {translate(lang, k, values)}
    </p>
  );
}

/** A button label: the interface language, plus the darija proof under it in jury mode. */
export function JuryLabel({ k }: { k: TranslationKey }) {
  const { t } = useLanguage();
  const { jury, lang, arabic } = useJuryDarija();
  if (!jury) return <>{t(k)}</>;
  return (
    <span className="flex flex-col items-center leading-tight">
      <span>{t(k)}</span>
      <span
        className={arabic ? "font-arabic text-[11px] font-medium opacity-75" : "text-[11px] font-medium opacity-75"}
        dir={arabic ? "rtl" : undefined}
        lang={arabic ? "ar" : undefined}
      >
        {translate(lang, k)}
      </span>
    </span>
  );
}

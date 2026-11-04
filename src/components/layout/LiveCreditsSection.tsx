"use client";

import { isRtl } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { LIVE_CREDITS_COPY } from "@/lib/jury/privacy-copy";

/** English like the rest of /privacy, then the same section in the visitor's language. */
export function LiveCreditsSection() {
  const { lang } = useLanguage();
  const own = lang === "en" ? null : LIVE_CREDITS_COPY[lang];
  const rtl = isRtl(lang);
  return (
    <>
      <h2>{LIVE_CREDITS_COPY.en.title}</h2>
      <p>{LIVE_CREDITS_COPY.en.body}</p>
      {own && (
        <section
          lang={lang === "fr" ? "fr" : lang === "darija-latn" ? "ary-Latn" : "ar"}
          dir={rtl ? "rtl" : "ltr"}
          className={rtl ? "flex flex-col gap-2 rounded-card bg-bg px-4 py-3 font-arabic leading-[1.6]" : "flex flex-col gap-2 rounded-card bg-bg px-4 py-3"}
        >
          <h3 className="text-[17px] font-bold">{own.title}</h3>
          <p>{own.body}</p>
        </section>
      )}
    </>
  );
}

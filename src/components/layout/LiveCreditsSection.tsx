"use client";

import { htmlLang, isRtl, translate } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";

/** English like the rest of /privacy, then the same section in the visitor's language. */
export function LiveCreditsSection() {
  const { lang } = useLanguage();
  const own = lang === "en" ? null : lang;
  const rtl = isRtl(lang);
  return (
    <>
      <h2>{translate("en", "privacy.live.title")}</h2>
      <p>{translate("en", "privacy.live.body")}</p>
      {own && (
        <section
          lang={htmlLang(own)}
          dir={rtl ? "rtl" : "ltr"}
          className={rtl ? "flex flex-col gap-2 rounded-card bg-bg px-4 py-3 font-arabic leading-[1.6]" : "flex flex-col gap-2 rounded-card bg-bg px-4 py-3"}
        >
          <h3 className="text-[17px] font-bold">{translate(own, "privacy.live.title")}</h3>
          <p>{translate(own, "privacy.live.body")}</p>
        </section>
      )}
    </>
  );
}

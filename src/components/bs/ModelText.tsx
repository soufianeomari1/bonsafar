"use client";

import { hasArabic, useModelText, type ModelLine } from "@/lib/agent-client/model-text";
import { useLanguage } from "@/lib/i18n/provider";

/**
 * A model line in the interface language, with a light skeleton while its
 * Arabic version loads. In jury mode, `gloss` adds the darija line under the English one.
 */
export function ModelText({
  line,
  runId = null,
  gloss = false,
  className = "",
  glossClassName = "mt-0.5 block text-[13px] italic text-muted",
}: {
  line: ModelLine;
  runId?: string | null;
  gloss?: boolean;
  className?: string;
  glossClassName?: string;
}) {
  const { lang, jury } = useLanguage();
  const { text, pending, arabic } = useModelText(line, lang, runId);
  const darijaArabic = hasArabic(line.darija);
  return (
    <>
      {pending ? (
        <span className={`${className} block`} aria-busy="true">
          <span className="block h-[1.1em] w-4/5 animate-pulse rounded-full bg-fill" />
        </span>
      ) : (
        <span
          className={arabic ? `${className} block font-arabic` : `${className} block`}
          dir={arabic ? "rtl" : undefined}
          lang={arabic ? "ar" : undefined}
        >
          {text}
        </span>
      )}
      {jury && gloss && (
        <span
          className={darijaArabic ? `${glossClassName} font-arabic` : glossClassName}
          dir={darijaArabic ? "rtl" : undefined}
          lang={darijaArabic ? "ar" : undefined}
        >
          {line.darija}
        </span>
      )}
    </>
  );
}

import Link from "next/link";
import { Clouds } from "@/components/bs/Clouds";
import { Wordmark } from "@/components/bs/Brand";
import { translate } from "@/lib/i18n";

const t = (key: Parameters<typeof translate>[1]) => translate("en", key);

/**
 * `/?jury=1` until the 60-second judges' path lands (block 5). Always
 * English. The links are client navigations, so the app keeps jury mode.
 */
export function JuryPlaceholder() {
  return (
    <div lang="en" dir="ltr" className="relative flex min-h-0 flex-1 flex-col bg-sky-gradient">
      <Clouds />
      <main className="relative flex flex-1 flex-col justify-end gap-4 scroll-quiet overflow-y-auto px-5 pb-8 pt-28">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-blue">
          {t("jury.badge")}
        </span>
        <Wordmark size={24} mark={40}>
          <span className="text-[15px] italic text-muted">trik slama</span>
        </Wordmark>
        <h1 className="text-[30px] font-extrabold leading-[1.08] tracking-[-0.025em]">
          {t("jury.title")}
        </h1>
        <p className="text-[17px] leading-[1.45] text-muted">{t("jury.soon")}</p>
      </main>
      <nav className="relative flex flex-col gap-2.5 px-5 pb-8">
        <Link
          href="/onboarding"
          className="flex h-14 items-center justify-center rounded-button bg-ink px-6 text-[17px] font-semibold text-card"
        >
          {t("jury.tryApp")}
        </Link>
        <Link
          href="/dev/voice"
          className="flex h-12 items-center justify-center text-base font-semibold underline underline-offset-4"
        >
          {t("jury.voiceBench")}
        </Link>
      </nav>
    </div>
  );
}

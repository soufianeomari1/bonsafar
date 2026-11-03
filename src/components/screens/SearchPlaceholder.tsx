"use client";

import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";
import { Clouds } from "@/components/bs/Clouds";
import { Logo } from "@/components/bs/Brand";
import { useT } from "@/lib/i18n/provider";

/** Where "Yallah, qelleb !" leads until the agent screen lands (block 3). */
export function SearchPlaceholder() {
  const t = useT();
  const router = useRouter();
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-sky-gradient">
      <Clouds />
      <header className="relative flex h-[60px] items-center ps-1.5">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.push("/trip/understood")}
          className="flex size-11 items-center justify-center text-ink"
        >
          <CaretLeft size={20} weight="bold" className="rtl:-scale-x-100" />
        </button>
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo size="lg" />
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t("search.title")}</h1>
        <p className="text-[17px] leading-[1.45] text-muted">{t("search.soon")}</p>
      </main>
    </div>
  );
}

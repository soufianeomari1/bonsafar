"use client";

import { useState } from "react";
import { formatMad, formatWhen } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { Lang } from "@/lib/i18n";
import type { FxRate } from "@/lib/prices/money";
import { cn } from "@/lib/utils";

export type PriceFactProps = {
  amount: number;
  source: string;
  fetchedAt?: string | null;
  fx?: FxRate | null;
  lang: Lang;
  className?: string;
  /** Shown instead of the full "1 234 DH" when the parent draws the currency. */
  digitsOnly?: boolean;
};

/** A displayed dirham amount. A tap shows where it came from, when, and the rate. */
export function PriceFact({ amount, source, fetchedAt, fx, lang, className, digitsOnly }: PriceFactProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = digitsOnly
    ? formatMad(amount).replace(/\u00A0DH$/, "")
    : formatMad(amount);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "min-h-11 rounded-md px-1 text-start font-extrabold tabular-nums underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
          className,
        )}
      >
        <bdi>{label}</bdi>
      </button>
      {open && (
        <span
          role="status"
          className="absolute end-0 top-full z-20 mt-1 w-56 rounded-button bg-ink px-3 py-2 text-start text-xs font-medium leading-snug text-card shadow-soft"
        >
          <span className="block">{source}</span>
          {fetchedAt && <span className="block text-card/80">{t("price.captured", { time: formatWhen(fetchedAt, lang) })}</span>}
          <span className="block text-card/80">
            {fx ? t("price.fx", { rate: fx.rate, date: fx.date }) : t("price.fxMad")}
          </span>
        </span>
      )}
    </span>
  );
}

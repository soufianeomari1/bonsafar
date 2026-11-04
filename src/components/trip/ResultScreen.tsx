"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle, Export } from "@phosphor-icons/react";
import { useAgentRun } from "@/lib/agent-client/context";
import { packageOptionId, selectPackage, withTripSearch } from "@/lib/agent-client/store";
import type { PackageOption } from "@/lib/agent/schema";
import { formatMad, formatTime, formatWhen } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import type { FlightOffer } from "@/lib/prices/store";
import { cn } from "@/lib/utils";
import { PriceFact } from "./PriceFact";
import { RouteMap } from "./RouteMap";

type Row = PackageOption & { label?: "direct" | "cheapest" | "recommended" };

const TAG: Record<NonNullable<Row["label"]>, { key: TranslationKey; className: string }> = {
  recommended: { key: "result.recommended", className: "bg-green-soft text-green" },
  direct: { key: "result.direct", className: "bg-blue-soft text-blue" },
  cheapest: { key: "result.cheapest", className: "bg-orange-soft text-orange" },
};

/** Screen 06. The arc, then the three offers. Opening one grows into the package. */
export function ResultScreen() {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const reduced = useReducedMotion();
  const router = useRouter();
  const result = run.result;

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-[17px] text-muted">{t("result.missing")}</p>
        <button type="button" className="min-h-11 font-semibold underline" onClick={() => router.push(withTripSearch("/trip/plan"))}>
          {t("result.backToPlan")}
        </button>
      </div>
    );
  }

  const rows: Row[] = [
    { ...result.recommended, label: "recommended" },
    ...result.alternatives.map((alt) => ({ ...alt, label: alt.label })),
  ];
  const pack = result;
  const origin = flightOf(run.offers, pack.recommended.flight_id)?.attrs.outbound.from ?? "";
  const landedMs = run.end?.recorded?.total_ms ?? run.end?.total_ms ?? pack.total_ms;
  const landed = `${Math.max(1, Math.round(landedMs / 1000))} s`;

  async function share() {
    const text = `${origin} → ${pack.destination.iata} · ${formatMad(pack.recommended.totals.total_display_mad)}`;
    haptic("tap");
    if (navigator.share) {
      try {
        await navigator.share({ title: "BonSafar", text });
      } catch {
        // The traveller closed the sheet.
      }
      return;
    }
    await navigator.clipboard?.writeText(text);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-sea">
      <RouteMap
        from={origin}
        to={result.destination.iata}
        toLabel={result.destination.city}
        zoom
        duration={1.6}
      />
      <section className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-t-sheet bg-card px-[18px] pb-5 pt-2.5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <span aria-hidden className="mx-auto h-1.5 w-10 rounded-pill bg-line" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">{t("result.title")}</h1>
            <p className="text-sm text-muted">{t("result.subtitle", { count: rows.length })}</p>
          </div>
          <button
            type="button"
            aria-label={t("result.share")}
            onClick={() => void share()}
            className="flex size-11 items-center justify-center rounded-pill bg-fill"
          >
            <Export size={18} weight="fill" aria-hidden />
          </button>
        </div>
        {run.run?.replay && (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-orange">
            {t("plan.replay")}
            {run.run.captured_at ? ` · ${t("plan.captured", { time: formatWhen(run.run.captured_at, lang) })}` : ""}
          </p>
        )}
        <ul className="flex flex-col">
          {rows.map((row, index) => (
            <OfferRow key={packageOptionId(row.flight_id, row.hotel_id)} row={row} first={index === 0} reduced={!!reduced} />
          ))}
        </ul>
        <p className="mt-auto flex items-center gap-2 pt-2 text-sm text-muted">
          <CheckCircle size={18} weight="fill" className="text-green-bright" aria-hidden />
          <span>
            {t("result.landed", { time: landed })}
            {" · "}
            <a href="#under-the-hood" className="font-bold text-blue">
              {t("result.how")}
            </a>
          </span>
        </p>
      </section>
    </div>
  );
}

function OfferRow({ row, first, reduced }: { row: Row; first: boolean; reduced: boolean }) {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const id = packageOptionId(row.flight_id, row.hotel_id);
  const flight = flightOf(run.offers, row.flight_id);
  const hotel = run.offers[row.hotel_id];
  const tag = TAG[row.label ?? "recommended"];
  const nights = row.totals.hotel.nights;
  const out = flight?.attrs.outbound;
  const carriers = out?.carriers.join(" + ") ?? "";
  const hotelName = hotel?.kind === "hotel" ? hotel.attrs.name : "";

  return (
    <li className={cn(!first && "border-t border-line")}>
      <motion.div
        layoutId={reduced ? undefined : id}
        className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 py-1 text-start"
      >
        <button
          type="button"
          onClick={() => {
            haptic("select");
            selectPackage(id);
            router.push(withTripSearch("/trip/package"));
          }}
          className="col-span-2 grid min-h-11 grid-cols-[48px_minmax(0,1fr)] items-center gap-3 text-start"
        >
        <span className="flex flex-col items-center">
          <span className="text-2xl font-extrabold leading-none tabular-nums">{nights}</span>
          <span className="text-[10px] font-semibold tracking-[0.06em] text-muted">{t("result.nightsLabel")}</span>
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5">
            <span className={cn("whitespace-nowrap rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-[0.04em]", tag.className)}>
              {t(tag.key)}
            </span>
            <span className="truncate text-xs text-muted">{carriers}</span>
          </span>
          <span className="truncate text-base font-bold">{hotelName}</span>
          {out && (
            <span className="text-[13px] font-semibold tabular-nums text-green">
              <bdi>
                {out.from} {formatTime(out.departure)} → {out.to} {formatTime(out.arrival)}
              </bdi>
            </span>
          )}
        </span>
        </button>
        <PriceFact
          amount={row.totals.total_display_mad}
          source={`${row.totals.sources.flight} · ${row.totals.sources.hotel}`}
          fetchedAt={row.totals.fetched_at.flight}
          fx={row.totals.fx ?? run.run?.fx}
          lang={lang}
          className="text-[17px]"
        />
      </motion.div>
    </li>
  );
}

function flightOf(offers: Record<string, { kind: string }>, id: string): FlightOffer | null {
  const offer = offers[id];
  return offer?.kind === "flight" ? (offer as FlightOffer) : null;
}

"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Export } from "@phosphor-icons/react";
import { useAgentRun } from "@/lib/agent-client/context";
import { packageOptionId, selectPackage, withTripSearch } from "@/lib/agent-client/store";
import type { PackageOption } from "@/lib/agent/schema";
import { placeName } from "@/lib/airports";
import { formatMad, formatWhen } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { JURY_LANG, translate, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { legSentence, mapStops, nightsText } from "@/lib/trip/describe";
import { asFlight, asHotel } from "@/lib/trip/selection";
import { usePrefetchGoodToKnow } from "@/lib/trip/good-to-know-client";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";
import { PriceFact } from "./PriceFact";
import { RouteMap } from "./RouteMap";
import { HotelPhoto } from "./TripBits";

type Row = PackageOption & { label: "direct" | "cheapest" | "recommended" };

const TAG: Record<Row["label"], { key: TranslationKey; className: string }> = {
  recommended: { key: "result.tagRecommended", className: "bg-green-soft text-green" },
  direct: { key: "result.tagDirect", className: "bg-blue-soft text-blue" },
  cheapest: { key: "result.tagCheapest", className: "bg-orange-soft text-orange" },
};

/** Screen 06. The real route, then the options. Opening one shows the package. */
export function ResultScreen() {
  const run = useAgentRun();
  const { t, lang, jury } = useLanguage();
  const { profile } = useProfile();
  const router = useRouter();
  usePrefetchGoodToKnow(run, profile, lang);
  const result = run.result;
  const recommended = result ? asFlight(run.offers[result.recommended.flight_id]) : null;
  const out = recommended?.attrs.outbound ?? null;
  const stops = out ? mapStops(out, lang, t) : [];

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
  const city = placeName(pack.destination.iata, lang, pack.destination.city);
  const landedMs = run.end?.recorded?.total_ms ?? run.end?.total_ms ?? pack.total_ms;
  const seconds = Math.max(1, Math.round(landedMs / 1000));
  const landed = lang === "ar" || lang === "darija-arab" ? `${seconds} ث` : `${seconds} s`;

  async function share() {
    const text = `${city} · ${formatMad(pack.recommended.totals.total_display_mad)}`;
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
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto scroll-quiet">
        <RouteMap stops={stops} height={250} overlap={22}>
          <button
            type="button"
            aria-label={t("result.share")}
            onClick={() => void share()}
            className="absolute end-4 top-4 z-20 flex size-11 items-center justify-center rounded-pill bg-card text-ink shadow-soft"
          >
            <Export size={20} weight="light" aria-hidden />
          </button>
        </RouteMap>

        <section className="relative -mt-[22px] flex flex-col gap-3 rounded-t-[26px] bg-bg px-5 pb-6 pt-[22px]">
          <div>
            <h1 className="text-[27px] font-extrabold tracking-[-0.03em] rtl:tracking-normal">{t("result.title")}</h1>
            <p className="mt-0.5 text-sm text-muted">{t("result.subtitle", { count: rows.length })}</p>
          </div>
          {jury && run.run?.replay && (
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-orange">
              {translate(JURY_LANG, "plan.replay")}
              {run.run.captured_at
                ? ` · ${translate(JURY_LANG, "plan.captured", { time: formatWhen(run.run.captured_at, JURY_LANG) })}`
                : ""}
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <OptionCard key={packageOptionId(row.flight_id, row.hotel_id)} row={row} />
            ))}
          </ul>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <CheckCircle size={20} weight="light" className="shrink-0 text-green" aria-hidden />
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
    </div>
  );
}

function OptionCard({ row }: { row: Row }) {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const id = packageOptionId(row.flight_id, row.hotel_id);
  const flight = asFlight(run.offers[row.flight_id]);
  const hotel = asHotel(run.offers[row.hotel_id]);
  const tag = TAG[row.label];
  const sentence = flight ? legSentence(flight.attrs.outbound, lang, t) : null;

  return (
    <li className="flex overflow-hidden rounded-card bg-card shadow-soft">
      <button
        type="button"
        onClick={() => {
          haptic("select");
          selectPackage(id);
          router.push(withTripSearch("/trip/package"));
        }}
        className="flex min-w-0 flex-1 text-start"
      >
        <HotelPhoto src={hotel?.attrs.main_image} alt={hotel?.attrs.name ?? ""} className="w-[92px] shrink-0 self-stretch" />
        <span className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-3">
          <span className={cn("w-max rounded-pill px-2 py-0.5 text-[11.5px] font-semibold", tag.className)}>{t(tag.key)}</span>
          <span dir="auto" className="truncate text-start text-[15px] font-bold">
            {hotel?.attrs.name ?? ""}
          </span>
          {sentence && (
            <span className="line-clamp-2 text-[12.5px] leading-snug text-muted">
              {sentence.carriers && <span className="text-ink">{sentence.carriers}</span>}
              {sentence.carriers ? " · " : ""}
              {sentence.detail}
            </span>
          )}
          <span className="text-[12.5px] text-muted">{nightsText(row.totals.hotel.nights, t)}</span>
        </span>
      </button>
      <span className="flex shrink-0 items-end pb-2 pe-2">
        <PriceFact
          amount={row.totals.total_display_mad}
          source={`${row.totals.sources.flight} · ${row.totals.sources.hotel}`}
          fetchedAt={row.totals.fetched_at.flight}
          fx={row.totals.fx ?? run.run?.fx}
          lang={lang}
          className="text-[16px]"
        />
      </span>
    </li>
  );
}

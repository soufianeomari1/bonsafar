"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AirplaneTakeoff, CaretLeft, Coffee, SealCheck, Suitcase } from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import { SplitFlap } from "@/components/bs/SplitFlap";
import { useAgentRun } from "@/lib/agent-client/context";
import { packageOptionId, withTripSearch } from "@/lib/agent-client/store";
import type { AgentNotice, PackageOption, TrilingualText } from "@/lib/agent/schema";
import { airportCity } from "@/lib/airports";
import { daysUntil, formatDuration, formatEur, formatMad, formatMadNumber, formatMonth, formatTime, formatTripDate, formatWhen } from "@/lib/format";
import type { TranslationKey } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import type { FlightDelta } from "@/lib/prices/totals";
import type { FlightOffer, HotelOffer, Offer, TrendOffer } from "@/lib/prices/store";
import { cn } from "@/lib/utils";
import { PriceFact } from "./PriceFact";
import { RouteMap } from "./RouteMap";

const NOTICES: Record<AgentNotice, TranslationKey> = {
  visa_needed: "notice.visa_needed",
  visa_free_alternative: "notice.visa_free_alternative",
  passport_validity_check: "notice.passport_validity_check",
  passengers_mismatch: "notice.passengers_mismatch",
  hotel_filters_relaxed: "notice.hotel_filters_relaxed",
  guardrail_scrubbed: "notice.guardrail_scrubbed",
};

const REASONS: Record<string, TranslationKey> = {
  too_many_stops: "reject.too_many_stops",
  too_long: "reject.too_long",
  too_expensive: "reject.too_expensive",
  low_rating: "reject.low_rating",
  far_from_center: "reject.far_from_center",
  no_breakfast: "reject.no_breakfast",
  overnight_layover: "reject.overnight_layover",
  airport_change: "reject.airport_change",
  visa_needed: "reject.visa_needed",
  other: "reject.other",
};

const VISA_KEY: Record<string, TranslationKey> = {
  none: "visaKind.none",
  schengen: "visaKind.schengen",
  evisa: "visaKind.evisa",
  on_arrival: "visaKind.on_arrival",
  consular: "visaKind.consular",
  unknown: "visaKind.unknown",
};

export function PackageScreen({ dotationMad }: { dotationMad: number }) {
  const run = useAgentRun();
  const { t, lang, jury } = useLanguage();
  const { profile } = useProfile();
  const reduced = useReducedMotion();
  const router = useRouter();
  const [safarInTip, setSafarInTip] = useState(!!reduced);
  const [totalOpen, setTotalOpen] = useState(false);
  const result = run.result;

  const option = useMemo(() => pickOption(result, run.selectedId), [result, run.selectedId]);

  if (!result || !option) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-[17px] text-muted">{t("package.missing")}</p>
        <button type="button" className="min-h-11 font-semibold underline" onClick={() => router.push(withTripSearch("/trip/result"))}>
          {t("result.backToPlan")}
        </button>
      </div>
    );
  }

  const flight = asFlight(run.offers[option.flight_id]);
  const hotel = asHotel(run.offers[option.hotel_id]);
  const out = flight?.attrs.outbound;
  const back = flight?.attrs.inbound;
  const origin = out?.from ?? "";
  const id = packageOptionId(option.flight_id, option.hotel_id);
  const depart = hotel?.attrs.arrival ?? out?.departure.slice(0, 10) ?? "";
  const days = depart ? daysUntil(depart) : 0;
  const nights = option.totals.hotel.nights || hotel?.attrs.nights || 0;
  const showTip = result.smart_tip.kind !== "none" && result.smart_tip.delta;
  const trends = trendBars(run.offers, result.destination.city);
  const share = Math.round((option.totals.per_person_display_mad / dotationMad) * 100);
  const spoken: Lang = jury ? "en" : profile.ui_lang;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-sea">
      <RouteMap
        from={origin}
        to={result.destination.iata}
        toLabel={result.destination.city}
        duration={5}
        showSafar={!showTip || !safarInTip}
        onArrived={() => setSafarInTip(true)}
        back={
          <button
            type="button"
            aria-label={t("common.back")}
            onClick={() => router.push(withTripSearch("/trip/result"))}
            className="absolute start-4 top-4 z-20 flex size-11 items-center justify-center rounded-pill bg-card"
          >
            <CaretLeft size={18} weight="bold" className="rtl:-scale-x-100" aria-hidden />
          </button>
        }
      />

      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-t-sheet bg-bg px-5 pb-28 pt-2.5">
          <span aria-hidden className="mx-auto h-[5px] w-10 rounded-pill bg-line" />
          <motion.div layoutId={reduced ? undefined : id}>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
              <bdi>
                {out ? `${out.flights.join(" + ")} · ${depart ? formatTripDate(depart, lang) : ""}` : result.destination.city}
              </bdi>
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.02em]">
              {flight ? `${airportCity(origin) ?? origin} → ${result.destination.city}` : result.destination.city}
            </h1>
            <p className="text-sm font-semibold text-green">
              {days > 0
                ? t("package.departIn", { days, nights })
                : days === 0
                  ? t("package.departToday", { nights })
                  : t("package.departPast", { nights })}
            </p>
          </motion.div>

          {result.notices.map((notice) => (
            <p key={notice} className="rounded-button bg-orange-soft px-3.5 py-3 text-sm leading-snug">
              {t(NOTICES[notice])}
            </p>
          ))}

          {out && (
            <div className="rounded-card bg-card px-4 py-3.5 shadow-soft">
              <div className="flex items-end justify-between">
                <TimeBlock time={formatTime(out.departure)} code={out.from} />
                <div className="flex flex-col items-center gap-1 pb-1.5">
                  <span className="rounded-md bg-yellow px-1.5 py-0.5 font-mono text-[11px] font-semibold">
                    {out.stops <= 0
                      ? t("plan.direct")
                      : out.stops === 1
                        ? `${t("plan.stops.one")} ${out.route[1] ?? ""}`.trim()
                        : t("plan.stops.other", { count: out.stops })}
                  </span>
                  <span className="text-xs text-muted">{formatDuration(out.duration_min)}</span>
                </div>
                <TimeBlock time={formatTime(out.arrival)} code={out.to} align="end" />
              </div>
            </div>
          )}

          {back && (
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">{t("package.return")}</span>{" "}
              <bdi>
                {formatTripDate(back.departure.slice(0, 10), lang)} · {formatTime(back.departure)} → {formatTime(back.arrival)} ·{" "}
                {back.stops <= 0 ? t("plan.direct") : t("plan.stops.other", { count: back.stops })} · {formatDuration(back.duration_min)}
              </bdi>
            </p>
          )}

          {hotel && (
            <div className="rounded-card bg-card p-4 shadow-soft">
              <p className="text-lg font-extrabold">{hotel.attrs.name}</p>
              <p className="text-sm text-muted">
                {hotel.attrs.review_rating != null && <bdi>{hotel.attrs.review_rating}</bdi>}
                {hotel.attrs.review_count != null && ` · ${t("package.reviews", { count: hotel.attrs.review_count })}`}
                {hotel.attrs.stars != null && ` · ${hotel.attrs.stars}★`}
              </p>
              <p className="mt-1 text-sm">
                {hotel.attrs.breakfast ? t("package.breakfastYes") : t("package.breakfastNo")}
                {" · "}
                {hotel.attrs.free_cancellation ? t("package.cancelYes") : t("package.cancelNo")}
              </p>
              <PriceFact
                amount={hotel.price_mad_display}
                source={hotel.source}
                fetchedAt={hotel.fetched_at}
                fx={hotel.fx ?? result.fx}
                lang={lang}
                className="mt-1 text-xl"
              />
            </div>
          )}

          <div>
            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t("package.before")}</p>
            <div className="grid grid-cols-2 gap-2">
              <Tile
                label={t("package.visa")}
                value={result.entry?.visa_needed ? t("package.visaNeeded") : t("package.visaFree")}
                hint={result.entry?.visa_needed ? t(VISA_KEY[result.entry.visa_kind] ?? "visaKind.unknown") : undefined}
                ok={!!result.entry && !result.entry.visa_needed}
              />
              <PassportTile entry={result.entry} />
              <Tile
                label={t("package.baggage")}
                value={flight && flight.attrs.baggage.checked_bag > 0 ? t("package.bagChecked") : t("package.bagCabin")}
                ok={!!flight && flight.attrs.baggage.checked_bag > 0}
                warn={!!flight && flight.attrs.baggage.checked_bag === 0}
              />
              <Tile label={t("package.money")} value={t("package.moneyShare", { percent: share })} ok />
            </div>
          </div>

          <div>
            <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t("package.why")}</p>
            <ul className="flex flex-col gap-2">
              {result.why.map((line, index) => {
                const text = whyText(line, spoken, jury, profile.darija_script === "arab");
                const Icon = index === 1 ? Coffee : index === 2 ? Suitcase : SealCheck;
                return (
                  <li key={index} className="flex items-start gap-2.5 rounded-button bg-card px-3 py-2.5">
                    <Icon size={18} weight="fill" className="mt-0.5 shrink-0 text-blue" aria-hidden />
                    <span>
                      <span className={cn("block text-sm leading-snug", text.rtl && "font-arabic")} dir={text.rtl ? "rtl" : undefined} lang={text.rtl ? "ar" : undefined}>
                        {text.primary}
                      </span>
                      {text.secondary && (jury ? run.showGloss : false) && (
                        <span className="mt-0.5 block text-[13px] italic text-muted">{text.secondary}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {showTip && result.smart_tip.delta && (
            <div className="flex items-center gap-3 rounded-card bg-card px-3.5 py-3 shadow-soft ring-1 ring-blue/30">
              {safarInTip ? (
                <span className="inline-flex w-14 shrink-0 justify-center">
                  <Safar state="bye" size={52} tilt={-10} />
                </span>
              ) : (
                <span className="size-14 shrink-0" />
              )}
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.06em] text-blue">{t("package.tip")}</p>
                <p className="mt-0.5 text-sm leading-snug">{tipText(result.smart_tip.delta, result.smart_tip.kind, t)}</p>
              </div>
            </div>
          )}

          {trends.length > 0 && <TrendChart months={trends} lang={lang} fx={result.fx} />}

          {result.rejected.length > 0 && (
            <div>
              <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t("package.rejected")}</p>
              <ul className="flex flex-col gap-1.5">
                {result.rejected.map((item) => (
                  <li key={item.offer_id} className="rounded-xl bg-card px-3 py-2 text-sm">
                    <span className="font-semibold">{offerName(run.offers[item.offer_id])}</span>
                    <span className="text-muted"> · {t(REASONS[item.reason] ?? "reject.other")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-line bg-card px-4 py-3.5 pb-[22px]">
          <div className="shrink-0">
            <p className="text-xs text-muted">
              {option.totals.passengers === 1
                ? t("package.totalOne")
                : t("package.totalFor", { count: option.totals.passengers })}
            </p>
            <button
              type="button"
              aria-expanded={totalOpen}
              aria-label={formatMad(option.totals.total_display_mad)}
              onClick={() => setTotalOpen((open) => !open)}
              className="relative flex min-h-11 items-baseline gap-1 whitespace-nowrap text-start text-[22px] font-extrabold tabular-nums tracking-tight"
            >
              <SplitFlap value={formatMadNumber(option.totals.total_display_mad)} haptic={false} />{" "}
              <span className="text-[15px]">DH</span>
              {totalOpen && (
                <span
                  role="status"
                  className="absolute start-0 bottom-full z-20 mb-1 w-56 rounded-button bg-ink px-3 py-2 text-start text-xs font-medium leading-snug text-card shadow-soft"
                >
                  <span className="block">{option.totals.sources.flight} · {option.totals.sources.hotel}</span>
                  <span className="block text-card/80">{t("price.captured", { time: formatWhen(option.totals.fetched_at.flight, lang) })}</span>
                  <span className="block text-card/80">{t("price.fx", { rate: (option.totals.fx ?? result.fx).rate, date: (option.totals.fx ?? result.fx).date })}</span>
                </span>
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={() => router.push(withTripSearch("/trip/ready"))}
            className="flex h-14 items-center gap-2 rounded-button bg-ink px-[18px] text-base font-bold text-card"
          >
            {t("package.validate")}
            <motion.span
              aria-hidden
              animate={reduced ? undefined : { x: [0, 14, -8, 0], y: [0, -10, 6, 0], rotate: [0, -20, 0, 0], opacity: [1, 0, 0, 1] }}
              transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.7, 0.9, 1], ease: [0.23, 1, 0.32, 1] }}
            >
              <AirplaneTakeoff size={18} weight="fill" />
            </motion.span>
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ time, code, align = "start" }: { time: string; code: string; align?: "start" | "end" }) {
  return (
    <div className={align === "end" ? "text-end" : ""}>
      <p className="text-4xl font-extrabold tabular-nums tracking-tight text-green">
        <bdi>{time}</bdi>
      </p>
      <p className="font-mono text-xs font-semibold text-muted">
        <bdi>{code}</bdi>
      </p>
    </div>
  );
}

function Tile({ label, value, hint, ok, warn }: { label: string; value: string; hint?: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className={cn("rounded-button px-3 py-2.5", warn || !ok ? "bg-orange-soft" : "bg-green-soft")}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("font-mono text-[13px] font-semibold", warn || !ok ? "text-orange" : "text-green")}>
        <SplitFlap value={value} haptic={false} cellClassName="text-[13px]" />
      </p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

function PassportTile({ entry }: { entry: { passport_validity_days: number | null; sources: { url: string; title: string }[] } | null }) {
  const { t } = useLanguage();
  const days = entry?.passport_validity_days;
  if (days == null) {
    const source = entry?.sources[0];
    return (
      <div className="rounded-button bg-orange-soft px-3 py-2.5">
        <p className="text-xs text-muted">{t("package.passport")}</p>
        <p className="font-mono text-[13px] font-semibold text-orange">{t("package.passportCheck")}</p>
        {source && (
          <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-[11px] font-semibold text-blue underline">
            {source.title}
          </a>
        )}
      </div>
    );
  }
  return <Tile label={t("package.passport")} value={t("package.passportDays", { days })} ok />;
}

function TrendChart({
  months,
  lang,
  fx,
}: {
  months: TrendOffer[];
  lang: Lang;
  fx: { rate: number; date: string };
}) {
  const { t } = useLanguage();
  const max = Math.max(...months.map((month) => month.price_mad_display), 1);
  const cheapest = Math.min(...months.map((month) => month.price_mad_display));
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t("package.trends")}</p>
      <ul className="flex items-stretch gap-2 rounded-card bg-card px-3 py-3 shadow-soft">
        {months.map((month) => {
          const low = month.price_mad_display === cheapest;
          return (
            <li key={month.id} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <div
                  className={cn("w-full rounded-t-md", low ? "bg-green" : "bg-blue")}
                  style={{ height: `${Math.max(8, (month.price_mad_display / max) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold capitalize">{formatMonth(month.attrs.month, lang)}</span>
              <span className="h-3 text-[10px] font-bold text-green">{low ? t("package.cheapestMonth") : ""}</span>
              <PriceFact amount={month.price_mad_display} source={month.source} fetchedAt={month.fetched_at} fx={month.fx ?? fx} lang={lang} className="text-[11px]" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function whyText(line: TrilingualText, lang: Lang, jury: boolean, arabicScript: boolean) {
  if (jury) return { primary: line.en, secondary: line.darija, rtl: arabicScript };
  if (lang === "fr") return { primary: line.fr, secondary: undefined, rtl: false };
  if (lang === "en") return { primary: line.en, secondary: undefined, rtl: false };
  return { primary: line.darija, secondary: undefined, rtl: true };
}

function tipText(
  delta: FlightDelta,
  kind: "direct_upgrade" | "cheaper_flight" | "none",
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  const mad = formatMad(Math.abs(delta.extra_display_mad));
  const duration = formatDuration(Math.abs(delta.saved_minutes));
  const eur = delta.extra
    ? delta.extra.currency === "EUR"
      ? formatEur(Math.abs(delta.extra.amount))
      : `${Math.abs(delta.extra.amount)} ${delta.extra.currency}`
    : null;
  if (kind === "cheaper_flight") {
    return eur ? t("package.tipSlower", { eur, mad, duration }) : t("package.tipSlowerMad", { mad, duration });
  }
  return eur ? t("package.tipFaster", { eur, mad, duration }) : t("package.tipFasterMad", { mad, duration });
}

function pickOption(
  result: { recommended: PackageOption; alternatives: (PackageOption & { label: "direct" | "cheapest" })[] } | null,
  selectedId: string | null,
): PackageOption | null {
  if (!result) return null;
  if (!selectedId) return result.recommended;
  const all = [result.recommended, ...result.alternatives];
  return all.find((option) => packageOptionId(option.flight_id, option.hotel_id) === selectedId) ?? result.recommended;
}

function trendBars(offers: Record<string, Offer>, city: string): TrendOffer[] {
  return Object.values(offers)
    .filter((offer): offer is TrendOffer => offer.kind === "trend" && offer.destination.toLowerCase() === city.toLowerCase())
    .sort((a, b) => a.attrs.month.localeCompare(b.attrs.month));
}

function asFlight(offer: Offer | undefined): FlightOffer | null {
  return offer?.kind === "flight" ? offer : null;
}

function asHotel(offer: Offer | undefined): HotelOffer | null {
  return offer?.kind === "hotel" ? offer : null;
}

function offerName(offer: Offer | undefined): string {
  if (!offer) return "";
  if (offer.kind === "hotel") return offer.attrs.name;
  if (offer.kind === "flight") return offer.attrs.outbound.route.join("–");
  return offer.attrs.month;
}


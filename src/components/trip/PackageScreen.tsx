"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AirplaneTilt,
  ArrowLeft,
  Backpack,
  Bed,
  Car,
  CheckCircle,
  Coffee,
  Export,
  ForkKnife,
  Heart,
  MapPin,
  Barbell,
  Snowflake,
  Star,
  Suitcase,
  SuitcaseRolling,
  SwimmingPool,
  Flower,
  WifiHigh,
  CalendarCheck,
  type Icon,
} from "@phosphor-icons/react";
import { SafarLogo } from "@/components/bs/Brand";
import { useAgentRun } from "@/lib/agent-client/context";
import { packageOptionId, selectPackage, withTripSearch } from "@/lib/agent-client/store";
import type { AgentNotice, AgentPackage, PackageOption } from "@/lib/agent/schema";
import { placeName } from "@/lib/airports";
import { dateRangeParts, daysUntil, formatAmount, formatDuration, formatMad, formatWhen, localeFor } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { Lang, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import type { FlightOffer, HotelOffer } from "@/lib/prices/store";
import {
  distanceText,
  hotelAmenities,
  legCarriers,
  mapStops,
  nightsText,
  ratingWord,
  travellersText,
  type AmenityId,
} from "@/lib/trip/describe";
import { asFlight, asHotel, pickOption } from "@/lib/trip/selection";
import { cn } from "@/lib/utils";
import { JuryLabel } from "./JuryLine";
import { RouteMap } from "./RouteMap";
import { Eyebrow, HotelPhoto, LegBlock, Pill, SectionTitle } from "./TripBits";

const NOTICES: Record<AgentNotice, TranslationKey> = {
  visa_needed: "notice.visa_needed",
  visa_free_alternative: "notice.visa_free_alternative",
  passport_validity_check: "notice.passport_validity_check",
  passengers_mismatch: "notice.passengers_mismatch",
  hotel_filters_relaxed: "notice.hotel_filters_relaxed",
  guardrail_scrubbed: "notice.guardrail_scrubbed",
};

const AMENITY: Record<AmenityId, { icon: Icon; key: TranslationKey }> = {
  breakfast: { icon: Coffee, key: "amenity.breakfast" },
  rooms: { icon: Bed, key: "amenity.rooms" },
  wifi: { icon: WifiHigh, key: "amenity.wifi" },
  aircon: { icon: Snowflake, key: "amenity.aircon" },
  parking: { icon: Car, key: "amenity.parking" },
  pool: { icon: SwimmingPool, key: "amenity.pool" },
  spa: { icon: Flower, key: "amenity.spa" },
  gym: { icon: Barbell, key: "amenity.gym" },
  restaurant: { icon: ForkKnife, key: "amenity.restaurant" },
  freeCancel: { icon: CalendarCheck, key: "amenity.freeCancel" },
};

/** Each value is isolated left to right so signs and digits keep their order on RTL screens. */
const ltr = (text: string) => `\u2066${text}\u2069`;

/** Screen 07, "07 Forfait v2" of postfetch-compte-v2.html. */
export function PackageScreen() {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;
  const out = flight?.attrs.outbound ?? null;
  const stops = out ? mapStops(out, lang, t) : [];

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

  const back = flight?.attrs.inbound ?? null;
  const depart = hotel?.attrs.arrival ?? out?.departure.slice(0, 10) ?? "";
  const ret = hotel?.attrs.departure ?? back?.departure.slice(0, 10) ?? "";
  const days = depart ? daysUntil(depart) : 0;
  const nights = option.totals.hotel.nights || hotel?.attrs.nights || 0;
  const range = depart && ret ? dateRangeParts(depart, ret, lang) : null;
  const passengers = flight?.attrs.passengers ?? { adults: option.totals.passengers, children: 0, infants: 0 };
  const visaFree = !!result.entry && !result.entry.visa_needed;
  const maxStops = Math.max(out?.stops ?? 0, back?.stops ?? 0);
  const city = placeName(result.destination.iata, lang, result.destination.city);
  const departLine =
    days > 1
      ? t("package.departInDays", { days })
      : days === 1
        ? t("package.departTomorrow")
        : days === 0
          ? t("package.departTodayShort")
          : t("package.datesPast");

  async function share() {
    haptic("tap");
    const text = `${city} · ${range ? `${range.from} → ${range.to}` : ""} · ${formatMad(option!.totals.total_display_mad)}`;
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
      <div className="min-h-0 flex-1 overflow-y-auto scroll-quiet pb-32">
        <RouteMap stops={stops} height={250} overlap={22}>
          <RoundButton label={t("common.back")} className="start-4" onClick={() => router.push(withTripSearch("/trip/result"))}>
            <ArrowLeft size={20} weight="light" className="rtl:-scale-x-100" />
          </RoundButton>
          <RoundButton label={t("package.share")} className="end-4" onClick={() => void share()}>
            <Export size={20} weight="light" />
          </RoundButton>
        </RouteMap>

        <div className="relative -mt-[22px] rounded-t-[26px] bg-bg px-5 pt-[22px]">
          <Eyebrow>
            {t("package.eyebrow")} · {nightsText(nights, t)} · {travellersText(passengers, t)}
          </Eyebrow>
          <div className="mt-1.5 flex items-end justify-between gap-3">
            <h1 className="min-w-0 text-[34px] font-extrabold leading-none tracking-[-0.03em] rtl:leading-tight rtl:tracking-normal">
              {city}
            </h1>
            <div className="shrink-0 text-end">
              {range && (
                <p className="text-sm font-semibold tabular-nums">
                  <bdi>
                    {range.from} → {range.to}
                  </bdi>
                </p>
              )}
              <p className="mt-0.5 text-xs font-medium text-muted">{departLine}</p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {visaFree && (
              <Pill tone="good" icon={<CheckCircle size={15} weight="light" />}>
                {t("package.pillNoVisa")}
              </Pill>
            )}
            {hotel?.attrs.breakfast && (
              <Pill icon={<Coffee size={15} weight="light" />}>{t("package.pillBreakfast")}</Pill>
            )}
            {out && (
              <Pill icon={<AirplaneTilt size={15} weight="light" />}>
                {maxStops === 0
                  ? t("package.pillDirect")
                  : maxStops === 1
                    ? t("package.pillStopsOne")
                    : t("package.pillStops", { count: maxStops })}
              </Pill>
            )}
          </div>

          {result.notices.map((notice) => (
            <p key={notice} className="mt-3 rounded-button bg-orange-soft px-3.5 py-3 text-sm leading-snug">
              {t(NOTICES[notice])}
            </p>
          ))}

          {hotel && <HotelCard hotel={hotel} />}

          {out && (
            <>
              <SectionTitle className="mt-7">{t("package.flightsTitle")}</SectionTitle>
              <div className="mt-3 rounded-card bg-card px-4 py-1.5 shadow-soft">
                <LegBlock leg={out} label={t("package.outbound")} />
                {back && (
                  <>
                    <div className="h-px bg-line" />
                    <LegBlock leg={back} label={t("package.inbound")} />
                  </>
                )}
              </div>
            </>
          )}

          <Included flight={flight} hotel={hotel} nights={nights} passengers={option.totals.passengers} />

          <SmartTip result={result} offers={run.offers} />
        </div>
      </div>

      <TotalBar option={option} fx={result.fx} lang={lang} onValidate={() => router.push(withTripSearch("/trip/ready"))} />
    </div>
  );
}

function RoundButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn("absolute top-4 z-20 flex size-11 items-center justify-center rounded-pill bg-card text-ink shadow-soft", className)}
    >
      {children}
    </button>
  );
}

function HotelCard({ hotel }: { hotel: HotelOffer }) {
  const { t, lang } = useLanguage();
  const [kept, setKept] = useState(false);
  const rating = hotel.attrs.review_rating;
  const score =
    rating != null
      ? new Intl.NumberFormat(localeFor(lang), { minimumFractionDigits: 1, maximumFractionDigits: 1, numberingSystem: "latn" }).format(rating)
      : null;
  const amenities = hotelAmenities(hotel);
  const run = useAgentRun();
  const destination = run.result?.destination;
  const where = [
    destination ? placeName(destination.iata, lang, destination.city) : null,
    distanceText(hotel.attrs.distance, lang, t),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <SectionTitle className="mt-[26px]">{t("package.hotelTitle")}</SectionTitle>
      <div className="mt-3 overflow-hidden rounded-card bg-card shadow-soft">
        <HotelPhoto src={hotel.attrs.main_image} alt={hotel.attrs.name} className="h-[190px]">
          {(shown) => (
            <>
              {score && (
                <span className="absolute bottom-3 start-3 flex items-center gap-2 rounded-xl bg-card/95 py-1.5 pe-2.5 ps-1.5">
                  <span className="rounded-lg bg-ink px-[7px] py-1 text-[13px] font-bold text-card">
                    <bdi>{score}</bdi>
                  </span>
                  <span className="text-[12.5px] font-semibold">
                    {ratingWord(rating!, t)}
                    {hotel.attrs.review_count != null && (
                      <span className="font-medium text-muted">
                        {" · "}
                        {t("package.reviews", { count: formatAmount(hotel.attrs.review_count, lang) })}
                      </span>
                    )}
                  </span>
                </span>
              )}
              <button
                type="button"
                aria-label={t("package.keep")}
                aria-pressed={kept}
                onClick={() => {
                  haptic("select");
                  setKept((value) => !value);
                }}
                className="absolute end-3 top-3 flex size-[34px] items-center justify-center rounded-pill bg-card/95"
              >
                <Heart size={18} weight={kept ? "fill" : "light"} className={kept ? "text-red" : "text-ink"} />
              </button>
              {shown && (
                <span className="absolute bottom-3 end-3 text-[9.5px] font-semibold text-card [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                  {t("package.photoTrivago")}
                </span>
              )}
            </>
          )}
        </HotelPhoto>
        <div className="px-4 pb-4 pt-3.5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0">
              <p className="text-[16.5px] font-bold tracking-[-0.01em]">
                <bdi>{hotel.attrs.name}</bdi>
              </p>
              {where && (
                <p className="mt-[3px] flex items-center gap-1 text-[13px] text-muted">
                  <MapPin size={14} weight="light" className="shrink-0" aria-hidden />
                  <span className="truncate">{where}</span>
                </p>
              )}
            </div>
            {hotel.attrs.stars != null && hotel.attrs.stars > 0 && (
              <span className="mt-1 flex shrink-0 gap-px text-ink" aria-label={`${hotel.attrs.stars}★`}>
                {Array.from({ length: Math.min(5, Math.round(hotel.attrs.stars)) }, (_, index) => (
                  <Star key={index} size={13} weight="fill" aria-hidden />
                ))}
              </span>
            )}
          </div>
          {amenities.length > 0 && (
            <>
              <div className="my-3.5 h-px bg-line" />
              <ul className="flex justify-between">
                {amenities.map((item) => {
                  const { icon: AmenityIcon, key } = AMENITY[item.id];
                  const label =
                    item.id === "rooms"
                      ? item.count === 1
                        ? t("amenity.roomsOne")
                        : t("amenity.rooms", { count: item.count ?? 1 })
                      : t(key);
                  return (
                    <li key={item.id} className="flex flex-col items-center gap-[5px] text-[11.5px] text-muted">
                      <AmenityIcon size={22} weight="light" className="text-ink" aria-hidden />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Included({
  flight,
  hotel,
  nights,
  passengers,
}: {
  flight: FlightOffer | null;
  hotel: HotelOffer | null;
  nights: number;
  passengers: number;
}) {
  const { t } = useLanguage();
  const bag = flight?.attrs.baggage ?? null;
  const rows: { icon: Icon; text: string; sub?: string; ok: boolean }[] = [];
  if (flight) rows.push({ icon: AirplaneTilt, text: t("package.incFlights", { count: passengers }), ok: true });
  if (hotel) {
    const n = nightsText(nights, t);
    rows.push({
      icon: Bed,
      text: hotel.attrs.breakfast ? t("package.incNightsBreakfast", { nights: n }) : t("package.incNights", { nights: n }),
      ok: true,
    });
  }
  if (bag && bag.personal_item > 0) rows.push({ icon: Backpack, text: t("package.incPersonal"), ok: true });
  if (bag && bag.cabin_bag > 0) rows.push({ icon: Suitcase, text: t("package.incCabin"), ok: true });
  if (bag) {
    rows.push(
      bag.checked_bag > 0
        ? { icon: SuitcaseRolling, text: t("package.incChecked"), ok: true }
        : { icon: SuitcaseRolling, text: t("package.incChecked"), sub: t("package.addAtKiwi"), ok: false },
    );
  }
  if (!rows.length) return null;

  return (
    <>
      <SectionTitle className="mt-7">{t("package.includedTitle")}</SectionTitle>
      <ul className="mt-3 rounded-card bg-card px-4 py-1 shadow-soft">
        {rows.map((row, index) => {
          const RowIcon = row.icon;
          return (
            <li key={index} className={cn("flex items-center gap-3.5 py-3", index > 0 && "border-t border-line")}>
              <RowIcon size={22} weight="light" className={row.ok ? "shrink-0 text-ink" : "shrink-0 text-orange"} aria-hidden />
              <span className="min-w-0 flex-1 text-[14.5px]">
                {row.text}
                {row.sub && <span className="mt-px block text-[12.5px] text-muted">{row.sub}</span>}
              </span>
              {row.ok ? (
                <CheckCircle size={20} weight="light" className="shrink-0 text-green" aria-hidden />
              ) : (
                <Pill tone="todo" className="h-6 text-[11.5px]">
                  {t("package.notIncluded")}
                </Pill>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SmartTip({ result, offers }: { result: AgentPackage; offers: Record<string, import("@/lib/prices/store").Offer> }) {
  const { t, lang } = useLanguage();
  const delta = result.smart_tip.delta;
  if (result.smart_tip.kind === "none" || !delta) return null;
  const compareId = result.smart_tip.compare_flight_id;
  const compare = compareId ? asFlight(offers[compareId]) : null;
  const alternative = result.alternatives.find((alt) => alt.flight_id === compareId) ?? null;
  const carrier = compare ? legCarriers(compare.attrs.outbound, t) : "";
  const values = {
    carrier: carrier ? ltr(carrier) : t("package.tipOther"),
    mad: ltr(formatMad(Math.abs(delta.extra_display_mad))),
    duration: ltr(formatDuration(Math.abs(delta.saved_minutes), lang)),
  };
  const text = result.smart_tip.kind === "cheaper_flight" ? t("package.tipLess", values) : t("package.tipMore", values);

  return (
    <div className="mt-5 flex items-start gap-3 rounded-card border border-tip-line bg-gradient-to-b from-tip-top to-card p-4">
      <SafarLogo size={40} className="-rotate-[10deg]" />
      <div className="min-w-0">
        <p className="text-[14.5px] font-bold">{t("package.tipTitle")}</p>
        <p className="mt-[3px] text-[13.5px] leading-[1.45] text-body">{text}</p>
        {alternative && (
          <button
            type="button"
            onClick={() => {
              haptic("select");
              selectPackage(packageOptionId(alternative.flight_id, alternative.hotel_id));
            }}
            className="mt-1 min-h-11 text-[13px] font-semibold text-blue"
          >
            {t("package.tipSee")}
          </button>
        )}
      </div>
    </div>
  );
}

function TotalBar({
  option,
  fx,
  lang,
  onValidate,
}: {
  option: PackageOption;
  fx: { rate: number; date: string };
  lang: Lang;
  onValidate: () => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const totals = option.totals;
  const rate = totals.fx ?? fx;
  const perPerson =
    totals.passengers === 1
      ? t("package.perPersonOne")
      : t("package.perPerson", { count: totals.passengers, amount: ltr(formatMad(totals.per_person_display_mad)) });

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3.5 border-t border-line bg-card px-5 pb-[22px] pt-3.5 shadow-[0_-10px_30px_rgb(11_11_15/0.06)]">
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="block min-h-11 text-start"
        >
          <span className="block text-2xl font-extrabold tabular-nums tracking-[-0.02em]">
            <bdi>{formatMad(totals.total_display_mad)}</bdi>
          </span>
          <span className="block text-[12.5px] text-muted">{perPerson}</span>
        </button>
        {open && (
          <span
            role="status"
            className="absolute bottom-full start-0 z-30 mb-2 w-60 rounded-button bg-ink px-3 py-2 text-start text-xs font-medium leading-snug text-card shadow-soft"
          >
            <span className="block">
              {totals.sources.flight} · {totals.sources.hotel}
            </span>
            <span className="block text-card/80">{t("price.captured", { time: formatWhen(totals.fetched_at.flight, lang) })}</span>
            <span className="block text-card/80">{t("price.fx", { rate: rate.rate, date: rate.date })}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          haptic("tap");
          onValidate();
        }}
        className="flex h-[54px] shrink-0 items-center justify-center rounded-button bg-ink px-[22px] text-base font-semibold text-card active:scale-[0.97]"
      >
        <JuryLabel k="package.validate" />
      </button>
    </div>
  );
}

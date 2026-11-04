"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Clouds } from "@/components/bs/Clouds";
import { Safar } from "@/components/bs/Safar";
import { Sheet } from "@/components/bs/Sheet";
import { useAgentRun } from "@/lib/agent-client/context";
import { withTripSearch } from "@/lib/agent-client/store";
import { placeName } from "@/lib/airports";
import { legSentence } from "@/lib/trip/describe";
import { HotelPhoto } from "./TripBits";
import { dateRangeParts, formatEur, formatMad, formatWhen } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { FxRate } from "@/lib/prices/money";
import type { FlightOffer, HotelOffer } from "@/lib/prices/store";
import { asFlight, asHotel, pickOption } from "@/lib/trip/selection";
import { JuryLine } from "./JuryLine";

/** Screen 09. The photo is Kiwi.com's, untouched. Links are the stored deeplinks. */
export function CheckScreen() {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [detail, setDetail] = useState(false);
  const [pay, setPay] = useState(false);
  const [photoReady, setPhotoReady] = useState(false);
  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;

  if (!result || !option || !flight || !hotel) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky to-bg px-8 text-center">
        <p className="text-[17px] text-muted">{t("check.missing")}</p>
        <button type="button" className="min-h-11 font-semibold underline" onClick={() => router.push(withTripSearch("/trip/plan"))}>
          {t("result.backToPlan")}
        </button>
      </div>
    );
  }

  const totals = option.totals;
  const from = hotel.attrs.arrival;
  const to = hotel.attrs.departure;
  const range = dateRangeParts(from, to, lang);
  const origin = placeName(flight.attrs.outbound.from, lang, flight.attrs.outbound.segments?.[0]?.from_city);
  const city = placeName(result.destination.iata, lang, result.destination.city);
  const nights = hotel.attrs.nights || totals.hotel.nights;
  const outSentence = legSentence(flight.attrs.outbound, lang, t);
  const flightsLine = [outSentence.carriers, outSentence.detail].filter(Boolean).join(" · ");
  const adults = flight.attrs.passengers.adults;
  const children = flight.attrs.passengers.children + flight.attrs.passengers.infants;
  const travellers =
    children > 0
      ? t("check.party", { adults, children, city: origin })
      : adults === 1
        ? t("check.adultsOne", { city: origin })
        : t("check.adults", { count: adults, city: origin });
  const edit = () => router.push(withTripSearch("/trip/understood"));

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-sky to-bg">
      <Clouds className="h-40" />
      <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3">
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => router.push(withTripSearch("/trip/ready"))}
            className="flex size-11 items-center justify-center rounded-pill bg-fill"
          >
            <X size={20} weight="light" aria-hidden />
          </button>
        </div>
        <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">{t("check.title")}</h1>
        <JuryLine k="check.title" />
        <p className="text-base text-muted">{t("check.subtitle")}</p>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          <article className="rounded-card border border-line bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 border-b border-line pb-3.5">
              <div className="flex gap-1.5">
                <HotelPhoto src={hotel.attrs.main_image} alt={hotel.attrs.name} className="size-16 rounded-[14px]">
                  {(shown) =>
                    shown ? (
                      <span className="absolute inset-x-0 bottom-0.5 text-center text-[8.5px] font-semibold text-card [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
                        trivago
                      </span>
                    ) : null
                  }
                </HotelPhoto>
                <DestinationPhoto imageId={flight.attrs.image_id} onReady={setPhotoReady} />
              </div>
              <div className="flex min-w-0 flex-col justify-center">
                <p className="text-lg font-extrabold">
                  {nights === 1 ? t("check.nightsOne", { city, count: nights }) : t("check.nights", { city, count: nights })}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  {hotel.attrs.review_rating != null && (
                    <>
                      <Star size={13} weight="fill" className="text-ink" aria-hidden />
                      <strong className="text-ink">
                        <bdi>{hotel.attrs.review_rating}</bdi>
                      </strong>
                      <span>·</span>
                    </>
                  )}
                  <span className="truncate">{hotel.attrs.name}</span>
                </p>
                <PhotoCredit show={photoReady} />
              </div>
            </div>

            <Row label={t("check.flights")} value={flightsLine} />
            <Row label={t("check.dates")} value={t("check.datesValue", { from: range.from, to: range.to })} action={t("check.edit")} onAction={edit} />
            <Row label={t("check.travellers")} value={travellers} action={t("check.edit")} onAction={edit} />
            <Row
              label={t("check.price")}
              value={t("check.priceValue", { amount: formatMad(totals.total_display_mad) })}
              action={detail ? t("check.hide") : t("check.detail")}
              onAction={() => setDetail((open) => !open)}
            />
            {detail && (
              <div className="flex flex-col gap-3 border-b border-line py-3">
                <PriceLine kind="flight" offer={flight} fx={flight.fx} />
                <PriceLine kind="hotel" offer={hotel} fx={hotel.fx} />
              </div>
            )}
            <div className="pt-3.5">
              <p className="font-bold">{t("check.cancel")}</p>
              <p className="text-[15px] text-muted">
                {hotel.attrs.free_cancellation && !hotel.attrs.non_refundable ? t("check.cancelFree") : t("check.cancelNo")}
              </p>
            </div>
          </article>

          <div className="flex items-center gap-2.5 rounded-button bg-green-soft px-3.5 py-3">
            <Safar state="idle" size={48} tilt={-8} />
            <p className="text-[15px] leading-snug">{t("check.shield")}</p>
          </div>
        </div>

        <div aria-hidden className="mt-3 grid grid-cols-3 gap-1.5">
          <span className="h-1 rounded bg-ink" />
          <span className="h-1 rounded bg-line" />
          <span className="h-1 rounded bg-line" />
        </div>
        <Button full className="mt-3" onClick={() => setPay(true)}>
          {t("check.next")}
        </Button>
      </div>

      <Sheet open={pay} onClose={() => setPay(false)} title={t("check.payTitle")}>
        <p className="mt-2 text-[15px] leading-snug text-muted">{t("check.payBody")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <PartnerLink href={flight.deeplink} label={t("check.openFlight")} />
          <PartnerLink href={hotel.deeplink} label={t("check.openHotel")} />
        </div>
        <Button full className="mt-4" onClick={() => router.push(withTripSearch("/trip/file"))}>
          {t("check.booked")}
        </Button>
      </Sheet>
    </div>
  );
}

function Row({
  label,
  value,
  action,
  onAction,
}: {
  label: string;
  value: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3.5">
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        <span className="block text-[15px] text-muted">{value}</span>
      </span>
      {action && onAction && (
        <button type="button" onClick={onAction} className="min-h-11 shrink-0 rounded-button-sm bg-fill px-3.5 text-sm font-semibold">
          {action}
        </button>
      )}
    </div>
  );
}

function PriceLine({
  kind,
  offer,
  fx,
}: {
  kind: "flight" | "hotel";
  offer: FlightOffer | HotelOffer;
  fx: FxRate | null;
}) {
  const { t, lang } = useLanguage();
  const original =
    offer.currency === "MAD" ? null : offer.currency === "EUR" ? formatEur(offer.price) : `${offer.price} ${offer.currency}`;
  return (
    <div className="text-sm">
      <p className="font-semibold">
        {t(kind === "flight" ? "check.flight" : "check.hotel")} · <bdi>{formatMad(offer.price_mad_display)}</bdi>
      </p>
      {original && (
        <p className="text-muted">
          <bdi>{original}</bdi>
        </p>
      )}
      <p className="text-muted">
        {offer.source} · {t("price.captured", { time: formatWhen(offer.fetched_at, lang) })}
      </p>
      <p className="text-muted">{fx ? t("price.fx", { rate: fx.rate, date: fx.date }) : t("price.fxMad")}</p>
    </div>
  );
}

function PartnerLink({ href, label }: { href: string | null; label: string }) {
  const { t } = useLanguage();
  if (!href) return <p className="min-h-11 text-sm text-muted">{t("check.linkMissing")}</p>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center justify-center rounded-button bg-fill px-4 text-center text-[15px] font-semibold"
    >
      {label}
    </a>
  );
}

function PhotoCredit({ show }: { show: boolean }) {
  const { t } = useLanguage();
  if (!show) return null;
  return <p className="mt-1 text-[11px] text-muted">{t("check.photo")}</p>;
}

function DestinationPhoto({
  imageId,
  onReady,
}: {
  imageId?: string | null;
  onReady: (ok: boolean) => void;
}) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (!imageId || failed) {
    return <div aria-hidden className="size-16 rounded-[14px] bg-gradient-to-b from-sky via-blue-soft to-orange-soft" />;
  }
  return (
    // The URL is the one Kiwi.com documents. It must not be rewritten or drawn on.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://images.kiwi.com/photos/600x600/${imageId}.jpg`}
      alt={t("check.photo")}
      width={64}
      height={64}
      className="size-16 rounded-[14px] object-cover"
      onLoad={() => onReady(true)}
      onError={() => {
        setFailed(true);
        onReady(false);
      }}
    />
  );
}

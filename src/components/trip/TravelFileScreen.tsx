"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AirplaneTilt, Export, GoogleLogo, Star } from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import { useAgentRun } from "@/lib/agent-client/context";
import { withTripSearch } from "@/lib/agent-client/store";
import { placeName } from "@/lib/airports";
import { formatDay, formatMad, formatTime, formatTripDate } from "@/lib/format";
import type { Lang, TranslateValues, TranslationKey } from "@/lib/i18n";
import { legCarriers, legSentence } from "@/lib/trip/describe";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import { readPoster, readServerPoster, subscribePoster } from "@/lib/poster/client";
import { useProfile } from "@/lib/profile/useProfile";
import { freezeRun } from "@/lib/trip/freeze";
import {
  readSavedTrips,
  readServerSavedTrips,
  rememberTrip,
  subscribeSavedTrips,
  type FrozenPackage,
} from "@/lib/trip/saved";
import { EASE_DEFAULT } from "@/lib/motion";
import { BookingPill } from "./BookingPill";
import { JuryLine } from "./JuryLine";

/** Screen 10. The pass prints, then the stamp lands once. */
export function TravelFileScreen({ dotationMad }: { dotationMad: number }) {
  const run = useAgentRun();
  const saved = useSyncExternalStore(subscribeSavedTrips, readSavedTrips, readServerSavedTrips);
  const poster = useSyncExternalStore(subscribePoster, readPoster, readServerPoster);
  const { t, lang } = useLanguage();
  const { profile, user, signInWithGoogle } = useProfile();
  const reduced = useReducedMotion();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [stamp, setStamp] = useState(!!reduced);

  const live = useMemo(() => {
    const posterUrl = poster.fallback ? poster.url : poster.url?.startsWith("http") ? poster.url : null;
    return freezeRun(run, dotationMad, posterUrl);
  }, [run, dotationMad, poster.fallback, poster.url]);

  useEffect(() => {
    if (!live) return;
    void rememberTrip(live);
  }, [live]);

  useEffect(() => {
    const show = setTimeout(() => setStamp(true), reduced ? 0 : 1800);
    const pulse = setTimeout(() => haptic("success"), reduced ? 200 : 2100);
    return () => {
      clearTimeout(show);
      clearTimeout(pulse);
    };
  }, [reduced]);

  const pack = live?.package ?? saved.trips[0]?.package ?? null;
  const stored = saved.trips.find((trip) => trip.run_id === live?.run_id) ?? saved.trips[0] ?? null;

  if (!pack) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-sky to-bg px-8 text-center">
        <p className="text-[17px] text-muted">{t("file.missing")}</p>
        <button type="button" className="min-h-11 font-semibold underline" onClick={() => router.push(withTripSearch("/trip/plan"))}>
          {t("result.backToPlan")}
        </button>
      </div>
    );
  }

  const view = describe(pack, lang, t);
  const name = profile.first_name?.trim() ?? "";

  async function share() {
    const text = t("file.shareText", { city: view.city, dates: view.dates, total: view.total });
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "BonSafar", text });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-sky to-bg">
      <div className="absolute end-4 top-3 z-10">
        <Safar state="bye" size={84} tilt={-12} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 pe-24 pt-7">
          <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">{t("file.kicker")}</p>
          <h1 className="mt-1.5 text-[32px] font-extrabold leading-none tracking-tight">
            {name ? t("file.title", { name }) : t("file.titleNoName")}
          </h1>
          <JuryLine k={name ? "file.title" : "file.titleNoName"} values={name ? { name } : undefined} />
        </div>

        <div className="relative mx-4 mt-4">
          <div aria-hidden className="h-3.5 rounded-pill bg-ink" />
          <div className="relative mx-2.5 -mt-1.5 h-[300px] overflow-hidden">
            <motion.article
              aria-label={t("file.demo")}
              className="relative overflow-hidden rounded-b-card bg-card shadow-soft"
              initial={reduced ? { opacity: 0 } : { y: "-100%" }}
              animate={
                reduced
                  ? { opacity: 1 }
                  : { y: ["-100%", "-75%", "-75%", "-50%", "-50%", "-25%", "-25%", "0%"] }
              }
              transition={
                reduced
                  ? { duration: 0.2 }
                  : { duration: 2.6, times: [0, 0.12, 0.18, 0.3, 0.36, 0.48, 0.54, 0.66], ease: EASE_DEFAULT }
              }
            >
              <div className="bg-green px-4 pb-3.5 pt-4 text-card">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] font-semibold tracking-wide opacity-90">
                  <span className="shrink-0 whitespace-nowrap">{t("file.demo")}</span>
                  <span className="min-w-0 truncate font-sans normal-case tracking-normal">{view.carriers}</span>
                </div>
                <div className="mt-2 flex items-center justify-between" dir="ltr">
                  <span className="flex flex-col">
                    <span className="text-[44px] font-extrabold leading-none tracking-tight">{view.from}</span>
                    <span className="mt-1 text-xs font-semibold opacity-90" dir="auto">
                      {view.fromCity}
                    </span>
                  </span>
                  <AirplaneTilt size={28} weight="light" aria-hidden />
                  <span className="flex flex-col items-end">
                    <span className="text-[44px] font-extrabold leading-none tracking-tight">{view.to}</span>
                    <span className="mt-1 text-xs font-semibold opacity-90" dir="auto">
                      {view.toCity}
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5 px-4 py-3.5 font-mono">
                <Field label={t("file.date")} value={view.date} />
                <Field label={t("file.depart")} value={view.time} />
                <Field label={t("file.passengers")} value={String(view.passengers)} />
                <div className="col-span-2">
                  <Field label={t("file.hotel")} value={view.hotel} />
                </div>
                <Field label={t("file.nights")} value={String(view.nights)} />
              </div>
              <div className="flex items-center gap-3 px-4 pb-4">
                <DemoQr />
                <p className="text-xs leading-snug text-muted">{t("file.qr")}</p>
              </div>
              <motion.span
                aria-hidden
                className="absolute bottom-3.5 end-5 size-24 rounded-pill bg-stamp-red"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={stamp && !reduced ? { scale: [0.6, 1.15, 1.25], opacity: [0, 0.35, 0] } : { opacity: 0 }}
                transition={{ duration: 0.7 }}
              />
              <motion.div
                role="img"
                aria-label={t("file.stamp")}
                className="absolute bottom-4 end-4 flex size-[92px] flex-col items-center justify-center rounded-pill border-[3px] border-stamp-red bg-card/70 text-stamp-red"
                initial={reduced ? { opacity: 1, rotate: -12 } : { opacity: 0, scale: 1.4, rotate: -20 }}
                animate={stamp ? { opacity: 1, scale: 1, rotate: -12 } : { opacity: 0, scale: 1.4, rotate: -20 }}
                transition={reduced ? { duration: 0.2 } : { type: "spring", duration: 0.4, bounce: 0.4 }}
              >
                <Star size={26} weight="light" className="text-stamp-green" aria-hidden />
                <span className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.08em]">{t("file.stamp")}</span>
                <span className="font-mono text-[9px] font-semibold">BONSAFAR</span>
              </motion.div>
            </motion.article>
          </div>
        </div>

        <motion.ul
          className="mx-5 mt-3.5 rounded-card bg-card px-3.5"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduced ? 0 : 2.2, duration: reduced ? 0.2 : 0.5, ease: EASE_DEFAULT }}
        >
          <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px]">
            <span className="font-semibold">{t("file.return")}</span>
            <span className="text-end text-muted">
              <bdi>{view.returnLabel}</bdi>
            </span>
          </li>
          <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px]">
            <span className="font-semibold">{t("file.hotelRow")}</span>
            <span className="text-muted">{view.breakfast ? t("file.hotelBreakfast", { count: view.nights }) : t("file.hotelValue", { count: view.nights })}</span>
          </li>
          {stored?.booking_status && (
            <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px]">
              <span className="font-semibold">{t("file.booking")}</span>
              <BookingPill status={stored.booking_status} />
            </li>
          )}
          <li className="flex items-center justify-between gap-3 py-2.5 text-[15px]">
            <span className="font-semibold">{t("file.readyRow")}</span>
            <span className={view.readyOk < 4 ? "font-semibold text-orange" : "font-semibold text-green"}>
              {t("file.readyValue", { ok: view.readyOk })}
            </span>
          </li>
        </motion.ul>
      </div>

      <div className="px-5 pb-5 pt-3">
        <p className="mb-2 text-center text-xs text-muted">
          {stored?.synced_id ? t("file.savedAccount") : t("file.savedLocal")}
          {copied ? ` ${t("file.copied")}` : ""}
        </p>
        {!user && (
          <button
            type="button"
            onClick={() => void signInWithGoogle(withTripSearch("/trip/file"))}
            className="mb-2.5 flex h-14 w-full items-center justify-center gap-2 rounded-button bg-card text-base font-bold shadow-soft"
          >
            <GoogleLogo size={18} weight="light" aria-hidden />
            {t("file.saveGoogle")}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => router.push(withTripSearch("/trip/poster"))}
            className="h-14 rounded-button border border-line bg-card text-base font-bold"
          >
            {t("file.poster")}
          </button>
          <button
            type="button"
            onClick={() => void share()}
            className="flex h-14 items-center justify-center gap-2 rounded-button bg-blue text-base font-bold text-card"
          >
            <Export size={18} weight="light" aria-hidden />
            {t("file.share")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-muted">{label}</p>
      <p className="truncate text-sm font-bold">
        <bdi>{value}</bdi>
      </p>
    </div>
  );
}

function DemoQr() {
  return (
    <svg aria-hidden width="64" height="64" viewBox="0 0 8 8" shapeRendering="crispEdges" className="shrink-0">
      <rect width="8" height="8" className="fill-card" />
      <path d="M0 0h3v3H0zM5 0h3v3H5zM0 5h3v3H0zM4 4h1v1H4zM6 4h1v2H6zM4 6h1v2H4zM5 5h1v1H5zM3 3h1v1H3zM4 1h1v2H4z" className="fill-ink" />
      <path d="M1 1h1v1H1zM6 1h1v1H6zM1 6h1v1H1z" className="fill-card" />
    </svg>
  );
}

function describe(
  pack: FrozenPackage,
  lang: Lang,
  t: (key: TranslationKey, values?: TranslateValues) => string,
) {
  const out = pack.flight.attrs.outbound;
  const back = pack.flight.attrs.inbound;
  const date = formatDay(out.departure.slice(0, 10), lang);
  const backDate = back ? formatTripDate(back.departure.slice(0, 10), lang) : "";
  const backLine = back ? legSentence(back, lang, t) : null;
  const rangeFrom = formatDay(pack.hotel.attrs.arrival, lang);
  const rangeTo = formatDay(pack.hotel.attrs.departure, lang);
  return {
    from: out.from,
    to: out.to,
    fromCity: placeName(out.from, lang, out.segments?.[0]?.from_city),
    toCity: placeName(out.to, lang, out.segments?.at(-1)?.to_city),
    carriers: legCarriers(out, t),
    date: date.toLocaleUpperCase(lang === "en" ? "en-GB" : "fr-FR"),
    time: formatTime(out.departure),
    passengers: pack.totals.passengers,
    hotel: pack.hotel.attrs.name,
    nights: pack.hotel.attrs.nights || pack.totals.hotel.nights,
    breakfast: pack.hotel.attrs.breakfast,
    returnLabel: [backDate, backLine?.carriers, backLine?.detail].filter(Boolean).join(" · "),
    readyOk: pack.ready_ok,
    city: placeName(pack.destination.iata, lang, pack.destination.city),
    dates: `${rangeFrom} – ${rangeTo}`,
    total: formatMad(pack.totals.total_display_mad),
  };
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { Clouds } from "@/components/bs/Clouds";
import { Safar } from "@/components/bs/Safar";
import { useAgentRun } from "@/lib/agent-client/context";
import { withTripSearch } from "@/lib/agent-client/store";
import { airportCity } from "@/lib/airports";
import { formatDay, formatTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import {
  ensurePoster,
  readPoster,
  readServerPoster,
  retryPoster,
  subscribePoster,
} from "@/lib/poster/client";
import { readSavedTrips, readServerSavedTrips, subscribeSavedTrips } from "@/lib/trip/saved";
import { asFlight, pickOption } from "@/lib/trip/selection";

/** Screen 10 bis. The illustration has no text; the labels are HTML on top. */
export function PosterScreen() {
  const run = useAgentRun();
  const saved = useSyncExternalStore(subscribeSavedTrips, readSavedTrips, readServerSavedTrips);
  const poster = useSyncExternalStore(subscribePoster, readPoster, readServerPoster);
  const { t, lang, rtl } = useLanguage();
  const { profile } = useProfile();
  const router = useRouter();
  const frame = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const pack = flight && result ? null : (saved.trips[0]?.package ?? null);
  const liveFlight = flight ?? pack?.flight ?? null;
  const city = result?.destination.city ?? pack?.destination.city ?? "";
  const country = result?.destination.country ?? pack?.destination.country ?? "";
  const runId = run.run?.run_id ?? saved.trips[0]?.run_id ?? null;
  const istanbul = city.toLowerCase().includes("istanbul") || run.scenario === "istanbul" || saved.trips[0]?.run_id.includes("istanbul");

  useEffect(() => {
    if (!runId || !city) return;
    ensurePoster({ runId, city, country, istanbul });
  }, [runId, city, country, istanbul]);

  const originCode = liveFlight?.attrs.outbound.from ?? "";
  const origin = (airportCity(originCode) ?? pack?.origin_city ?? originCode).toUpperCase();
  const destination = city.toUpperCase();
  const name = profile.first_name?.trim() ?? "";
  const when = liveFlight
    ? `${formatDay(liveFlight.attrs.outbound.departure.slice(0, 10), lang)} ${formatTime(liveFlight.attrs.outbound.departure)}`
    : "";
  const ready = poster.status === "live" || poster.status === "fallback";

  async function share() {
    const node = frame.current;
    if (!node) return;
    setExporting(true);
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
      if (!blob) return;
      const file = new File([blob], `bonsafar-${city || "trip"}.png`, { type: "image/png" });
      const payload = { files: [file], title: "BonSafar" };
      if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(payload))) {
        try {
          await navigator.share(payload);
          return;
        } catch {
          // The person closed the sheet. A download is still there if share rejected the files.
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-sky to-bg">
      <div className="flex items-center gap-3 px-4 pt-3">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.push(withTripSearch("/trip/file"))}
          className="flex size-11 items-center justify-center rounded-pill bg-card"
        >
          <CaretLeft size={18} weight="bold" className="rtl:-scale-x-100" aria-hidden />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <div ref={frame} className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-card bg-sky">
          {ready && poster.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-sky via-blue-soft to-bg">
              <Clouds />
              <p className="absolute inset-x-6 bottom-24 text-center text-sm text-muted">
                {poster.status === "error" ? t("poster.error") : t("poster.loading")}
              </p>
            </div>
          )}
          {ready && (
            <>
              <div className="absolute start-4 top-5 flex flex-col items-start gap-1.5">
                <span className="bg-ink px-2 py-1 text-[13px] font-extrabold tracking-wide text-card">
                  <bdi>{t("poster.bslama", { city: origin })}</bdi>
                </span>
                <span className="bg-ink px-2 py-1 text-[13px] font-extrabold tracking-wide text-card">
                  <bdi>{t("poster.next", { city: destination })}</bdi>
                </span>
              </div>
              <div className="absolute inset-x-3 bottom-6 rotate-[-8deg]">
                <article className="relative flex overflow-hidden rounded-card bg-card shadow-soft">
                  <div className="flex w-[42%] flex-col items-center justify-center bg-green px-2 py-4 text-card">
                    <span className="text-[28px] font-extrabold leading-none">
                      <bdi>{originCode}</bdi>
                    </span>
                    <span className="my-1 text-lg" aria-hidden>
                      →
                    </span>
                    <span className="text-[28px] font-extrabold leading-none">
                      <bdi>{liveFlight?.attrs.outbound.to}</bdi>
                    </span>
                  </div>
                  <div className="relative min-w-0 flex-1 px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-[9px] font-semibold tracking-wide text-muted">{t("poster.made")}</p>
                      <p
                        className={rtl ? "font-arabic text-base font-semibold text-stamp-red" : "font-mono text-[13px] font-bold tracking-wide text-stamp-red"}
                      >
                        {t("poster.rihla")}
                      </p>
                    </div>
                    {name && <p className="mt-1 text-sm font-extrabold">{name}</p>}
                    <p className="text-[11px] text-muted">
                      <bdi>
                        {origin} → {destination}
                      </bdi>
                    </p>
                    {when && (
                      <p className="mt-1 font-mono text-[11px] font-semibold">
                        <bdi>{when}</bdi>
                      </p>
                    )}
                    <DemoBarcode />
                    <span className="absolute bottom-1 end-1">
                      <Safar state="bye" size={36} tilt={-8} />
                    </span>
                  </div>
                </article>
              </div>
            </>
          )}
        </div>
        {poster.fallback && <p className="mt-2 text-center text-xs text-muted">{t("poster.fallback")}</p>}
        <div className="mt-3">
          {poster.status === "error" && runId && city ? (
            <button
              type="button"
              onClick={() => retryPoster({ runId, city, country, istanbul })}
              className="flex h-14 w-full items-center justify-center rounded-button bg-ink text-[17px] font-bold text-card"
            >
              {t("poster.retry")}
            </button>
          ) : (
            <button
              type="button"
              disabled={!ready || exporting}
              onClick={() => void share()}
              className="flex h-14 w-full items-center justify-center rounded-button bg-blue text-[17px] font-bold text-card disabled:opacity-40"
            >
              {t("poster.share")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoBarcode() {
  return (
    <svg aria-hidden viewBox="0 0 80 16" className="mt-2 h-4 w-full">
      <rect width="80" height="16" className="fill-card" />
      {Array.from({ length: 28 }, (_, index) => (
        <rect key={index} x={index * 2.8} y="0" width={index % 3 === 0 ? 1.6 : 0.7} height="16" className="fill-ink" />
      ))}
    </svg>
  );
}

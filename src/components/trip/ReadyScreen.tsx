"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CloudSun, CurrencyCircleDollar, Plug, type Icon } from "@phosphor-icons/react";
import { CaretLeft } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { ModelText } from "@/components/bs/ModelText";
import { Safar } from "@/components/bs/Safar";
import { useAgentRun } from "@/lib/agent-client/context";
import { withTripSearch } from "@/lib/agent-client/store";
import type { GoodToKnowNotes } from "@/lib/trip/good-to-know-client";
import { airportCity } from "@/lib/airports";
import { formatDay } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { ensurePoster } from "@/lib/poster/client";
import { scriptForLang } from "@/lib/profile/schema";
import { useProfile } from "@/lib/profile/useProfile";
import { buildChecklist, todoCount } from "@/lib/trip/checklist";
import { loadGoodToKnow } from "@/lib/trip/good-to-know-client";
import { asFlight, asHotel, pickOption } from "@/lib/trip/selection";
import { ChecklistBoard, boardLandedDelay } from "./ChecklistTiles";
import { JuryLabel, JuryLine } from "./JuryLine";

const TOPICS: { id: keyof GoodToKnowNotes; icon: Icon }[] = [
  { id: "timezone", icon: Clock },
  { id: "plugs", icon: Plug },
  { id: "currency", icon: CurrencyCircleDollar },
  { id: "weather", icon: CloudSun },
];

function monthLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Screen 08. Tiles land, then Safar jumps once. The poster starts here. */
export function ReadyScreen({ dotationMad }: { dotationMad: number }) {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const { profile } = useProfile();
  const router = useRouter();
  const [celebrate, setCelebrate] = useState(false);
  const [notes, setNotes] = useState<GoodToKnowNotes | null>(null);
  const [notesState, setNotesState] = useState<"loading" | "ready" | "error">("loading");

  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;
  const runId = run.run?.run_id ?? null;
  const city = result?.destination.city ?? "";
  const depart = hotel?.attrs.arrival ?? flight?.attrs.outbound.departure.slice(0, 10) ?? "";
  const script = scriptForLang(lang, profile.darija_script);

  useEffect(() => {
    const timer = setTimeout(() => setCelebrate(true), boardLandedDelay(4));
    return () => clearTimeout(timer);
  }, [runId]);

  useEffect(() => {
    if (!runId || !result || !depart) return;
    const origin = airportCity(flight?.attrs.outbound.from ?? "") ?? "Casablanca";
    const istanbul = city.toLowerCase().includes("istanbul") || run.scenario === "istanbul";
    ensurePoster({
      runId,
      city,
      country: result.destination.country,
      istanbul,
    });
    let alive = true;
    void loadGoodToKnow({
      runId,
      city,
      country: result.destination.country,
      origin,
      month: monthLabel(depart),
      script,
      lang,
    }).then((value) => {
      if (!alive) return;
      setNotes(value);
      setNotesState(value ? "ready" : "error");
    });
    return () => {
      alive = false;
    };
  }, [runId, city, depart, result, flight?.attrs.outbound.from, script, lang, run.scenario]);

  if (!result || !option) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gradient-to-b from-green-soft to-bg px-8 text-center">
        <p className="text-[17px] text-muted">{t("ready.missing")}</p>
        <button type="button" className="min-h-11 font-semibold underline" onClick={() => router.push(withTripSearch("/trip/plan"))}>
          {t("result.backToPlan")}
        </button>
      </div>
    );
  }

  const tiles = buildChecklist({
    entry: result.entry,
    baggage: flight?.attrs.baggage ?? null,
    perPersonDisplayMad: option.totals.per_person_display_mad,
    dotationMad,
  });
  const todo = todoCount(tiles);
  const kicker =
    todo === 0 ? t("ready.kickerNone") : todo === 1 ? t("ready.kickerOne") : t("ready.kickerMany", { count: todo });
  const sources = result.entry?.sources ?? [];
  const sourceDate = (result.entry?.checked_at ?? sources[0]?.date ?? "").slice(0, 10);
  const sourceLine =
    sources.length > 1
      ? t("ready.sources", { count: sources.length, date: sourceDate ? formatDay(sourceDate, lang) : "" })
      : sources.length === 1
        ? t("ready.sourcesOne", { date: sourceDate ? formatDay(sourceDate, lang) : "" })
        : sourceDate
          ? t("ready.sourcesNone", { date: formatDay(sourceDate, lang) })
          : "";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-green-soft to-bg">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-5 pt-4">
          <button
            type="button"
            aria-label={t("common.back")}
            onClick={() => router.push(withTripSearch("/trip/package"))}
            className="flex size-11 items-center justify-center rounded-pill bg-card"
          >
            <CaretLeft size={18} weight="bold" className="rtl:-scale-x-100" aria-hidden />
          </button>
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <span className="size-2.5 rounded-pill bg-green-bright" />
            {kicker}
          </span>
        </div>

        <div className="flex items-center gap-3 px-4 pt-3">
          <Safar state={celebrate ? "found" : "idle"} size={110} tilt={-10} />
          <div>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{t("ready.heading")}</h1>
            <JuryLine k="ready.heading" />
            <p className="mt-1.5 text-[15px] leading-snug text-muted">{t("ready.lead", { city })}</p>
          </div>
        </div>

        <div className="px-5 pt-4">
          <ChecklistBoard tiles={tiles} />
        </div>

        <section className="mx-5 mt-3.5 rounded-card bg-card px-4 py-3.5">
          <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">{t("ready.know")}</p>
          {notesState === "loading" && <p className="text-sm text-muted">{t("ready.knowLoading")}</p>}
          {notesState === "error" && <p className="text-sm text-muted">{t("ready.knowError")}</p>}
          {notes && (
            <ul className="flex flex-col gap-2">
              {TOPICS.map(({ id, icon: Icon }) => (
                <li key={id} className="flex items-start gap-2.5 text-sm leading-snug">
                  <Icon size={18} weight="fill" className="mt-0.5 shrink-0 text-blue" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <ModelText line={notes[id]} runId={runId} gloss />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {sourceLine && <p className="mx-5 mt-2.5 text-xs text-muted">{sourceLine}</p>}
        {sources.length > 0 && (
          <ul className="mx-5 mt-1 flex flex-col">
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-xs font-semibold text-blue underline">
                  {source.title}
                  {source.date ? ` · ${formatDay(source.date.slice(0, 10), lang)}` : ""}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-5 pb-5 pt-3">
        <Button full onClick={() => router.push(withTripSearch("/trip/check"))}>
          <JuryLabel k="ready.continue" />
        </Button>
      </div>
    </div>
  );
}

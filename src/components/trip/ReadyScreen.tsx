"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  Clock,
  CloudSun,
  CurrencyCircleDollar,
  IdentificationCard,
  Info,
  Plug,
  ShieldCheck,
  SuitcaseRolling,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { ModelText } from "@/components/bs/ModelText";
import { useAgentRun } from "@/lib/agent-client/context";
import { withTripSearch } from "@/lib/agent-client/store";
import { placeName } from "@/lib/airports";
import { addDays, dateRangeParts, formatDay, formatLongDate } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import type { Lang, TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { ensurePoster } from "@/lib/poster/client";
import { useProfile } from "@/lib/profile/useProfile";
import { buildChecklist, todoCount, type ChecklistTile } from "@/lib/trip/checklist";
import { goodToKnowInput, loadGoodToKnow, peekGoodToKnow, type GoodToKnowNotes } from "@/lib/trip/good-to-know-client";
import { asFlight, asHotel, pickOption } from "@/lib/trip/selection";
import { cn } from "@/lib/utils";
import { JuryLabel, JuryLine } from "./JuryLine";
import { Eyebrow, Pill, SectionTitle } from "./TripBits";

const TOPICS: { id: keyof GoodToKnowNotes; icon: Icon; key: TranslationKey }[] = [
  { id: "timezone", icon: Clock, key: "ready.topic.timezone" },
  { id: "plugs", icon: Plug, key: "ready.topic.plugs" },
  { id: "currency", icon: CurrencyCircleDollar, key: "ready.topic.currency" },
  { id: "weather", icon: CloudSun, key: "ready.topic.weather" },
];

const ROW_ICON: Record<ChecklistTile["id"], Icon> = {
  visa: IdentificationCard,
  passport: CalendarBlank,
  baggage: SuitcaseRolling,
  money: Wallet,
};

const VISA_KEY: Record<string, TranslationKey> = {
  none: "visaKind.none",
  schengen: "visaKind.schengen",
  evisa: "visaKind.evisa",
  on_arrival: "visaKind.on_arrival",
  consular: "visaKind.consular",
  unknown: "visaKind.unknown",
};

/** Screen 08, "08 Prêt à partir v2" of postfetch-compte-v2.html. The poster starts here. */
export function ReadyScreen({ dotationMad }: { dotationMad: number }) {
  const run = useAgentRun();
  const { t, lang } = useLanguage();
  const { profile } = useProfile();
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  const result = run.result;
  const option = pickOption(result, run.selectedId);
  const flight = option ? asFlight(run.offers[option.flight_id]) : null;
  const hotel = option ? asHotel(run.offers[option.hotel_id]) : null;
  const runId = run.run?.run_id ?? null;
  const city = result?.destination.city ?? "";
  const depart = hotel?.attrs.arrival ?? flight?.attrs.outbound.departure.slice(0, 10) ?? "";
  const ret = hotel?.attrs.departure ?? flight?.attrs.inbound?.departure.slice(0, 10) ?? "";
  // Fetched in the background since screen 06: usually already here.
  const notes = peekGoodToKnow(run, lang);
  const notesState: "loading" | "ready" | "error" = notes ? "ready" : failed ? "error" : "loading";
  const input = goodToKnowInput(run, profile, lang);
  const inputKey = input
    ? `${input.runId}|${input.originIata}|${input.destinationIata}|${input.departDate}|${input.script}|${input.lang}`
    : "";

  useEffect(() => {
    if (!runId || !result) return;
    const istanbul = city.toLowerCase().includes("istanbul") || run.scenario === "istanbul";
    ensurePoster({
      runId,
      city,
      country: result.destination.country,
      istanbul,
    });
  }, [runId, city, result, run.scenario]);

  useEffect(() => {
    if (!input) return;
    let alive = true;
    void loadGoodToKnow(input).then((value) => {
      if (alive && !value) setFailed(true);
    });
    return () => {
      alive = false;
    };
    // The key holds every field of the input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputKey]);

  useEffect(() => {
    if (!runId) return;
    const timer = setTimeout(() => haptic("success"), 600);
    return () => clearTimeout(timer);
  }, [runId]);

  if (!result || !option) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
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
  const done = tiles.length - todo;
  const range = depart && ret ? dateRangeParts(depart, ret, lang) : null;
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
  const lead = todo === 0 ? t("ready.leftNone") : todo === 1 ? t("ready.leftOne") : t("ready.leftMany", { count: todo });
  const arrival = flight?.attrs.outbound.arrival.slice(0, 10) ?? depart;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto scroll-quiet bg-[linear-gradient(180deg,var(--color-sky)_0,var(--color-blue-soft)_220px,var(--color-bg)_380px)] pb-28">
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label={t("common.back")}
              onClick={() => router.push(withTripSearch("/trip/package"))}
              className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-card shadow-soft"
            >
              <ArrowLeft size={20} weight="light" className="rtl:-scale-x-100" aria-hidden />
            </button>
            <Eyebrow className="truncate">
              {placeName(result.destination.iata, lang, city)}
              {range ? (
                <>
                  {" · "}
                  <bdi>
                    {range.from} → {range.to}
                  </bdi>
                </>
              ) : null}
            </Eyebrow>
            <span className="size-11 shrink-0" />
          </div>

          <div className="mt-5 flex items-center gap-4">
            <ProgressRing done={done} total={tiles.length} />
            <div className="min-w-0">
              <h1 className="text-[27px] font-extrabold leading-[1.05] tracking-[-0.03em] rtl:leading-tight rtl:tracking-normal">
                {todo === 0 ? t("ready.done") : t("ready.almost")}
              </h1>
              <JuryLine k={todo === 0 ? "ready.done" : "ready.almost"} />
              <p className="mt-1.5 text-sm text-muted">{lead}</p>
            </div>
          </div>

          <ul className="mt-[22px] rounded-card bg-card px-4 py-0.5 shadow-soft">
            {tiles.map((tile, index) => (
              <CheckRow key={tile.id} tile={tile} first={index === 0} entry={result.entry} arrival={arrival} />
            ))}
          </ul>

          <SectionTitle className="mt-7">{t("ready.knowTitle")}</SectionTitle>
          {notesState === "error" ? (
            <p className="mt-3 text-sm text-muted">{t("ready.knowError")}</p>
          ) : (
            <ul className="mt-3 grid grid-cols-2 gap-2.5" aria-busy={notesState === "loading"}>
              {TOPICS.map(({ id, icon: TopicIcon, key }) => (
                <li key={id} className="rounded-card bg-card p-3.5 shadow-soft">
                  <TopicIcon size={24} weight="light" className="text-ink" aria-hidden />
                  <p className="mt-2.5 text-[15px] font-bold">{t(key)}</p>
                  {notes ? (
                    <div className="mt-0.5 text-[12.5px] leading-snug text-muted">
                      <ModelText line={notes[id]} runId={runId} gloss />
                    </div>
                  ) : (
                    <span aria-hidden className="mt-1.5 block space-y-1.5">
                      <span className="bs-pulse block h-2.5 w-full rounded-pill bg-fill" />
                      <span className="bs-pulse block h-2.5 w-2/3 rounded-pill bg-fill" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {notesState === "loading" && <p className="mt-2 text-xs text-muted">{t("ready.knowLoading")}</p>}

          {sourceLine && (
            <p className="mt-4 flex items-center gap-2 text-[12.5px] text-muted">
              <ShieldCheck size={16} weight="light" className="shrink-0" aria-hidden />
              {sourceLine}
            </p>
          )}
          {sources.length > 0 && (
            <ul className="mt-0.5 flex flex-col">
              {sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-9 items-center text-xs font-semibold text-blue underline underline-offset-2"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 border-t border-line bg-card px-5 pb-[22px] pt-3.5">
        <Button full onClick={() => router.push(withTripSearch("/trip/check"))}>
          <JuryLabel k="ready.continue" />
        </Button>
      </div>
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 33;
  const length = 2 * Math.PI * r;
  const share = total > 0 ? done / total : 0;
  return (
    <div className="relative size-[78px] shrink-0">
      <svg width={78} height={78} viewBox="0 0 78 78" aria-hidden>
        <circle cx={39} cy={39} r={r} className="fill-none stroke-card" strokeWidth={8} />
        <circle
          cx={39}
          cy={39}
          r={r}
          className="fill-none stroke-green"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={length.toFixed(1)}
          strokeDashoffset={(length * (1 - share)).toFixed(1)}
          transform="rotate(-90 39 39)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[19px] font-extrabold tabular-nums" dir="ltr">
        {done}/{total}
      </span>
    </div>
  );
}

function CheckRow({
  tile,
  first,
  entry,
  arrival,
}: {
  tile: ChecklistTile;
  first: boolean;
  entry: { visa_needed: boolean; visa_kind: string; max_stay_days: number | null; passport_validity_days: number | null } | null;
  arrival: string;
}) {
  const { t, lang } = useLanguage();
  const [how, setHow] = useState(false);
  const attention = tile.warn || !tile.ok;
  const RowIcon = ROW_ICON[tile.id];
  const line = rowText(tile, entry, arrival, lang, t);

  return (
    <li className={cn("flex items-start gap-3.5 py-[15px]", !first && "border-t border-line")}>
      <span
        aria-hidden
        className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", attention ? "bg-orange-soft" : "bg-green-soft")}
      >
        <RowIcon size={22} weight="light" className={attention ? "text-orange" : "text-green"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-bold">{t(tile.labelKey)}</p>
          {attention ? (
            <Pill tone="todo" className="h-6 px-[9px] text-[11.5px]" icon={<Info size={13} weight="light" aria-hidden />}>
              {t("ready.todo")}
            </Pill>
          ) : (
            <Pill tone="good" className="h-6 px-[9px] text-[11.5px]" icon={<Check size={13} weight="light" aria-hidden />}>
              {t("ready.ok")}
            </Pill>
          )}
        </div>
        <p className="mt-[3px] text-[13.5px] leading-[1.45] text-body">{line}</p>
        {tile.id === "baggage" && tile.warn && (
          <>
            <button type="button" aria-expanded={how} onClick={() => setHow((open) => !open)} className="mt-1 min-h-9 text-[13px] font-semibold text-blue">
              {t("ready.bagHow")}
            </button>
            {how && <p className="text-[13px] leading-[1.45] text-muted">{t("ready.bagHowText")}</p>}
          </>
        )}
        {tile.source && (
          <a href={tile.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-9 items-center text-xs font-semibold text-blue underline">
            {tile.source.title}
          </a>
        )}
      </div>
    </li>
  );
}

function rowText(
  tile: ChecklistTile,
  entry: { visa_needed: boolean; visa_kind: string; max_stay_days: number | null; passport_validity_days: number | null } | null,
  arrival: string,
  lang: Lang,
  t: ReturnType<typeof useLanguage>["t"],
): string {
  switch (tile.id) {
    case "visa":
      if (!entry) return t("ready.visaUnknownLine");
      if (entry.visa_needed) return t("ready.visaNeededLine", { kind: t(VISA_KEY[entry.visa_kind] ?? "visaKind.unknown") });
      return entry.max_stay_days ? t("ready.visaOkLine", { days: entry.max_stay_days }) : t("ready.visaOkNoDays");
    case "passport": {
      const days = entry?.passport_validity_days ?? null;
      if (days == null || !arrival) return t("ready.passportCheckLine");
      return t("ready.passportLine", { date: formatLongDate(addDays(arrival, days), lang), days });
    }
    case "baggage":
      return tile.ok ? t("ready.bagOkLine") : t("ready.bagLine");
    case "money":
      return t("ready.moneyLine", { percent: tile.statusValues?.percent ?? 0 });
  }
}

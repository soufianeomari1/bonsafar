"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { SplitFlap } from "@/components/bs/SplitFlap";
import { useAgentRun } from "@/lib/agent-client/context";
import type { RunEvent } from "@/lib/ai/events";
import { formatUsd } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { useTrip } from "@/lib/trip/useTrip";
import { setShowGloss } from "@/lib/agent-client/store";
import { cn } from "@/lib/utils";

const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) =>
  translate("en", key, values);

type Family = "transcribe" | "spark" | "wonder" | "tool" | "code";

function family(event: RunEvent): Family {
  const model = event.model.toLowerCase();
  const step = event.step.toLowerCase();
  if (step === "price_guardrail" || model === "code") return "code";
  if (model.includes("transcribe") || model.includes("voice") || step === "transcribe") return "transcribe";
  if (model.includes("wonder") || step.startsWith("agent")) return "wonder";
  if (model.includes("spark") || step === "intent" || step.startsWith("translate") || step.includes("entry")) {
    return "spark";
  }
  return "tool";
}

const COLOR: Record<Exclude<Family, "code">, string> = {
  transcribe: "bg-green-bright",
  spark: "bg-blue",
  wonder: "bg-violet",
  tool: "bg-yellow",
};

function stamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const clock = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    numberingSystem: "latn",
  }).format(date);
  return `${clock}.${Math.floor(date.getMilliseconds() / 100)}`;
}

function seconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)} s`;
}

/** J2 panel. English only. Every figure is a measured event. */
export function UnderTheHood() {
  const run = useAgentRun();
  const trip = useTrip();
  const running = run.status === "running";
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running || !run.run?.started_at) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running, run.run?.started_at]);

  const events = useMemo(() => {
    const merged = [...(trip?.events ?? []), ...run.events];
    const seen = new Set<string>();
    return merged
      .filter((event) => {
        const key = `${event.t}|${event.step}|${event.model}|${event.latency_ms}|${event.note ?? ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.t.localeCompare(b.t));
  }, [trip?.events, run.events]);

  const elapsedMs = run.end
    ? run.end.total_ms
    : run.run?.started_at
      ? Math.max(0, now - Date.parse(run.run.started_at))
      : 0;

  const buckets = { transcribe: 0, spark: 0, wonder: 0, tool: 0 };
  let calls = 0;
  let passed = 0;
  let blocked = 0;
  for (const event of events) {
    const kind = family(event);
    if (kind === "code") {
      if (event.step === "price_guardrail" && event.status === "passed") passed += 1;
      if (event.step === "price_guardrail" && event.status === "blocked") blocked += 1;
      continue;
    }
    buckets[kind] += event.cost_usd;
    if (kind !== "tool") calls += 1;
  }
  const cost = buckets.transcribe + buckets.spark + buckets.wonder + buckets.tool;
  const width = (value: number) => (cost > 0 ? `${(value / cost) * 100}%` : "0%");

  return (
    <div id="under-the-hood" className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-extrabold tracking-[-0.02em]">{t("hood.title")}</h2>
          <p className="text-[15px] text-muted">{t("hood.subtitle")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={run.showGloss}
          onClick={() => setShowGloss(!run.showGloss)}
          className="flex h-11 shrink-0 items-center gap-2 rounded-pill bg-fill px-3 text-[13px] font-semibold"
        >
          {t("hood.subtitles")}
          <span className={cn("relative h-5 w-[34px] rounded-pill", run.showGloss ? "bg-green-bright" : "bg-line")}>
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-pill bg-card",
                run.showGloss ? "end-0.5" : "start-0.5",
              )}
            />
          </span>
        </button>
      </div>

      {run.run?.replay && (
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-orange">
          {t("plan.replay")}
          {run.end?.recorded
            ? ` · ${t("hood.recorded", {
                time: seconds(run.end.recorded.total_ms),
                cost: formatUsd(run.end.recorded.cost_usd),
              })}`
            : ""}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Counter label={t("hood.elapsed")} value={seconds(elapsedMs)} />
        <Counter label={t("hood.cost")} value={formatUsd(cost)} />
        <Counter label={t("hood.calls")} value={String(calls)} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex h-3 overflow-hidden rounded-md bg-fill" aria-hidden>
          <span className="bg-green-bright" style={{ width: width(buckets.transcribe) }} />
          <span className="bg-blue" style={{ width: width(buckets.spark) }} />
          <span className="bg-violet" style={{ width: width(buckets.wonder) }} />
          <span className="bg-yellow" style={{ width: width(buckets.tool) }} />
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
          {(
            [
              ["transcribe", "hood.transcribe"],
              ["spark", "hood.spark"],
              ["wonder", "hood.wonder"],
              ["tool", "hood.tools"],
            ] as const
          ).map(([kind, key]) => (
            <li key={kind} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-[3px]", COLOR[kind])} />
              {t(key)}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" role="table" aria-label={t("hood.title")}>
        <div
          role="row"
          className="grid grid-cols-[88px_minmax(0,1.2fr)_minmax(0,1.3fr)_64px_72px] gap-2 border-b border-line px-2 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted"
        >
          <span role="columnheader">{t("hood.time")}</span>
          <span role="columnheader">{t("hood.step")}</span>
          <span role="columnheader">{t("hood.model")}</span>
          <span role="columnheader">{t("hood.latency")}</span>
          <span role="columnheader">{t("hood.costCol")}</span>
        </div>
        {events.length === 0 && <p className="px-2 py-4 text-sm text-muted">{t("hood.empty")}</p>}
        {events.map((event) => {
          const kind = family(event);
          return (
            <div
              role="row"
              key={`${event.t}-${event.step}-${event.model}-${event.note ?? ""}`}
              className="grid grid-cols-[88px_minmax(0,1.2fr)_minmax(0,1.3fr)_64px_72px] items-start gap-2 rounded-[10px] px-2 py-2 text-[13px]"
            >
              <span role="cell" className="font-mono text-muted">
                <bdi>{stamp(event.t)}</bdi>
              </span>
              <span role="cell" className="font-semibold">
                {event.step}
                {event.note && <span className="mt-0.5 block text-xs font-normal text-muted">{event.note}</span>}
              </span>
              <span role="cell" className="flex items-center gap-1.5">
                {kind !== "code" && <span className={cn("size-2 shrink-0 rounded-[2px]", COLOR[kind])} />}
                <span className="truncate">{event.model}</span>
              </span>
              <span role="cell" className="font-mono">
                <bdi>{event.latency_ms >= 100 ? `${(event.latency_ms / 1000).toFixed(1)} s` : `${event.latency_ms} ms`}</bdi>
              </span>
              <span role="cell" className="font-mono">
                <bdi>{formatUsd(event.cost_usd)}</bdi>
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-[14px] bg-green-soft px-3.5 py-3 text-sm leading-snug">
        <CheckCircle size={20} weight="light" className="mt-0.5 shrink-0 text-green" aria-hidden />
        <p>
          <strong>{t("hood.guardrail")}</strong> {t("hood.guardrailBody", { passed, blocked })}
        </p>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[18px] bg-fill px-4 py-3.5">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <SplitFlap value={value} haptic={false} className="text-[22px] font-extrabold" />
    </div>
  );
}

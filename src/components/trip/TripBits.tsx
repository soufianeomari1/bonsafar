"use client";

import { useState, type ReactNode } from "react";
import { Bed } from "@phosphor-icons/react";
import { formatDuration, formatTime, formatTripDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { KiwiLeg } from "@/lib/mcp/kiwi";
import { legSentence, legStops } from "@/lib/trip/describe";
import { hotelPhoto } from "@/lib/trip/describe";
import { placeName } from "@/lib/airports";
import { cn } from "@/lib/utils";

/** Small caps label. Latin scripts get Geist Mono; Arabic script stays in its own font. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  const { rtl } = useLanguage();
  return (
    <p
      className={cn(
        rtl
          ? "font-arabic text-[12.5px] font-semibold text-muted"
          : "font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-[19px] font-bold tracking-[-0.015em]", className)}>{children}</h2>;
}

export function Pill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: "neutral" | "good" | "todo";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-pill px-[11px] text-[12.5px] font-semibold",
        tone === "good" && "bg-green-soft text-green",
        tone === "todo" && "bg-orange-soft text-orange",
        tone === "neutral" && "bg-card text-ink",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** trivago's photo, or a sky gradient with a bed when there is none or it fails. */
export function HotelPhoto({
  src,
  alt,
  className,
  onShown,
  children,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  onShown?: (shown: boolean) => void;
  children?: (shown: boolean) => ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = hotelPhoto(src);
  const shown = !!url && !failed;
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-b from-sky via-blue-soft to-bg", className)}>
      {!shown || !loaded ? (
        <span aria-hidden className="absolute inset-0 flex items-center justify-center text-blue/50">
          <Bed size={36} weight="light" />
        </span>
      ) : null}
      {shown && (
        // A partner photo, shown as trivago sent it (credited on the image).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          onLoad={() => {
            setLoaded(true);
            onShown?.(true);
          }}
          onError={() => {
            setFailed(true);
            onShown?.(false);
          }}
        />
      )}
      {children?.(shown && loaded)}
    </div>
  );
}

/** One flight leg in plain words: times, cities, a dot per stop, then "Pegasus · direct flight". Tap for flight numbers. */
export function LegBlock({ leg, label }: { leg: KiwiLeg; label: string }) {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const stops = legStops(leg, lang);
  const sentence = legSentence(leg, lang, t);
  const fromCity = placeName(leg.from, lang, leg.segments?.[0]?.from_city);
  const toCity = placeName(leg.to, lang, leg.segments?.at(-1)?.to_city);
  const segments = leg.segments ?? [];

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className="block w-full py-3 text-start"
    >
      <span className="flex items-center justify-between gap-2">
        <Eyebrow>
          {label} · <bdi>{formatTripDate(leg.departure.slice(0, 10), lang)}</bdi>
        </Eyebrow>
        <span className="text-xs text-muted">
          <bdi>{formatDuration(leg.duration_min, lang)}</bdi>
        </span>
      </span>
      <span className="mt-2 flex items-center gap-2.5">
        <span className="flex flex-col">
          <span className="text-2xl font-bold tabular-nums tracking-[-0.02em]">
            <bdi>{formatTime(leg.departure)}</bdi>
          </span>
          <span className="text-xs text-muted">{fromCity}</span>
        </span>
        <span aria-hidden className="relative h-5 flex-1">
          <span
            className={cn(
              "absolute inset-x-0 top-[9px] border-t-[1.5px] border-line-strong",
              stops.length > 0 ? "border-dashed" : "border-solid",
            )}
          />
          {stops.map((stop, index) => (
            <span
              key={`${stop.iata}-${index}`}
              className="absolute top-[5px] size-[9px] -translate-x-1/2 rounded-pill border-2 border-ink bg-card rtl:translate-x-1/2"
              style={{ insetInlineStart: `${((index + 1) / (stops.length + 1)) * 100}%` }}
            />
          ))}
        </span>
        <span className="flex flex-col items-end">
          <span className="text-2xl font-bold tabular-nums tracking-[-0.02em]">
            <bdi>{formatTime(leg.arrival)}</bdi>
          </span>
          <span className="text-xs text-muted">{toCity}</span>
        </span>
      </span>
      <span className="mt-2 block text-[13px]">
        {sentence.carriers}
        <span className="text-muted">
          {sentence.carriers ? " · " : ""}
          {sentence.detail}
        </span>
      </span>
      {open && (
        <span className="mt-2 block rounded-xl bg-bg px-3 py-2 font-mono text-[11px] leading-relaxed text-muted" dir="ltr">
          {segments.length
            ? segments.map((segment, index) => (
                <span key={index} className="block">
                  {[segment.flight, `${segment.from} → ${segment.to}`, `${formatTime(segment.departure)}–${formatTime(segment.arrival)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              ))
            : [leg.flights.join(" + "), leg.route.join(" → ")].filter(Boolean).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
        </span>
      )}
    </button>
  );
}

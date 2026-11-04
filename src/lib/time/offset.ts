import { airport, airportTimeZone } from "@/lib/airports";

/**
 * Morocco returned to GMT (UTC+0) for good on 20 September 2026
 * (Hespress, Médias24, FNH). ICU 78 on this machine already reports
 * Africa/Casablanca as UTC+0 in November 2026. Older zone data still
 * applies the previous UTC+1 rule, so any date on or after the change
 * is forced to UTC+0.
 */
export const MOROCCO_UTC0_FROM = "2026-09-20";

export type TimeDifference = {
  /** Absolute gap, whole hours, then leftover minutes. */
  hours: number;
  minutes: number;
  /** Destination offset minus origin offset. Positive when the destination is ahead. */
  aheadMinutes: number;
  originZone: string;
  destinationZone: string;
  originCity: string;
  destinationCity: string;
};

/** UTC offset of an IANA zone at noon UTC on an ISO date, in minutes. */
export function intlOffsetMinutes(timeZone: string, isoDate: string): number {
  const instant = new Date(`${isoDate}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(pick("year"), pick("month") - 1, pick("day"), pick("hour"), pick("minute"), pick("second"));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/** Offset used for a trip date. Morocco is UTC+0 from 2026-09-20 even if the zone data is old. */
export function zoneOffsetMinutes(timeZone: string, isoDate: string): number {
  if (timeZone === "Africa/Casablanca" && isoDate >= MOROCCO_UTC0_FROM) return 0;
  return intlOffsetMinutes(timeZone, isoDate);
}

/** Clock difference between two airports on the departure date. Null when a zone is unknown. */
export function timeDifference(originIata: string, destinationIata: string, isoDate: string): TimeDifference | null {
  const originZone = airportTimeZone(originIata);
  const destinationZone = airportTimeZone(destinationIata);
  if (!originZone || !destinationZone || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const aheadMinutes = zoneOffsetMinutes(destinationZone, isoDate) - zoneOffsetMinutes(originZone, isoDate);
  const abs = Math.abs(aheadMinutes);
  return {
    hours: Math.floor(abs / 60),
    minutes: abs % 60,
    aheadMinutes,
    originZone,
    destinationZone,
    originCity: airport(originIata)?.city || originIata,
    destinationCity: airport(destinationIata)?.city || destinationIata,
  };
}

/** English fact for the model. It rewrites this; it does not work the offset out. */
export function imposedTimeFact(diff: TimeDifference): string {
  const { hours, minutes, aheadMinutes, originCity, destinationCity } = diff;
  if (aheadMinutes === 0) {
    return `Imposed fact: on the departure date, ${originCity} and ${destinationCity} share the same clock. The time difference is 0 hours. Rewrite this fact. Do not invent another offset.`;
  }
  const hourWord = hours === 1 ? "hour" : "hours";
  const amount = minutes === 0 ? `${hours} ${hourWord}` : `${hours} ${hourWord} and ${minutes} minutes`;
  const ahead = aheadMinutes > 0 ? destinationCity : originCity;
  const behind = aheadMinutes > 0 ? originCity : destinationCity;
  return `Imposed fact: the time difference is exactly ${amount}. ${ahead} is ahead of ${behind}. Write this number with Latin digits in every language. Do not recalculate it.`;
}

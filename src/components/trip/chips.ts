import {
  AirplaneTakeoff,
  AirplaneTilt,
  Baby,
  Bank,
  Buildings,
  CalendarBlank,
  Coffee,
  ForkKnife,
  MapPin,
  Sparkle,
  SwimmingPool,
  Users,
  Wallet,
  Waves,
  Wheelchair,
  type Icon,
} from "@phosphor-icons/react";
import { dateRangeParts, formatDay, formatMadNumber } from "@/lib/format";
import { placeName } from "@/lib/airports";
import type { Lang, TranslateValues, TranslationKey } from "@/lib/i18n";
import type { Intent, KeywordSlot, WishKind } from "@/lib/intent/schema";

type Translate = (key: TranslationKey, values?: TranslateValues) => string;

export type ChipKind = "origin" | "destination" | "dates" | "travellers" | "budget" | "budgetNight" | "wish";

export type IntentChipModel = {
  id: string;
  kind: ChipKind;
  slot: KeywordSlot;
  label: string;
  icon: Icon;
  /** Tailwind classes of the round icon, mockup 04-Compris. */
  tone: string;
  wishIndex?: number;
  /** Shown under the label when the departure airport comes from the profile. */
  note?: string;
};

const WISH_ICONS: Record<WishKind, Icon> = {
  breakfast: Coffee,
  direct_flight: AirplaneTilt,
  halal: ForkKnife,
  sea: Waves,
  pool: SwimmingPool,
  city_center: Buildings,
  near_landmark: Bank,
  accessibility: Wheelchair,
  family: Baby,
  other: Sparkle,
};

export function chipsFor(
  intent: Intent,
  lang: Lang,
  t: Translate,
  options?: { originFromProfile?: boolean },
): IntentChipModel[] {
  const chips: IntentChipModel[] = [];
  const origin = intent.origin_iata;

  chips.push({
    id: "origin",
    kind: "origin",
    slot: "origin",
    label: origin
      ? t("chip.origin", { city: placeName(origin, lang), code: origin })
      : t("chip.noOrigin"),
    icon: AirplaneTakeoff,
    tone: "bg-green-soft text-green",
    note: options?.originFromProfile ? t("chip.originProfile") : undefined,
  });

  chips.push({
    id: "destination",
    kind: "destination",
    slot: "destination",
    label: intent.destination?.city ?? t("chip.noDestination"),
    icon: MapPin,
    tone: "bg-blue-soft text-blue",
  });

  let dates = t("chip.noDates");
  if (intent.depart_date && intent.return_date) {
    dates = t("chip.dateRange", dateRangeParts(intent.depart_date, intent.return_date, lang));
  } else if (intent.depart_date) {
    dates = t("chip.dateFrom", { date: formatDay(intent.depart_date, lang) });
  }
  chips.push({
    id: "dates",
    kind: "dates",
    slot: "dates",
    label: dates,
    icon: CalendarBlank,
    tone: "bg-green-soft text-green",
  });

  const adults = t(intent.adults === 1 ? "chip.adults.one" : "chip.adults.other", {
    count: intent.adults,
  });
  const children = intent.children
    ? t(intent.children === 1 ? "chip.children.one" : "chip.children.other", {
        count: intent.children,
      })
    : null;
  chips.push({
    id: "travellers",
    kind: "travellers",
    slot: "travelers",
    label: children ? `${adults}, ${children}` : adults,
    icon: Users,
    tone: "bg-blue-soft text-blue",
  });

  if (intent.budget_per_night_mad) {
    chips.push({
      id: "budget-night",
      kind: "budgetNight",
      slot: "budget",
      label: t("chip.budgetNight", { amount: formatMadNumber(intent.budget_per_night_mad) }),
      icon: Wallet,
      tone: "bg-orange-soft text-orange",
    });
  }

  if (intent.budget_mad) {
    chips.push({
      id: "budget",
      kind: "budget",
      slot: "budget",
      label: t("chip.budget", { amount: formatMadNumber(intent.budget_mad) }),
      icon: Wallet,
      tone: "bg-orange-soft text-orange",
    });
  }

  intent.wishes.forEach((wish, index) => {
    chips.push({
      id: `wish-${index}`,
      kind: "wish",
      slot: "wish",
      label: wish.label.charAt(0).toLocaleUpperCase(lang === "en" ? "en" : "fr") + wish.label.slice(1),
      icon: WISH_ICONS[wish.kind],
      tone: "bg-orange-soft text-orange",
      wishIndex: index,
    });
  });

  return chips;
}

export type TranscriptPart = { text: string; keyword: number | null };

/** Splits the transcript around the keywords (exact substrings, in order). */
export function splitTranscript(transcript: string, keywords: Intent["keywords"]): TranscriptPart[] {
  const found: { start: number; end: number; index: number }[] = [];
  keywords.forEach((keyword, index) => {
    let from = 0;
    while (from <= transcript.length) {
      const start = transcript.indexOf(keyword.text, from);
      if (start === -1) return;
      const end = start + keyword.text.length;
      if (!found.some((f) => start < f.end && end > f.start)) {
        found.push({ start, end, index });
        return;
      }
      from = start + 1;
    }
  });
  found.sort((a, b) => a.start - b.start);

  const parts: TranscriptPart[] = [];
  let cursor = 0;
  for (const f of found) {
    if (f.start > cursor) parts.push({ text: transcript.slice(cursor, f.start), keyword: null });
    parts.push({ text: transcript.slice(f.start, f.end), keyword: f.index });
    cursor = f.end;
  }
  if (cursor < transcript.length) parts.push({ text: transcript.slice(cursor), keyword: null });
  return parts;
}

/**
 * Which keyword flies into which chip (A2): the first keyword of each slot,
 * and wish keywords to wish chips in order.
 */
export function flightPairs(intent: Intent, chips: IntentChipModel[]): Map<number, string> {
  const pairs = new Map<number, string>();
  const used = new Set<string>();
  let wish = 0;
  intent.keywords.forEach((keyword, index) => {
    const chip =
      keyword.slot === "wish"
        ? chips.find((c) => c.kind === "wish" && c.wishIndex === wish++)
        : chips.find((c) => c.slot === keyword.slot && !used.has(c.id));
    if (chip && !used.has(chip.id)) {
      used.add(chip.id);
      pairs.set(index, chip.id);
    }
  });
  return pairs;
}

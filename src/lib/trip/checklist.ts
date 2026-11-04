import type { TranslationKey } from "@/lib/i18n";

/**
 * The four "before you go" tiles. Same rules on the package (screen 07) and
 * on ready to go (screen 08). Status words are translation keys: the model
 * never writes them, and the money share is a percentage computed here.
 */

export type ChecklistTile = {
  id: "visa" | "passport" | "baggage" | "money";
  ok: boolean;
  /** Cabin bag only: orange, same as screen 07. */
  warn: boolean;
  labelKey: TranslationKey;
  statusKey: TranslationKey;
  statusValues?: Record<string, string | number>;
  /** Shown under the status on both screens (visa kind, passport source). */
  hintKey?: TranslationKey;
  /** Ready screen only: the extra line under a landed status. */
  detailKey?: TranslationKey;
  detailValues?: Record<string, string | number>;
  source?: { url: string; title: string };
  /** Passport "check" on screen 07 is plain text, not a split-flap. */
  plain: boolean;
};

const VISA_KEY: Record<string, TranslationKey> = {
  none: "visaKind.none",
  schengen: "visaKind.schengen",
  evisa: "visaKind.evisa",
  on_arrival: "visaKind.on_arrival",
  consular: "visaKind.consular",
  unknown: "visaKind.unknown",
};

export type ChecklistInput = {
  entry: {
    visa_needed: boolean;
    visa_kind: string;
    max_stay_days: number | null;
    passport_validity_days: number | null;
    sources: { url: string; title: string; date?: string }[];
    homecoming?: boolean;
  } | null;
  baggage: { personal_item: number; cabin_bag: number; checked_bag: number } | null;
  perPersonDisplayMad: number;
  dotationMad: number;
};

export function buildChecklist(input: ChecklistInput): ChecklistTile[] {
  const { entry, baggage } = input;
  const visaNeeded = !!entry?.visa_needed;
  const homecoming = !!entry?.homecoming;
  const days = entry?.passport_validity_days ?? null;
  const checked = baggage?.checked_bag ?? 0;
  const hasFlight = baggage != null;
  const source = entry?.sources.find((item) => item.url);
  const percent =
    input.dotationMad > 0 ? Math.round((input.perPersonDisplayMad / input.dotationMad) * 100) : 0;
  const stay = entry?.max_stay_days;

  return [
    {
      id: "visa",
      ok: !!entry && !visaNeeded,
      warn: false,
      labelKey: "package.visa",
      statusKey: homecoming ? "ready.visaHome" : visaNeeded ? "package.visaNeeded" : "package.visaFree",
      hintKey: visaNeeded ? (VISA_KEY[entry?.visa_kind ?? "unknown"] ?? "visaKind.unknown") : undefined,
      detailKey: !homecoming && !visaNeeded && stay ? "ready.visaStay" : undefined,
      detailValues: stay ? { days: stay } : undefined,
      plain: false,
    },
    {
      id: "passport",
      ok: days != null,
      warn: false,
      labelKey: "package.passport",
      statusKey: days == null ? "package.passportCheck" : "package.passportDays",
      statusValues: days == null ? undefined : { days },
      detailKey: days == null ? undefined : "ready.passportAfter",
      source: days == null && source ? { url: source.url, title: source.title } : undefined,
      plain: days == null,
    },
    {
      id: "baggage",
      ok: hasFlight && checked > 0,
      warn: hasFlight && checked === 0,
      labelKey: "package.baggage",
      statusKey: checked > 0 ? "package.bagChecked" : "package.bagCabin",
      detailKey: checked > 0 ? "ready.bagIn" : "ready.bagAdd",
      plain: false,
    },
    {
      id: "money",
      ok: true,
      warn: false,
      labelKey: "package.money",
      statusKey: "package.moneyShare",
      statusValues: { percent },
      detailKey: "ready.moneyOf",
      plain: false,
    },
  ];
}

/** Orange tiles: the "N things to do" count. */
export function todoCount(tiles: ChecklistTile[]): number {
  return tiles.filter((tile) => tile.warn || !tile.ok).length;
}

export function okCount(tiles: ChecklistTile[]): number {
  return tiles.filter((tile) => tile.ok && !tile.warn).length;
}

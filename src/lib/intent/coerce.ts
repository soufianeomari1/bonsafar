import { KEYWORD_SLOTS, WISH_KINDS, type WishKind } from "./schema";

const WISH_LABEL_MAX = 80;
const KEYWORD_MAX = 60;
const KINDS = new Set<string>(WISH_KINDS);
const SLOTS = new Set<string>(KEYWORD_SLOTS);

/** A monument, square or neighbourhood, not a hotel-star count. */
const PLACE =
  /horloge|landmark|monument|quartier|neighbou?rhood|près|pres|proche|côté|cote|clock|tower|pont|bridge|place\b|square|old town|vieille|vieux/i;

function usableQuestion(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  const question = value as Record<string, unknown>;
  return (
    typeof question.darija === "string" &&
    question.darija.trim().length > 0 &&
    typeof question.fr === "string" &&
    question.fr.trim().length > 0 &&
    typeof question.en === "string" &&
    question.en.trim().length > 0
  );
}

function iata(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : value;
}

function wishKind(kind: string, label: string): WishKind {
  if (KINDS.has(kind)) return kind as WishKind;
  return PLACE.test(`${kind} ${label}`) ? "near_landmark" : "other";
}

/**
 * Makes a Muse Spark intent parseable. An unknown wish kind for a place
 * becomes near_landmark, and a long label or keyword is shortened instead
 * of failing the whole request. Star ratings stay ordinary wishes.
 */
export function coerceModelIntent(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const obj: Record<string, unknown> = { ...(raw as Record<string, unknown>) };

  obj.origin_iata = obj.origin_iata == null ? null : iata(obj.origin_iata);
  if (obj.destination && typeof obj.destination === "object" && !Array.isArray(obj.destination)) {
    const dest = { ...(obj.destination as Record<string, unknown>) };
    if ("iata" in dest) dest.iata = iata(dest.iata);
    obj.destination = dest;
  }

  const wishes = Array.isArray(obj.wishes) ? obj.wishes : [];
  obj.wishes = wishes
    .flatMap((wish) => {
      if (!wish || typeof wish !== "object") return [];
      const item = wish as Record<string, unknown>;
      let label = typeof item.label === "string" ? item.label.trim() : "";
      if (!label) return [];
      if (label.length > WISH_LABEL_MAX) label = label.slice(0, WISH_LABEL_MAX).trim();
      const kind = wishKind(typeof item.kind === "string" ? item.kind : "other", label);
      return [{ kind, label }];
    })
    .slice(0, 6);

  if (!usableQuestion(obj.question)) obj.question = null;

  const keywords = Array.isArray(obj.keywords) ? obj.keywords : [];
  obj.keywords = keywords
    .flatMap((keyword) => {
      if (!keyword || typeof keyword !== "object") return [];
      const item = keyword as Record<string, unknown>;
      let text = typeof item.text === "string" ? item.text.trim() : "";
      if (!text || typeof item.slot !== "string" || !SLOTS.has(item.slot)) return [];
      if (text.length > KEYWORD_MAX) text = text.slice(0, KEYWORD_MAX).trim();
      return [{ text, slot: item.slot }];
    })
    .slice(0, 10);

  return obj;
}

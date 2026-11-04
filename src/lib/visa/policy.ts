import { knownIdeaVisaFree, schengenFree, visaFreeHomeIds, type Idea } from "../ideas";
import type { Intent } from "../intent/schema";
import { findPlace } from "../mcp/places";
import type { Profile } from "../profile/schema";
import { countryCodeOf, foldPlace, isSchengenCode, type DestinationLike } from "./schengen";

/**
 * "No visa" is a request, not a fact. The Visa-free chip is shown only when
 * the current destination is verified for this profile: a home idea card that
 * is visa-free, or a Schengen country the profile can already enter.
 * A Schengen country without that access is a warning, in the same turn the
 * destination appears.
 */

const VISA_FREE_ASK = [
  /(?:^|[^a-z])(?:no|without|sans|bla|bola)(?:\s+an?)?\s*-?\s*visas?(?![a-z])/i,
  /visa[\s-]*free/i,
  /بدون\s*(?:تأشيرة|تاشيرة|فيزا|ڤيزا)/,
  /بلا\s*(?:فيزا|ڤيزا|تأشيرة|تاشيرة)/,
];

/** Cities and airports that are one of the catalog ideas. */
const IDEA_MATCH: { id: Idea["id"]; names: string[]; codes: string[] }[] = [
  { id: "istanbul", names: ["istanbul"], codes: ["IST", "SAW"] },
  { id: "paris", names: ["paris"], codes: ["PAR", "CDG", "ORY", "BVA"] },
  { id: "barcelona", names: ["barcelona", "barcelone"], codes: ["BCN"] },
  { id: "tunis", names: ["tunis", "tounes"], codes: ["TUN"] },
  { id: "omra", names: ["umrah", "omra", "omrah", "mecca", "makkah", "mecque", "jeddah", "jedda", "djeddah"], codes: ["JED"] },
];

export function askedVisaFree(corpus: string): boolean {
  return VISA_FREE_ASK.some((pattern) => pattern.test(corpus));
}

export function isVisaFreeClaim(label: string): boolean {
  return askedVisaFree(label);
}

function matchedIdea(destination: DestinationLike): Idea["id"] | null {
  const code = destination.iata?.toUpperCase() ?? "";
  const city = foldPlace(destination.city);
  for (const idea of IDEA_MATCH) {
    if (code && idea.codes.includes(code)) return idea.id;
    if (city && idea.names.some((name) => foldPlace(name) === city)) return idea.id;
  }
  return null;
}

function resolvedCountry(destination: DestinationLike): string | null {
  return (
    countryCodeOf(destination) ??
    findPlace({ iata: destination.iata, city: destination.city })?.country_code ??
    null
  );
}

/** True only when the same rule as the idea cards says this place is visa-free. */
export function destinationVerifiedVisaFree(destination: DestinationLike | null, profile: Profile): boolean {
  if (!destination) return false;
  const idea = matchedIdea(destination);
  if (idea) return knownIdeaVisaFree(idea, profile);
  const code = resolvedCountry(destination);
  // A Schengen country is visa-free only for the profiles whose Paris card says so.
  if (isSchengenCode(code)) return knownIdeaVisaFree("paris", profile);
  return false;
}

export function schengenBlocked(destination: DestinationLike | null, profile: Profile): boolean {
  if (!destination) return false;
  const code = resolvedCountry(destination);
  return isSchengenCode(code) && !knownIdeaVisaFree("paris", profile);
}

/**
 * Statuses checked for a Moroccan passport. They win over the model's
 * visa_needed / visa_kind. Spark still supplies passport validity, notes
 * and sources. Idea cards use the same Schengen rule (`schengenFree`).
 * `max_stay_days` is set only when the stay limit itself is verified.
 */
export type VerifiedVisaStatus = {
  visa_needed: boolean;
  visa_kind: "none" | "schengen";
  max_stay_days?: number;
};

const MOROCCAN_PASSPORT = new Set<Profile["passport_country"]>(["ma", "both"]);

export function verifiedMoroccanVisa(
  countryCode: string | null | undefined,
  profile: Profile,
): VerifiedVisaStatus | null {
  if (!profile.passport_country || !MOROCCAN_PASSPORT.has(profile.passport_country)) return null;
  const code = countryCode?.trim().toUpperCase() || null;
  if (!code) return null;
  if (code === "TR") return { visa_needed: false, visa_kind: "none", max_stay_days: 90 };
  if (isSchengenCode(code)) {
    const free = schengenFree(profile);
    return { visa_needed: !free, visa_kind: free ? "none" : "schengen" };
  }
  return null;
}

/** Locks a verified row onto a model entry. Other countries are returned as-is. */
export function applyVerifiedVisa<T extends { visa_needed: boolean; visa_kind: string; max_stay_days: number | null }>(
  entry: T,
  countryCode: string | null | undefined,
  profile: Profile,
): T {
  const verified = verifiedMoroccanVisa(countryCode, profile);
  if (!verified) return entry;
  return {
    ...entry,
    visa_needed: verified.visa_needed,
    visa_kind: verified.visa_kind,
    max_stay_days: verified.max_stay_days ?? entry.max_stay_days,
  };
}

export type VisaWarning = { city: string; countryCode: string };

export type VisaAssessment = {
  asked: boolean;
  /** Wishes safe to render. A visa-free claim is removed unless it is verified. */
  wishes: Intent["wishes"];
  showVisaFreeChip: boolean;
  warning: VisaWarning | null;
  /** Schengen conflict the traveller has not accepted yet. Search stays off. */
  conflictOpen: boolean;
  /** No city yet: the where-question may offer only these verified ideas. */
  ideaIds: Idea["id"][] | null;
};

function sameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return foldPlace(a) === foldPlace(b);
}

function overlapsPlace(city: string, word: string): boolean {
  if (!city || !word) return false;
  if (city === word) return true;
  const short = city.length <= word.length ? city : word;
  const long = city.length <= word.length ? word : city;
  return short.length >= 6 && long.startsWith(short);
}

/**
 * The traveller actually said this city. A model that invents Santorini for
 * "where can I go with no visa?" has not been given a destination.
 */
export function userNamedCity(city: string, corpus: string): boolean {
  const folded = foldPlace(city);
  if (folded.length < 3) return false;
  const words = corpus.split(/[^\p{L}\p{N}]+/u).map(foldPlace).filter((word) => word.length >= 3);
  return words.some((word) => overlapsPlace(folded, word));
}

/**
 * Synchronous. A new destination is checked in this call, not on a later turn.
 */
export function assessVisa({
  intent,
  profile,
  corpus,
  keptCity = null,
}: {
  intent: Intent;
  profile: Profile;
  corpus: string;
  keptCity?: string | null;
}): VisaAssessment {
  const asked = askedVisaFree(corpus);
  const named = !asked || !intent.destination || userNamedCity(intent.destination.city, corpus);
  const destination = named ? intent.destination : null;
  const verified = destinationVerifiedVisaFree(destination, profile);
  const blocked = asked && schengenBlocked(destination, profile);
  const wishes =
    asked && intent.wishes.some((wish) => isVisaFreeClaim(wish.label))
      ? intent.wishes.filter((wish) => !isVisaFreeClaim(wish.label))
      : intent.wishes;
  const code = destination ? resolvedCountry(destination) : null;
  return {
    asked,
    wishes,
    showVisaFreeChip: asked && verified && !blocked,
    warning: blocked && destination && code ? { city: destination.city, countryCode: code } : null,
    conflictOpen: blocked && !sameCity(keptCity, destination?.city),
    ideaIds: asked && !destination ? visaFreeHomeIds(profile) : null,
  };
}

/**
 * Drops an invented destination and an unverified "visa-free" wish before the
 * intent is shown or searched. Same inputs as assessVisa, so the check is the
 * response itself, not a later turn.
 */
export function applyVisaPolicy(intent: Intent, profile: Profile, corpus: string): Intent {
  const view = assessVisa({ intent, profile, corpus });
  const destination = view.ideaIds ? null : intent.destination;
  if (destination === intent.destination && view.wishes === intent.wishes) return intent;
  return { ...intent, destination, wishes: view.wishes };
}

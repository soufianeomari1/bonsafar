import { z } from "zod";
import { LANGUAGES, type Lang } from "@/lib/i18n";

/** Values allowed by the `profiles` table checks in supabase/schema.sql. */
/** The Moroccan airports offered first; any IATA code is accepted. */
export const AIRPORTS = ["CMN", "RAK", "RBA", "TNG", "FEZ", "AGA", "OUD"] as const;
export const COMPANIONS = ["solo", "duo", "family", "friends"] as const;
export const PASSPORTS = ["ma", "fr", "both", "other"] as const;
export const STYLES = ["budget", "comfort", "premium"] as const;
export const DARIJA_SCRIPTS = ["latn", "arab"] as const;
export const BUDGETS = ["lt5k", "5to10k", "10to15k", "15to25k", "gt25k"] as const;

export type Airport = string;
export type Budget = (typeof BUDGETS)[number];

const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export type Companions = (typeof COMPANIONS)[number];
export type Passport = (typeof PASSPORTS)[number];
export type TravelStyle = (typeof STYLES)[number];
export type DarijaScript = (typeof DARIJA_SCRIPTS)[number];

/** The `prefs` jsonb column. `onboarded` marks the 4 steps as done. */
export const PrefsSchema = z.object({
  direct_only: z.boolean().default(false),
  breakfast: z.boolean().default(false),
  halal: z.boolean().default(false),
  accessibility: z.boolean().default(false),
  onboarded: z.boolean().default(false),
});

export const ProfileSchema = z.object({
  first_name: z.string().trim().max(60).nullable().default(null),
  ui_lang: z.enum(LANGUAGES).default("fr"),
  darija_script: z.enum(DARIJA_SCRIPTS).default("latn"),
  home_airport: z.string().regex(/^[A-Z]{3}$/).nullable().default(null),
  companions: z.enum(COMPANIONS).nullable().default(null),
  children_count: z.number().int().min(0).max(9).default(0),
  children_ages: z.array(z.number().int().min(0).max(17)).max(9).default([]),
  passport_country: z.enum(PASSPORTS).nullable().default(null),
  /** Month and year only. Never a passport number. */
  passport_expiry: YearMonth.nullable().default(null),
  has_schengen: z.boolean().default(false),
  schengen_expiry: YearMonth.nullable().default(null),
  passport_6m: z.boolean().default(true),
  intl_card: z.boolean().default(true),
  travel_style: z.enum(STYLES).nullable().default(null),
  budget_band: z.enum(BUDGETS).nullable().default(null),
  fav_months: z.array(z.number().int().min(1).max(12)).max(12).default([]),
  whatsapp_number: z.string().regex(/^\+\d{8,15}$/).nullable().default(null),
  /** Set only when the separate consent box is ticked. */
  whatsapp_consent_at: z.string().nullable().default(null),
  prefs: PrefsSchema.default(PrefsSchema.parse({})),
  haptics: z.boolean().default(true),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type Prefs = z.infer<typeof PrefsSchema>;

export const DEFAULT_PROFILE: Profile = ProfileSchema.parse({});

/** Columns written to Supabase. `first_name` comes from Google, via the trigger. */
export const PROFILE_COLUMNS = [
  "ui_lang",
  "darija_script",
  "home_airport",
  "companions",
  "children_count",
  "children_ages",
  "passport_country",
  "passport_expiry",
  "has_schengen",
  "schengen_expiry",
  "passport_6m",
  "intl_card",
  "travel_style",
  "budget_band",
  "fav_months",
  "whatsapp_number",
  "whatsapp_consent_at",
  "prefs",
  "haptics",
] as const satisfies readonly (keyof Profile)[];

/** The four express questions (screen 01, account). */
export const QUESTIONS = ["airport", "who", "papers", "style"] as const;
export type Question = (typeof QUESTIONS)[number];

export function isAnswered(profile: Profile, question: Question): boolean {
  switch (question) {
    case "airport":
      return profile.home_airport != null;
    case "who":
      return profile.companions != null;
    case "papers":
      return profile.passport_country != null && profile.passport_expiry != null;
    case "style":
      return profile.budget_band != null && profile.travel_style != null && profile.fav_months.length > 0;
  }
}

/** Share of the profile filled, for the ring in "Mon espace". */
export function completion(profile: Profile): number {
  const facts = [
    profile.home_airport != null,
    profile.companions != null,
    profile.passport_country != null,
    profile.passport_expiry != null,
    profile.travel_style != null,
    profile.budget_band != null,
    profile.fav_months.length > 0,
    profile.first_name != null,
  ];
  return Math.round((facts.filter(Boolean).length / facts.length) * 100);
}

/** Lenient read: anything unknown or invalid falls back to the default. */
export function parseProfile(value: unknown): Profile {
  const parsed = ProfileSchema.safeParse(value ?? {});
  if (parsed.success) return parsed.data;
  const base = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const repaired: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(ProfileSchema.shape)) {
    const one = (field as z.ZodType).safeParse(base[key]);
    if (one.success) repaired[key] = one.data;
  }
  return ProfileSchema.parse(repaired);
}

export function isDarija(lang: Lang): boolean {
  return lang === "darija-latn" || lang === "darija-arab";
}

/** A darija interface fixes the script the models write darija in. */
export function scriptForLang(lang: Lang, fallback: DarijaScript): DarijaScript {
  if (lang === "darija-arab") return "arab";
  if (lang === "darija-latn") return "latn";
  return fallback;
}

/** The profile as the servers should see it for this interface language. */
export function profileForLang(profile: Profile, lang: Lang): Profile {
  const darija_script = scriptForLang(lang, profile.darija_script);
  return darija_script === profile.darija_script ? profile : { ...profile, darija_script };
}

/** Travellers implied by the profile; friends leave the count to the request. */
export function profileTravellers(profile: Profile): {
  adults: number | null;
  children: number;
} {
  switch (profile.companions) {
    case "solo":
      return { adults: 1, children: 0 };
    case "duo":
      return { adults: 2, children: 0 };
    case "family":
      return { adults: 2, children: profile.children_count };
    default:
      return { adults: null, children: 0 };
  }
}

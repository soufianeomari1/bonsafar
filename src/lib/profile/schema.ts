import { z } from "zod";
import { LANGUAGES, type Lang } from "@/lib/i18n";

/** Values allowed by the `profiles` table checks in supabase/schema.sql. */
export const AIRPORTS = ["CMN", "RAK", "RBA", "TNG", "FEZ", "AGA", "OUD"] as const;
export const COMPANIONS = ["solo", "duo", "family", "friends"] as const;
export const PASSPORTS = ["ma", "fr", "both", "other"] as const;
export const STYLES = ["budget", "comfort", "premium"] as const;
export const DARIJA_SCRIPTS = ["latn", "arab"] as const;

export type Airport = (typeof AIRPORTS)[number];
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
  home_airport: z.enum(AIRPORTS).nullable().default(null),
  companions: z.enum(COMPANIONS).nullable().default(null),
  children_count: z.number().int().min(0).max(9).default(0),
  passport_country: z.enum(PASSPORTS).nullable().default(null),
  has_schengen: z.boolean().default(false),
  passport_6m: z.boolean().default(true),
  intl_card: z.boolean().default(true),
  travel_style: z.enum(STYLES).nullable().default(null),
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
  "passport_country",
  "has_schengen",
  "passport_6m",
  "intl_card",
  "travel_style",
  "prefs",
  "haptics",
] as const satisfies readonly (keyof Profile)[];

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

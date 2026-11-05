import type { Intent } from "@/lib/intent/schema";
import type { Profile } from "@/lib/profile/schema";

/**
 * The jury persona and the two demo trips, as already-understood intents.
 * Plain data with type-only imports, so scripts/agent-check.mjs can import
 * this file directly with Node's type stripping.
 */

export const FATIMA: Profile = {
  first_name: "Fatima",
  ui_lang: "en",
  darija_script: "latn",
  home_airport: "CMN",
  companions: "duo",
  children_count: 0,
  children_ages: [],
  passport_country: "ma",
  passport_expiry: "2031-03",
  has_schengen: false,
  schengen_expiry: null,
  passport_6m: true,
  intl_card: true,
  travel_style: "comfort",
  budget_band: "10to15k",
  fav_months: [12],
  whatsapp_number: null,
  whatsapp_consent_at: null,
  prefs: { direct_only: false, breakfast: true, halal: false, accessibility: false, onboarded: true },
  haptics: true,
};

const BASE = {
  origin_iata: "CMN",
  origin_city: null,
  depart_date: "2026-12-15",
  return_date: "2026-12-22",
  nights: 7,
  adults: 2,
  children: 0,
  budget_mad: null,
  budget_per_night_mad: null,
  wishes: [{ kind: "breakfast", label: "Breakfast" }],
  keywords: [],
  question: null,
} satisfies Omit<Intent, "destination" | "translation_en">;

export const SCENARIOS = {
  istanbul: {
    ...BASE,
    destination: { city: "Istanbul", country: "Turkey", iata: "IST" },
    translation_en:
      "I want to go to Istanbul with my husband, mid-December, for a week, with breakfast at the hotel.",
  },
  paris: {
    ...BASE,
    destination: { city: "Paris", country: "France", iata: "CDG" },
    translation_en:
      "I want to go to Paris with my husband, mid-December, for a week, with breakfast at the hotel.",
  },
} satisfies Record<string, Intent>;

export type ScenarioName = keyof typeof SCENARIOS;

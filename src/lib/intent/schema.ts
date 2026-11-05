import { z } from "zod";
import type { RunEvent } from "@/lib/ai/events";
import { LANGUAGES } from "@/lib/i18n";
import { ProfileSchema } from "@/lib/profile/schema";

export const WISH_KINDS = [
  "breakfast",
  "direct_flight",
  "halal",
  "sea",
  "pool",
  "city_center",
  "near_landmark",
  "accessibility",
  "family",
  "other",
] as const;

export const KEYWORD_SLOTS = [
  "destination",
  "origin",
  "dates",
  "travelers",
  "budget",
  "wish",
] as const;

export const QUESTION_TOPICS = ["destination", "dates", "origin", "travelers", "other"] as const;

/** Which fact a follow-up question is asking for. A hand edit of this fact wins. */
export const QUESTION_FIELDS = ["destination", "dates", "nights", "travelers", "budget"] as const;

const Trilingual = z.object({
  darija: z.string().min(1).max(200),
  fr: z.string().min(1).max(200),
  en: z.string().min(1).max(200),
  /** Modern Standard Arabic. Only asked for when the request has lang = "ar". */
  ar: z.string().min(1).max(200).optional(),
});
const TrilingualAr = Trilingual.extend({ ar: z.string().min(1).max(200) });

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** The one follow-up question, with its quick answers. */
export const QuestionSchema = z.object({
  topic: z.enum(QUESTION_TOPICS),
  /** The fact this question asks for. A hand edit of it dismisses the card. */
  field: z.enum(QUESTION_FIELDS),
  ...Trilingual.shape,
  options: z.array(Trilingual).max(4),
});

/** What the model must return when the interface is in Arabic. */
export const QuestionSchemaAr = QuestionSchema.extend({
  ar: z.string().min(1).max(200),
  options: z.array(TrilingualAr).max(4),
});

/** What Muse Spark must return. Mirrored as a JSON schema in response_format. */
export const IntentSchema = z.object({
  destination: z
    .object({
      city: z.string().min(1).max(80),
      country: z.string().min(1).max(80),
      iata: z.string().regex(/^[A-Z]{3}$/),
    })
    .nullable(),
  origin_iata: z.string().regex(/^[A-Z]{3}$/).nullable(),
  /**
   * English city name when the traveller named a city and not one airport.
   * Null keeps a single IATA code (the profile airport, or Orly, CDG, …).
   */
  origin_city: z.string().min(1).max(80).nullable().default(null),
  depart_date: IsoDate.nullable(),
  return_date: IsoDate.nullable(),
  nights: z.number().int().min(1).max(60).nullable(),
  adults: z.number().int().min(1).max(9),
  children: z.number().int().min(0).max(9),
  budget_mad: z.number().positive().max(10_000_000).nullable(),
  /** Cap per hotel night, in dirhams. Null when the traveller gave a total, or no budget. */
  budget_per_night_mad: z.number().positive().max(10_000_000).nullable().default(null),
  wishes: z
    .array(z.object({ kind: z.enum(WISH_KINDS), label: z.string().min(1).max(80) }))
    .max(6),
  keywords: z
    .array(z.object({ text: z.string().min(1).max(60), slot: z.enum(KEYWORD_SLOTS) }))
    .max(10),
  translation_en: z.string().max(600),
  question: QuestionSchema.nullable(),
});

export type Intent = z.infer<typeof IntentSchema>;
export type IntentKeyword = Intent["keywords"][number];
export type IntentWish = Intent["wishes"][number];
export type KeywordSlot = (typeof KEYWORD_SLOTS)[number];
export type WishKind = (typeof WISH_KINDS)[number];
export type QuestionField = (typeof QUESTION_FIELDS)[number];

/** Values the traveller typed by hand. The model must copy them and must not ask about them. */
export const LockedSchema = z.object({
  fields: z.array(z.enum(QUESTION_FIELDS)).min(1).max(5),
  destination: z
    .object({
      city: z.string().min(1).max(80),
      country: z.string().min(1).max(80),
      iata: z.string().regex(/^[A-Z]{3}$/),
    })
    .nullable()
    .optional(),
  depart_date: IsoDate.nullable().optional(),
  return_date: IsoDate.nullable().optional(),
  nights: z.number().int().min(1).nullable().optional(),
  adults: z.number().int().min(1).max(9).optional(),
  children: z.number().int().min(0).max(9).optional(),
  budget_mad: z.number().positive().max(10_000_000).nullable().optional(),
  budget_per_night_mad: z.number().positive().max(10_000_000).nullable().optional(),
});

export type IntentLocks = z.infer<typeof LockedSchema>;

export const REASONING_EFFORTS = ["minimal", "low", "medium"] as const;
export type IntentEffort = (typeof REASONING_EFFORTS)[number];

export const IntentRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(2000),
  profile: ProfileSchema,
  /** UI language: sets the language of the wish labels. */
  lang: z.enum(LANGUAGES),
  jury: z.boolean().default(false),
  answers: z
    .array(z.object({ question: z.string().max(200), answer: z.string().max(200) }))
    .max(3)
    .default([]),
  /** Hand-edited facts. Code copies them back over the model result. */
  locked: LockedSchema.optional(),
  effort: z.enum(REASONING_EFFORTS).optional(),
});

export type IntentRequest = z.input<typeof IntentRequestSchema>;

export type IntentResponse = {
  intent: Intent;
  run_id: string;
  events: RunEvent[];
};

export const TRANSLATE_TARGETS = ["en", "ar", "darija-arab"] as const;
export type TranslateTarget = (typeof TRANSLATE_TARGETS)[number];

/**
 * en: English gloss of the transcript, separate from the intent so the chips do not wait for it.
 * ar: Modern Standard Arabic version of a model line, for replays recorded without one.
 * darija-arab: darija in Arabic letters, for replays recorded with darija in Latin letters.
 */
export const TranslateRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(2000),
  target: z.enum(TRANSLATE_TARGETS).default("en"),
});

export type TranslateRequest = z.input<typeof TranslateRequestSchema>;

export type TranslateResponse = {
  target: TranslateTarget;
  translation: string;
  /** Kept for the English gloss: same value as translation. */
  translation_en?: string;
  run_id: string;
  events: RunEvent[];
};

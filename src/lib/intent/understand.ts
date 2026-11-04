import { z } from "zod";
import { serverEnv } from "@/lib/env";
import { callChat } from "@/lib/ai/call";
import type { RunLog } from "@/lib/ai/events";
import { collectStrings, containsMoney, scrubMoney } from "@/lib/prices/guardrail";
import type { Lang } from "@/lib/i18n";
import { airportCity } from "@/lib/airports";
import { profileTravellers, type Profile } from "@/lib/profile/schema";
import { applyLocks } from "./edits";
import {
  IntentSchema,
  QuestionSchemaAr,
  type Intent,
  type IntentEffort,
  type IntentLocks,
} from "./schema";

/**
 * Measured on 2026-11-03: "minimal" gave the same intents as "low" on our
 * test sentences in about 5 s instead of 8 s. Compare on /dev/voice.
 */
export const DEFAULT_INTENT_EFFORT: IntentEffort = "minimal";

const AIRPORT_CITIES: Record<string, string> = {
  CMN: "Casablanca",
  RAK: "Marrakech",
  RBA: "Rabat",
  TNG: "Tangier",
  FEZ: "Fes",
  AGA: "Agadir",
  OUD: "Oujda",
};

const LANG_NAMES: Record<Lang, string> = {
  fr: "French",
  en: "English",
  ar: "Modern Standard Arabic",
  "darija-latn": "Moroccan darija in Latin letters",
  "darija-arab": "Moroccan darija in Arabic letters",
};

/** Translation is a separate, parallel call. The model must not spend tokens on it. */
const ModelIntentSchema = IntentSchema.omit({ translation_en: true });
/** An Arabic interface also needs the question and its options in Modern Standard Arabic. */
const ModelIntentSchemaAr = ModelIntentSchema.extend({ question: QuestionSchemaAr.nullable() });
type ModelIntent = z.infer<typeof ModelIntentSchema>;

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const JSON_SCHEMA = jsonSchema(ModelIntentSchema);
const JSON_SCHEMA_AR = jsonSchema(ModelIntentSchemaAr);

function today(): { iso: string; weekday: string } {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Casablanca",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Casablanca",
    weekday: "long",
  }).format(now);
  return { iso, weekday };
}

function describeProfile(profile: Profile): string {
  const travellers = profileTravellers(profile);
  const companions = {
    solo: "alone (1 adult)",
    duo: "as a couple (2 adults)",
    family: `as a family (2 adults, ${travellers.children} children)`,
    friends: "with friends (count not known)",
  } as const;
  const passport = {
    ma: "Moroccan",
    fr: "French",
    both: "Moroccan and French",
    other: "another country",
  } as const;
  const lines = [
    `- Home airport: ${
      profile.home_airport
        ? `${profile.home_airport} (${AIRPORT_CITIES[profile.home_airport] ?? airportCity(profile.home_airport) ?? "airport"})`
        : "not known"
    }`,
    `- Usually travels: ${profile.companions ? companions[profile.companions] : "not known"}`,
    `- Passport: ${profile.passport_country ? passport[profile.passport_country] : "not known"}; valid Schengen visa: ${profile.has_schengen ? "yes" : "no"}`,
    `- Style: ${profile.travel_style ?? "not known"}`,
  ];
  return lines.join("\n");
}

/** Static, so the prefix is shared by every request and can be cached. */
const SYSTEM_PROMPT = `You are the understanding step of BonSafar, a travel agent for Moroccans. The traveller described a trip out loud, usually in Moroccan darija (Latin or Arabic letters), often mixed with French. The text is a speech transcript and may contain recognition errors. Fill the JSON schema. The user message gives today's date, the traveller profile (already known: never ask about it), the darija script and the label language.

Rules:
1. destination: the city to visit, its country in English and its main airport IATA code. If no precise city is named (only a wish like "somewhere with the sea"), use null.
2. origin_iata: the profile home airport, unless the traveller names another departure city.
3. Dates are always in the future, relative to today. "nouss"/"mi-"/"mid" a month = the 15th. "bdyat"/"début"/"early" = the 1st. "lekher"/"fin"/"late" = the 24th. A month alone = the 15th. "chi semaine"/"une semaine"/"a week" = 7 nights; "weekend" = Friday to Sunday. With a start and a length, return_date = depart_date + nights. A season alone ("f l'été", "summer") or nothing at all is too vague: dates and nights null.
4. adults and children: from the words ("m3a rajli" = with my husband = 2 adults), otherwise from the profile; 2 adults if still unknown.
5. budget_mad: only if the traveller says a budget in dirhams (dh, dirham, "alf" = thousand). Otherwise null. Never guess.
6. wishes: what they ask for (breakfast "b ftour", direct flight, halal, sea, pool...). label: 1 to 3 words in the label language.
7. keywords: EXACT substrings copied from the transcript (same spelling, accents and case) that carry each extracted fact, with the slot they fill. At most 2 per slot, most telling first.
8. Do not translate the transcript and do not write an English gloss of it. Another call does that.
9. question: null unless something indispensable is missing: the destination, or dates too vague to search. Then ask ONE short, friendly question about the most important gap, never about the departure city, travellers or papers. Set field to the gap you ask about: destination, dates, nights, travelers or budget. darija in the given script, plus French and English, and Modern Standard Arabic in "ar" (fusha, never darija) when the user message asks for it. Give 2 to 4 short answer options, each in the same languages. Each language is complete on its own, with no word of another language inside it. Latin digits only. No amounts of money anywhere.`;

function arabicQuestion(lang: Lang, jury: boolean): boolean {
  return lang === "ar" && !jury;
}

function contextBlock(profile: Profile, lang: Lang, jury: boolean): string {
  const { iso, weekday } = today();
  const script =
    profile.darija_script === "arab" ? "Arabic letters" : "Latin letters (Arabizi, with 3, 7, 9)";
  return [
    `Today: ${weekday} ${iso} (Morocco time).`,
    `Traveller profile:\n${describeProfile(profile)}`,
    `Darija script: ${script}. Label language: ${jury ? "English" : LANG_NAMES[lang]}.`,
    arabicQuestion(lang, jury)
      ? `If you ask a question, also write it and its options in Modern Standard Arabic ("ar").`
      : `If you ask a question, leave "ar" out.`,
  ].join("\n");
}

function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000
  );
}

const SPOKEN_NUMBER = /\d|mille|alf|alaf|ألف|آلاف|million|mlyoun|thousand/i;

/**
 * Code-side checks the model cannot be trusted with: exact keywords for A2,
 * date arithmetic, one question never about what the profile knows, no
 * invented budget, and no amount of money in any model text.
 */
function locksBlock(locks: IntentLocks | undefined): string | null {
  if (!locks?.fields.length) return null;
  const lines = [
    "Locked fields (the traveller set these by hand; copy them exactly, do not change them, and do not ask about them):",
  ];
  if (locks.fields.includes("destination")) {
    lines.push(
      locks.destination
        ? `- destination: ${locks.destination.city}, ${locks.destination.country}, ${locks.destination.iata}`
        : "- destination: null",
    );
  }
  if (locks.fields.includes("dates")) {
    lines.push(`- dates: depart ${locks.depart_date ?? "null"}, return ${locks.return_date ?? "null"}`);
  }
  if (locks.fields.includes("nights") || locks.fields.includes("dates")) {
    lines.push(`- nights: ${locks.nights ?? "null"}`);
  }
  if (locks.fields.includes("travelers")) {
    lines.push(`- travelers: ${locks.adults ?? 1} adults, ${locks.children ?? 0} children`);
  }
  if (locks.fields.includes("budget")) {
    lines.push(
      locks.budget_mad == null
        ? "- budget_mad: null"
        : `- budget_mad: ${locks.budget_mad} (copy this number, never write it in a sentence)`,
    );
  }
  return lines.join("\n");
}

function enforce(
  raw: Intent,
  transcript: string,
  answers: { answer: string }[],
  profile: Profile,
  locks: IntentLocks | undefined,
  log: RunLog,
): Intent {
  const intent: Intent = structuredClone(raw);

  const lower = transcript.toLocaleLowerCase();
  const seen = new Set<string>();
  intent.keywords = raw.keywords.flatMap((keyword) => {
    let text = keyword.text.trim();
    if (!text) return [];
    if (!transcript.includes(text)) {
      const index = lower.indexOf(text.toLocaleLowerCase());
      if (index === -1) return [];
      text = transcript.slice(index, index + text.length);
    }
    if (seen.has(text)) return [];
    seen.add(text);
    return [{ ...keyword, text }];
  });

  if (!intent.origin_iata && profile.home_airport) intent.origin_iata = profile.home_airport;

  if (intent.depart_date && intent.return_date) {
    const nights = daysBetween(intent.depart_date, intent.return_date);
    if (nights >= 1) intent.nights = nights;
    else intent.return_date = null;
  } else if (intent.depart_date && intent.nights) {
    intent.return_date = addDays(intent.depart_date, intent.nights);
  }

  const spoken = [transcript, ...answers.map((answer) => answer.answer)].join("\n");
  if (intent.budget_mad !== null && !SPOKEN_NUMBER.test(spoken)) {
    intent.budget_mad = null;
  }

  const travellersKnown = profile.companions !== null && profile.companions !== "friends";
  if (
    intent.question &&
    ((intent.question.topic === "origin" && profile.home_airport) ||
      ((intent.question.topic === "travelers" || intent.question.field === "travelers") &&
        travellersKnown))
  ) {
    intent.question = null;
  }

  // Keywords are the traveller's own words, so they are not model text.
  const modelText = collectStrings({
    destination: intent.destination,
    wishes: intent.wishes,
    translation_en: intent.translation_en,
    question: intent.question,
  });
  const blocked = modelText.filter(containsMoney);
  if (blocked.length) {
    intent.translation_en = scrubMoney(intent.translation_en, "{budget}");
    intent.wishes = intent.wishes.filter((wish) => !containsMoney(wish.label));
    if (intent.question) {
      const q = intent.question;
      intent.question = {
        ...q,
        darija: scrubMoney(q.darija, "…"),
        fr: scrubMoney(q.fr, "…"),
        en: scrubMoney(q.en, "…"),
        ...(q.ar ? { ar: scrubMoney(q.ar, "…") } : {}),
        options: q.options.filter(
          (option) => !collectStrings(option).some(containsMoney)
        ),
      };
    }
  }
  log.add({
    step: "price_guardrail",
    model: "code",
    latency_ms: 0,
    status: blocked.length ? "blocked" : "passed",
    note: blocked.length
      ? `${blocked.length} model text field(s) carried an amount, removed`
      : `${modelText.length} model text fields scanned`,
  });

  return locks ? applyLocks(intent, locks) : intent;
}

export async function understand({
  transcript,
  profile,
  lang,
  jury,
  answers,
  locked,
  effort = DEFAULT_INTENT_EFFORT,
  log,
}: {
  transcript: string;
  profile: Profile;
  lang: Lang;
  jury: boolean;
  answers: { question: string; answer: string }[];
  locked?: IntentLocks;
  effort?: IntentEffort;
  log: RunLog;
}): Promise<Intent> {
  const env = serverEnv();
  const arabic = arabicQuestion(lang, jury);
  const modelSchema: z.ZodType<ModelIntent> = arabic ? ModelIntentSchemaAr : ModelIntentSchema;
  const userContent = [
    contextBlock(profile, lang, jury),
    `Transcript:\n${transcript}`,
    ...(answers.length
      ? [
          `The traveller already answered:\n${answers
            .map((a) => `- ${a.question} → ${a.answer}`)
            .join("\n")}\nUse these answers and do not ask the same thing again.`,
        ]
      : []),
    locksBlock(locked) ?? "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { content } = await callChat({
      log,
      step: attempt === 0 ? "intent" : "intent_repair",
      note: `reasoning ${effort}`,
      timeoutMs: 20_000,
      params: {
        model: env.MODEL_SPARK,
        reasoning_effort: effort,
        max_completion_tokens: 4000,
        prompt_cache_key: "bonsafar-intent",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: "TripIntent", schema: arabic ? JSON_SCHEMA_AR : JSON_SCHEMA },
        },
      },
    });

    let issue: string;
    try {
      const parsed = modelSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        return enforce(
          { ...parsed.data, translation_en: "" },
          transcript,
          answers,
          profile,
          locked,
          log,
        );
      }
      issue = z.prettifyError(parsed.error);
    } catch {
      issue = "The output was not valid JSON.";
    }

    messages.push(
      { role: "assistant", content },
      {
        role: "user",
        content: `That output does not match the schema:\n${issue.slice(0, 800)}\nReturn the corrected JSON only.`,
      }
    );
  }

  throw new Error("The intent did not match the schema after one repair.");
}

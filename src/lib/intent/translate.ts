import { z } from "zod";
import { callChat } from "@/lib/ai/call";
import type { RunLog } from "@/lib/ai/events";
import { serverEnv } from "@/lib/env";
import { containsMoney, guardModelText, scrubMoney } from "@/lib/prices/guardrail";

const TranslateSchema = z.object({
  translation_en: z.string().max(600),
});

const ArabicSchema = z.object({
  translation_ar: z.string().min(1).max(600),
});

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const JSON_SCHEMA = jsonSchema(TranslateSchema);
const JSON_SCHEMA_AR = jsonSchema(ArabicSchema);

const DarijaArabSchema = z.object({
  translation_darija_arab: z.string().min(1).max(600),
});

const JSON_SCHEMA_DARIJA_ARAB = jsonSchema(DarijaArabSchema);

const SYSTEM_PROMPT = `You translate one travel request into natural English for someone who does not speak Moroccan darija. The text is a speech transcript: darija in Latin or Arabic letters, French, Arabic, or a mix. Return only the JSON object.

Rules:
- One or two short sentences. Faithful. Add nothing.
- Never write an amount of money, a currency word, or a price. Where a budget is said, write the token {budget}.
- Keep city names, dates and how many people are travelling.`;

const SYSTEM_PROMPT_AR = `You translate one short line of a travel app into Modern Standard Arabic (fusha) for an Arabic-speaking traveller. Return only the JSON object.

Rules:
- Modern Standard Arabic only: never Moroccan darija, never a French or English word.
- Faithful and short. Add nothing, explain nothing.
- Keep city, airline, hotel and brand names as they are (Latin letters are fine for brands like BonSafar, Kiwi.com, trivago).
- Write numbers with Latin digits (0-9).
- Never write an amount of money, a currency word, or a price.`;

const SYSTEM_PROMPT_DARIJA_ARAB = `You rewrite one short line of a travel app in Moroccan darija written in Arabic letters, for a traveller who reads darija in Arabic script. The line is English. Return only the JSON object.

Rules:
- Moroccan darija as people write it in Arabic letters (e.g. "رحلة مباشرة، كتربح الوقت"). Never Latin letters for darija words, never Modern Standard Arabic phrasing.
- Faithful and short. Add nothing, explain nothing.
- Keep city, airline, hotel and brand names as they are (Latin letters are fine for brands like BonSafar, Kiwi.com, trivago).
- Write numbers with Latin digits (0-9).
- Never write an amount of money, a currency word, or a price.`;

type Target = {
  step: "translate" | "translate_ar" | "translate_darija_arab";
  cacheKey: string;
  /** Reasoning tokens count too: Arabic script needs more room than 300. */
  maxTokens: number;
  system: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
  read: (value: unknown) => { ok: true; text: string } | { ok: false; issue: string };
  /** Scans and cleans the text, logging one price_guardrail event. */
  guard: (text: string, log: RunLog) => string;
};

const ENGLISH: Target = {
  step: "translate",
  cacheKey: "bonsafar-translate",
  maxTokens: 300,
  system: SYSTEM_PROMPT,
  schemaName: "TranscriptEnglish",
  jsonSchema: JSON_SCHEMA,
  read: (value) => {
    const parsed = TranslateSchema.safeParse(value);
    return parsed.success
      ? { ok: true, text: parsed.data.translation_en.trim() }
      : { ok: false, issue: z.prettifyError(parsed.error) };
  },
  guard: (text, log) => {
    const blocked = containsMoney(text);
    log.add({
      step: "price_guardrail",
      model: "code",
      latency_ms: 0,
      status: blocked ? "blocked" : "passed",
      note: blocked ? "translation carried an amount, removed" : "1 model text field scanned",
    });
    return blocked ? scrubMoney(text, "{budget}").replace(/\s{2,}/g, " ").trim() : text;
  },
};

const ARABIC: Target = {
  step: "translate_ar",
  cacheKey: "bonsafar-translate-ar",
  maxTokens: 1000,
  system: SYSTEM_PROMPT_AR,
  schemaName: "TextArabic",
  jsonSchema: JSON_SCHEMA_AR,
  read: (value) => {
    const parsed = ArabicSchema.safeParse(value);
    return parsed.success
      ? { ok: true, text: parsed.data.translation_ar.trim() }
      : { ok: false, issue: z.prettifyError(parsed.error) };
  },
  guard: (text, log) => {
    const verdict = guardModelText(text, log, "arabic translation");
    return verdict.passed ? text : scrubMoney(text, "…").replace(/\s{2,}/g, " ").trim();
  },
};

const DARIJA_ARAB: Target = {
  step: "translate_darija_arab",
  cacheKey: "bonsafar-translate-darija-arab",
  maxTokens: 1000,
  system: SYSTEM_PROMPT_DARIJA_ARAB,
  schemaName: "TextDarijaArabic",
  jsonSchema: JSON_SCHEMA_DARIJA_ARAB,
  read: (value) => {
    const parsed = DarijaArabSchema.safeParse(value);
    return parsed.success
      ? { ok: true, text: parsed.data.translation_darija_arab.trim() }
      : { ok: false, issue: z.prettifyError(parsed.error) };
  },
  guard: (text, log) => {
    const verdict = guardModelText(text, log, "darija translation");
    return verdict.passed ? text : scrubMoney(text, "…").replace(/\s{2,}/g, " ").trim();
  },
};

/** Muse Spark, lowest reasoning effort, short output. Logs its own events. */
async function translate(text: string, target: Target, log: RunLog): Promise<string> {
  const env = serverEnv();
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: target.system },
    { role: "user", content: text },
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { content } = await callChat({
      log,
      step: attempt === 0 ? target.step : `${target.step}_repair`,
      note: "reasoning minimal",
      timeoutMs: 12_000,
      params: {
        model: env.MODEL_SPARK,
        reasoning_effort: "minimal",
        max_completion_tokens: target.maxTokens,
        prompt_cache_key: target.cacheKey,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: target.schemaName, schema: target.jsonSchema },
        },
      },
    });

    let issue = "The output was not valid JSON.";
    try {
      const result = target.read(JSON.parse(content));
      if (result.ok) return target.guard(result.text, log);
      issue = result.issue;
    } catch {
      issue = "The output was not valid JSON.";
    }

    messages.push(
      { role: "assistant", content },
      {
        role: "user",
        content: `That output does not match the schema:\n${issue.slice(0, 400)}\nReturn the corrected JSON only.`,
      },
    );
  }

  throw new Error("The translation did not match the schema after one repair.");
}

/** English gloss of a darija transcript. */
export function translateTranscript(transcript: string, log: RunLog): Promise<string> {
  return translate(transcript, ENGLISH, log);
}

/** Modern Standard Arabic version of one model line, for replays recorded without it. */
export function translateToArabic(text: string, log: RunLog): Promise<string> {
  return translate(text, ARABIC, log);
}

/** Darija in Arabic letters, for replays recorded with darija in Latin letters. */
export function translateToDarijaArab(text: string, log: RunLog): Promise<string> {
  return translate(text, DARIJA_ARAB, log);
}

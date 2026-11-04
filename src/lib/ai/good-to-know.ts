import { z } from "zod";
import { serverEnv } from "@/lib/env";
import type { RunLog } from "@/lib/ai/events";
import { callChat } from "@/lib/ai/call";
import { guardModelText, scrubMoney } from "@/lib/prices/guardrail";

const Line = z.object({
  darija: z.string().trim().min(1).max(180),
  fr: z.string().trim().min(1).max(180),
  en: z.string().trim().min(1).max(180),
});

/** Four short notes. No amount of money is valid here. */
export const GoodToKnowSchema = z.object({
  timezone: Line,
  plugs: Line,
  currency: Line,
  weather: Line,
});

export type GoodToKnow = z.infer<typeof GoodToKnowSchema>;

const JSON_SCHEMA = (() => {
  const schema = z.toJSONSchema(GoodToKnowSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

const SYSTEM = `You write four short practical notes for a Moroccan traveller about to fly. Each note is one sentence, in Moroccan darija, French and English.

Fields, in order of usefulness:
- timezone: the time difference between Morocco and the destination.
- plugs: whether a Moroccan plug works there, and if an adapter is needed.
- currency: the name of the local currency only.
- weather: the typical weather during the travel month. A season word is enough.

Never write a price, a fee, a budget or any amount of money. No digits next to a currency, and no currency symbol. A clock offset such as "+2" is fine. Do not invent a precise temperature.`;

export type GoodToKnowRequest = {
  city: string;
  country: string;
  origin: string;
  /** "December 2026", already formatted by code. */
  month: string;
  script: "latn" | "arab";
  runId?: string;
};

function cleaned(value: GoodToKnow): GoodToKnow {
  const scrub = (text: string) => scrubMoney(text, "").replace(/\s{2,}/g, " ").trim();
  const line = (item: GoodToKnow["timezone"]) => ({
    darija: scrub(item.darija),
    fr: scrub(item.fr),
    en: scrub(item.en),
  });
  return GoodToKnowSchema.parse({
    timezone: line(value.timezone),
    plugs: line(value.plugs),
    currency: line(value.currency),
    weather: line(value.weather),
  });
}

/**
 * Muse Spark, lowest reasoning effort. The text is scanned by the price
 * guardrail. One repair if it fails, then the amounts are stripped. A line
 * that becomes empty after that is an error: we do not invent a replacement.
 */
export async function fetchGoodToKnow(request: GoodToKnowRequest, log: RunLog): Promise<GoodToKnow> {
  const env = serverEnv();
  const script = request.script === "arab" ? "Arabic letters" : "Latin letters (Arabizi, digits 3, 7 and 9)";
  const user = [
    `Destination: ${request.city}, ${request.country}.`,
    `Traveller leaves from: ${request.origin}, Morocco.`,
    `Travel month: ${request.month}.`,
    `Darija script: ${script}.`,
  ].join("\n");

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ];

  let last = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { content } = await callChat({
      log,
      step: attempt === 0 ? "good_to_know" : "good_to_know_repair",
      note: "reasoning minimal",
      timeoutMs: 25_000,
      params: {
        model: env.MODEL_SPARK,
        reasoning_effort: "minimal",
        max_completion_tokens: 2500,
        prompt_cache_key: "bonsafar-good-to-know",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: "GoodToKnow", schema: JSON_SCHEMA },
        },
      },
    });
    last = content;
    let parsed: GoodToKnow | null = null;
    try {
      const json = GoodToKnowSchema.safeParse(JSON.parse(content));
      if (json.success) parsed = json.data;
    } catch {
      parsed = null;
    }
    if (!parsed) {
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content: "That was not the JSON schema. Answer again with the four fields only.",
      });
      continue;
    }
    const verdict = guardModelText(parsed, log, "good_to_know");
    if (verdict.passed) return parsed;
    if (attempt === 0) {
      messages.push({ role: "assistant", content });
      messages.push({
        role: "user",
        content:
          "A field contained an amount of money. Rewrite all four notes with no price, no fee and no currency symbol.",
      });
      continue;
    }
    return cleaned(parsed);
  }
  throw new Error(last ? "good_to_know_invalid" : "good_to_know_empty");
}

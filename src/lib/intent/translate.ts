import { z } from "zod";
import { callChat } from "@/lib/ai/call";
import type { RunLog } from "@/lib/ai/events";
import { serverEnv } from "@/lib/env";
import { containsMoney, scrubMoney } from "@/lib/prices/guardrail";

const TranslateSchema = z.object({
  translation_en: z.string().max(600),
});

const JSON_SCHEMA = (() => {
  const schema = z.toJSONSchema(TranslateSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

const SYSTEM_PROMPT = `You translate one travel request into natural English for someone who does not speak Moroccan darija. The text is a speech transcript: darija in Latin or Arabic letters, French, Arabic, or a mix. Return only the JSON object.

Rules:
- One or two short sentences. Faithful. Add nothing.
- Never write an amount of money, a currency word, or a price. Where a budget is said, write the token {budget}.
- Keep city names, dates and how many people are travelling.`;

/** Muse Spark, lowest reasoning effort, short output. Logs its own event. */
export async function translateTranscript(transcript: string, log: RunLog): Promise<string> {
  const env = serverEnv();
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: transcript },
  ];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { content } = await callChat({
      log,
      step: attempt === 0 ? "translate" : "translate_repair",
      note: "reasoning minimal",
      timeoutMs: 12_000,
      params: {
        model: env.MODEL_SPARK,
        reasoning_effort: "minimal",
        max_completion_tokens: 300,
        prompt_cache_key: "bonsafar-translate",
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: "TranscriptEnglish", schema: JSON_SCHEMA },
        },
      },
    });

    let issue = "The output was not valid JSON.";
    try {
      const parsed = TranslateSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        let text = parsed.data.translation_en.trim();
        const blocked = containsMoney(text);
        if (blocked) text = scrubMoney(text, "{budget}").replace(/\s{2,}/g, " ").trim();
        log.add({
          step: "price_guardrail",
          model: "code",
          latency_ms: 0,
          status: blocked ? "blocked" : "passed",
          note: blocked
            ? "translation carried an amount, removed"
            : "1 model text field scanned",
        });
        return text;
      }
      issue = z.prettifyError(parsed.error);
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

import { z } from "zod";
import type { Response } from "openai/resources/responses/responses";
import { serverEnv } from "@/lib/env";
import type { RunLog } from "@/lib/ai/events";
import { callResponses } from "@/lib/ai/responses";
import { guardModelText, scrubMoney } from "@/lib/prices/guardrail";
import type { Profile } from "@/lib/profile/schema";
import { EntryModelSchema, type EntryRequirements } from "./schema";

const JSON_SCHEMA = (() => {
  const schema = z.toJSONSchema(EntryModelSchema) as Record<string, unknown>;
  delete schema.$schema;
  return schema;
})();

const PASSPORTS: Record<NonNullable<Profile["passport_country"]>, string> = {
  ma: "Moroccan ordinary passport",
  fr: "French passport",
  both: "Moroccan and French passports (the French one can be used)",
  other: "passport of another country (not Moroccan, not French)",
};

/** Static, so the prefix is shared by every request and can be cached. */
const SYSTEM_PROMPT = `You check entry requirements for BonSafar, a travel agent for Moroccans. Always search the web first, on official government sources (ministry of foreign affairs, official visa portals, service-public, e-visa sites run by the government). Do at most two focused searches, then answer in the JSON schema.

Rules:
- visa_needed: true when this traveller, with this passport and visa situation, must get a visa or an e-visa before travelling for a short tourist stay. A visa the traveller already holds counts (a valid Schengen visa covers France).
- visa_kind: none, schengen, evisa, on_arrival, consular or unknown.
- max_stay_days: the visa-free (or visa) tourist stay limit in days, null if unclear.
- passport_validity_days: how many days the passport must remain valid counted from the arrival date (e.g. 150 when it must be valid 60 days beyond a 90-day stay; 90 for "3 months after the planned departure" from a short trip, rounded to the rule), null if unclear.
- notes: one or two short sentences on what to prepare, in Moroccan darija (in the given script), French and English. Never write a fee, a price or any amount of money: no digits next to a currency.`;

function sourceDate(iso: string): string {
  return iso.slice(0, 10);
}

const OFFICIAL =
  /(^|\.)(gov|gouv|go|gob|mfa|diplomatie|europa|service-public|france-visas|consulat|evisa)\.|\.gov(\.[a-z]{2})?$|\.gouv\.[a-z]{2}$|\.gc\.ca$/i;

function isOfficial(url: string): boolean {
  try {
    return OFFICIAL.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Cited pages, pages the model opened, then the raw search hits. Official
 * government domains only when there is one; otherwise the first two. With a
 * JSON output the model rarely cites inline.
 */
function extractSources(response: Response, checkedAt: string): EntryRequirements["sources"] {
  const candidates: { url: string; title?: string }[] = [];
  const hits: { url: string; title?: string }[] = [];

  for (const item of response.output) {
    if (item.type !== "message") continue;
    for (const part of item.content) {
      if (part.type !== "output_text") continue;
      for (const annotation of part.annotations ?? []) {
        if (annotation.type === "url_citation") candidates.push({ url: annotation.url, title: annotation.title });
      }
    }
  }
  for (const item of response.output) {
    if (item.type !== "web_search_call") continue;
    const call = item as {
      action?: { type?: string; url?: string };
      results?: { url?: string; title?: string }[];
    };
    if (call.action?.type === "open_page" && call.action.url) candidates.push({ url: call.action.url });
    for (const hit of call.results ?? []) if (hit.url) hits.push({ url: hit.url, title: hit.title });
  }

  const titles = new Map(hits.filter((h) => h.title).map((h) => [h.url, h.title]));
  const all = [...candidates, ...hits].filter((c) => /^https?:\/\//.test(c.url));
  const official = all.filter((c) => isOfficial(c.url));
  const seen = new Set<string>();
  const sources: EntryRequirements["sources"] = [];
  for (const c of official.length ? official : all.slice(0, 2)) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    const title = c.title || titles.get(c.url) || new URL(c.url).hostname;
    sources.push({ title: title.slice(0, 160), url: c.url, date: sourceDate(checkedAt) });
  }
  return sources.slice(0, 3);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

export async function checkEntryRequirements({
  country,
  countryCode,
  city,
  departDate,
  nights,
  profile,
  log,
}: {
  country: string;
  countryCode: string | null;
  city: string | null;
  departDate: string | null;
  nights: number | null;
  profile: Profile;
  log: RunLog;
}): Promise<EntryRequirements> {
  const env = serverEnv();
  const passport = profile.passport_country ? PASSPORTS[profile.passport_country] : "unknown passport";
  const script = profile.darija_script === "arab" ? "Arabic letters" : "Latin letters (Arabizi)";
  const input = [
    `Traveller: ${passport}. Holds a valid Schengen visa: ${profile.has_schengen ? "yes" : "no"}.`,
    `Trip: tourism in ${city ? `${city}, ` : ""}${country}${countryCode ? ` (${countryCode})` : ""}${
      departDate ? `, arriving ${departDate}` : ""
    }${nights ? `, ${nights} nights` : ""}.`,
    `Darija script: ${script}.`,
  ].join("\n");

  const { response, finalText } = await callResponses({
    log,
    step: "entry_requirements",
    note: `${country}, web_search`,
    timeoutMs: 30_000,
    params: {
      model: env.MODEL_SPARK,
      reasoning: { effort: "minimal" },
      instructions: SYSTEM_PROMPT,
      input,
      tools: [{ type: "web_search", search_context_size: "low" }],
      include: ["web_search_call.results"],
      text: { format: { type: "json_schema", name: "EntryRequirements", schema: JSON_SCHEMA } },
      max_output_tokens: 3000,
    },
  });

  const parsed = EntryModelSchema.safeParse(parseJson(finalText));
  if (!parsed.success) throw new Error("Entry requirements did not match the schema.");

  const result = parsed.data;
  const verdict = guardModelText(result.notes, log, "entry notes");
  if (!verdict.passed) {
    result.notes = {
      darija: scrubMoney(result.notes.darija, "…"),
      fr: scrubMoney(result.notes.fr, "…"),
      en: scrubMoney(result.notes.en, "…"),
    };
  }

  const checkedAt = new Date().toISOString();
  return {
    ...result,
    country,
    country_code: countryCode,
    passport: profile.passport_country ?? "unknown",
    has_schengen: profile.has_schengen,
    sources: extractSources(response, checkedAt),
    checked_at: checkedAt,
  };
}

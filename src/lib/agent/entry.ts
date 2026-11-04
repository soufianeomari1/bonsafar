import { z } from "zod";
import type { Response } from "openai/resources/responses/responses";
import { serverEnv } from "@/lib/env";
import type { RunLog } from "@/lib/ai/events";
import { callResponses } from "@/lib/ai/responses";
import { SCRIPT_RULES } from "@/lib/ai/script-rules";
import { guardModelText, scrubMoney } from "@/lib/prices/guardrail";
import type { Profile } from "@/lib/profile/schema";
import { EntryModelSchema, EntryModelSchemaAr, type EntryRequirements } from "./schema";

function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

const JSON_SCHEMA = jsonSchema(EntryModelSchema);
const JSON_SCHEMA_AR = jsonSchema(EntryModelSchemaAr);

const PASSPORTS: Record<NonNullable<Profile["passport_country"]>, string> = {
  ma: "Moroccan ordinary passport",
  fr: "French passport",
  both: "Moroccan and French passports (the French one can be used)",
  other: "passport of another country (not Moroccan, not French)",
};

/** Static, so the prefix is shared by every request and can be cached. */
const SYSTEM_PROMPT = `You check entry requirements for BonSafar, a travel agent for Moroccans. Always search the web first, on the destination country's own official sources (its ministry of foreign affairs, its official visa portal, its e-visa site, its public service portal), for this exact passport. Use the official sites listed in the request first. Ignore pages about another destination (for example a French consulate page for Finland when the trip is to France) and pages from another country's government. Do at most two focused searches, then answer in the JSON schema.

Rules:
- visa_needed: true when this traveller, with this passport and visa situation, must get a visa or an e-visa before travelling for a short tourist stay. A visa the traveller already holds counts (a valid Schengen visa covers France).
- visa_kind: none, schengen, evisa, on_arrival, consular or unknown.
- max_stay_days: the visa-free (or visa) tourist stay limit in days, null if unclear.
- passport_validity_days: how many days the passport must remain valid counted from the arrival date (e.g. 150 when it must be valid 60 days beyond a 90-day stay; 90 for "3 months after the planned departure" from a short trip, rounded to the rule), null if unclear.
- notes: one or two short sentences on what to prepare, in Moroccan darija (in the given script), French and English. When the request asks for Arabic, also fill "ar" in Modern Standard Arabic (fusha, never darija), with Latin digits. Each language is complete on its own, with no word of another language inside it. Never write a fee, a price or any amount of money: no digits next to a currency.

${SCRIPT_RULES}`;

function sourceDate(iso: string): string {
  return iso.slice(0, 10);
}

const OFFICIAL =
  /(^|\.)(gov|gouv|go|gob|mfa|diplomatie|europa|service-public|france-visas|consulat|evisa)\.|\.gov(\.[a-z]{2})?$|\.gouv\.[a-z]{2}$|\.gc\.ca$/i;

/** Schengen members among BonSafar destinations: europa.eu pages are relevant there. */
const SCHENGEN = new Set(["FR", "ES", "PT", "IT", "NL", "BE", "DE", "AT", "CH", "GR"]);

/** The destination's own official entry pages, searched first and ranked first. */
const OFFICIAL_SITES: Record<string, { sites: string[]; topic: string }> = {
  FR: { sites: ["france-visas.gouv.fr", "service-public.gouv.fr"], topic: "short-stay Schengen visa (type C) for France" },
  DE: { sites: ["auswaertiges-amt.de"], topic: "short-stay Schengen visa (type C) for Germany" },
  ES: { sites: ["exteriores.gob.es"], topic: "short-stay Schengen visa for Spain" },
  PT: { sites: ["vistos.mne.gov.pt"], topic: "short-stay Schengen visa for Portugal" },
  IT: { sites: ["vistoperitalia.esteri.it"], topic: "short-stay Schengen visa for Italy" },
  NL: { sites: ["netherlandsworldwide.nl"], topic: "short-stay Schengen visa for the Netherlands" },
  BE: { sites: ["diplomatie.belgium.be", "dofi.ibz.be"], topic: "short-stay Schengen visa for Belgium" },
  GB: { sites: ["gov.uk"], topic: "UK standard visitor visa" },
  TR: { sites: ["mfa.gov.tr", "evisa.gov.tr"], topic: "visa requirements for Turkey" },
  AE: { sites: ["u.ae", "icp.gov.ae"], topic: "UAE tourist visa" },
  QA: { sites: ["mofa.gov.qa"], topic: "visa for Qatar" },
  EG: { sites: ["visa2egypt.gov.eg"], topic: "visa for Egypt" },
  SA: { sites: ["visa.mofa.gov.sa"], topic: "tourist visa for Saudi Arabia" },
  MY: { sites: ["imi.gov.my"], topic: "visa requirements for Malaysia" },
  TH: { sites: ["mfa.go.th", "thaievisa.go.th"], topic: "visa exemption for Thailand" },
};

/** Country-code top-level domains that are not the ISO code. */
const TLD_COUNTRY: Record<string, string> = { uk: "GB" };
const NOT_COUNTRIES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"]);

const words = (text: string) =>
  ` ${text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

/** Country names in English and French by ISO code, to spot pages about another country. */
const COUNTRY_NAMES: Map<string, string[]> = (() => {
  const names = new Map<string, string[]>();
  const display = ["en", "fr"].map((locale) => new Intl.DisplayNames([locale], { type: "region" }));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const a of letters) {
    for (const b of letters) {
      const code = a + b;
      if (NOT_COUNTRIES.has(code)) continue;
      const list = new Set<string>();
      for (const d of display) {
        const name = d.of(code);
        if (name && name !== code) list.add(words(name).trim());
      }
      if (list.size) names.set(code, [...list].filter((n) => n.length > 3));
    }
  }
  names.set("TR", [...(names.get("TR") ?? []), "turkey", "turquie"]);
  return names;
})();

function codeFromName(country: string): string | null {
  const name = words(country).trim();
  for (const [code, names] of COUNTRY_NAMES) if (names.includes(name)) return code;
  return null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Drops tracking parameters and the fragment from a source link. */
function cleanUrl(url: string): string {
  const parsed = new URL(url);
  for (const name of [...parsed.searchParams.keys()]) {
    if (/^(utm_|funnel_|fbclid|gclid)/i.test(name)) parsed.searchParams.delete(name);
  }
  parsed.hash = "";
  return parsed.toString();
}

function isOfficial(url: string): boolean {
  const host = hostOf(url);
  return host != null && OFFICIAL.test(host);
}

/** ISO code a government domain belongs to, from its top-level domain. */
function domainCountry(host: string): string | null {
  const tld = host.split(".").at(-1) ?? "";
  if (tld === "gov") return "US";
  if (tld.length !== 2) return null;
  return TLD_COUNTRY[tld] ?? tld.toUpperCase();
}

/** The page title or path names a country the traveller is not going to. */
function aboutOtherCountry(source: { url: string; title?: string }, allowed: Set<string>): boolean {
  let path = "";
  try {
    path = decodeURIComponent(new URL(source.url).pathname);
  } catch {
    path = "";
  }
  const text = words(`${path} ${source.title ?? ""}`);
  for (const [code, names] of COUNTRY_NAMES) {
    if (allowed.has(code)) continue;
    if (names.some((name) => text.includes(` ${name} `))) return true;
  }
  return false;
}

/**
 * Cited pages, pages the model opened, then the raw search hits. Pages about
 * another country and other governments' pages are dropped; the
 * destination's own official sites rank first, then other official pages.
 * A third-party page is never a source. At most two. With a JSON output
 * the model rarely cites inline.
 */
function extractSources(
  response: Response,
  checkedAt: string,
  destinationCode: string | null,
  passportCodes: string[],
): EntryRequirements["sources"] {
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
  const allowed = new Set([...(destinationCode ? [destinationCode] : []), ...passportCodes]);
  const ownSites = destinationCode ? (OFFICIAL_SITES[destinationCode]?.sites ?? []) : [];
  const schengen = destinationCode != null && SCHENGEN.has(destinationCode);

  const ranked: { url: string; host: string; title: string; rank: number }[] = [];
  for (const c of [...candidates, ...hits]) {
    const host = hostOf(c.url);
    if (!host || !/^https?:\/\//.test(c.url)) continue;
    const title = c.title || titles.get(c.url) || host;
    if (aboutOtherCountry({ url: c.url, title }, allowed)) continue;

    const official = isOfficial(c.url);
    const country = domainCountry(host);
    const foreignGovernment =
      official && country != null && !allowed.has(country) && !(schengen && host.endsWith("europa.eu"));
    if (foreignGovernment) continue;

    const own = ownSites.findIndex((site) => host === site);
    const ownSub = ownSites.findIndex((site) => host.endsWith(`.${site}`));
    const rank = own >= 0 ? own : ownSub >= 0 ? 10 + ownSub : official ? 20 : 30;
    ranked.push({ url: c.url, host, title, rank });
  }

  // Stable sort: within a rank, cited and opened pages stay ahead of hits.
  ranked.sort((a, b) => a.rank - b.rank);
  // One source per site: two pages of the same portal add nothing.
  // Rank 30 is everything that is not a government, europa.eu, or the
  // destination's own visa site. Those pages are not shown.
  const sites = new Set<string>();
  return ranked
    .filter((s) => s.rank < 30)
    .filter((s) => {
      if (sites.has(s.host)) return false;
      sites.add(s.host);
      return true;
    })
    .slice(0, 2)
    .map((s) => ({ title: s.title.slice(0, 160), url: cleanUrl(s.url), date: sourceDate(checkedAt) }));
}

const PASSPORT_CODES: Record<NonNullable<Profile["passport_country"]>, string[]> = {
  ma: ["MA"],
  fr: ["FR"],
  both: ["MA", "FR"],
  other: [],
};

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
  arabic,
  log,
}: {
  country: string;
  countryCode: string | null;
  city: string | null;
  departDate: string | null;
  nights: number | null;
  profile: Profile;
  /** Adds the Modern Standard Arabic line to the notes. */
  arabic: boolean;
  log: RunLog;
}): Promise<EntryRequirements> {
  const env = serverEnv();
  const passport = profile.passport_country ? PASSPORTS[profile.passport_country] : "unknown passport";
  const script = profile.darija_script === "arab" ? "Arabic letters" : "Latin letters (Arabizi)";
  const code = countryCode?.toUpperCase() ?? codeFromName(country);
  const official = code ? OFFICIAL_SITES[code] : undefined;
  const input = [
    `Traveller: ${passport}. Holds a valid Schengen visa: ${profile.has_schengen ? "yes" : "no"}.`,
    `Trip: tourism in ${city ? `${city}, ` : ""}${country}${code ? ` (${code})` : ""}${
      departDate ? `, arriving ${departDate}` : ""
    }${nights ? `, ${nights} nights` : ""}.`,
    official
      ? `Official sites to search first: ${official.sites.join(", ")}. Look for the page on: ${official.topic}, for a ${passport}.`
      : `Search the official government site of ${country} about its visa rules for a ${passport}.`,
    `Darija script: ${script}.`,
    arabic ? `Also write the notes in Modern Standard Arabic ("ar").` : `Leave "ar" out of the notes.`,
  ].join("\n");

  const schema: z.ZodType<z.infer<typeof EntryModelSchema>> = arabic ? EntryModelSchemaAr : EntryModelSchema;
  const passportCodes = profile.passport_country ? PASSPORT_CODES[profile.passport_country] : [];

  async function search(text: string, note: string) {
    const { response, finalText } = await callResponses({
      log,
      step: "entry_requirements",
      note,
      timeoutMs: 30_000,
      params: {
        model: env.MODEL_SPARK,
        reasoning: { effort: "minimal" },
        instructions: SYSTEM_PROMPT,
        input: text,
        tools: [{ type: "web_search", search_context_size: "low" }],
        include: ["web_search_call.results"],
        text: {
          format: { type: "json_schema", name: "EntryRequirements", schema: arabic ? JSON_SCHEMA_AR : JSON_SCHEMA },
        },
        max_output_tokens: 3000,
      },
    });
    const parsed = schema.safeParse(parseJson(finalText));
    if (!parsed.success) throw new Error("Entry requirements did not match the schema.");
    const checkedAt = new Date().toISOString();
    return {
      result: parsed.data,
      sources: extractSources(response, checkedAt, code, passportCodes),
      checkedAt,
    };
  }

  const primary = official?.sites[0];
  const citesPrimary = (url: string) => {
    const host = hostOf(url);
    return !!primary && !!host && (host === primary || host.endsWith(`.${primary}`));
  };

  let found = await search(input, `${country}, web_search`);
  // No page on the destination's own visa site: one more search, on that site only.
  if (official && primary && !found.sources.some((source) => citesPrimary(source.url))) {
    const again = await search(
      [
        input,
        `Search once more, and only on ${official.sites.join(" and ")}. Open the page about: ${official.topic}, for a ${passport}. Do not use any other website.`,
      ].join("\n\n"),
      `${country}, official site`,
    );
    if (again.sources.some((source) => citesPrimary(source.url))) found = again;
    else if (found.sources.length === 0) found = again;
  }

  const result = found.result;
  const verdict = guardModelText(result.notes, log, "entry notes");
  if (!verdict.passed) {
    const { ar } = result.notes;
    result.notes = {
      darija: scrubMoney(result.notes.darija, "…"),
      fr: scrubMoney(result.notes.fr, "…"),
      en: scrubMoney(result.notes.en, "…"),
      ...(ar ? { ar: scrubMoney(ar, "…") } : {}),
    };
  }

  return {
    ...result,
    country,
    country_code: countryCode,
    passport: profile.passport_country ?? "unknown",
    has_schengen: profile.has_schengen,
    sources: found.sources,
    checked_at: found.checkedAt,
  };
}

/**
 * Landscape Muse Image illustrations for the home-screen trip ideas.
 * Run: npm run images:generate
 *      npm run images:generate -- --force
 *      npm run images:generate -- --force omra
 *
 * Reads META_API_KEY, META_API_BASE_URL and MODEL_IMAGE from .env.local.
 * The key is never printed. An existing public/ideas/<slug>.webp is kept
 * unless --force names that slug (or --force alone names them all).
 *
 * Endpoint and fields match src/lib/ai/image.ts and
 * https://dev.meta.ai/docs/image-generation : POST /v1/images/generations.
 * `size` sets the aspect ratio. 1792x1024 is the documented landscape example.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Same ids as `IDEAS` in src/lib/ideas.ts, in that order. */
const IDEAS = [
  {
    id: "istanbul",
    prompt: [
      "A wide landscape travel illustration of Istanbul at golden hour.",
      "The Bosphorus, a bright blue sky, and warm golden light on simple painted domes and a distant skyline.",
      "Luminous, warm, hopeful, painterly, not a photograph.",
      "No text, no letters, no numbers, no logos, no watermarks, no signs, no writing on flags, no recognizable people, no faces, no crowd.",
    ].join(" "),
  },
  {
    id: "paris",
    prompt: [
      "A wide landscape travel illustration of Paris at golden hour.",
      "A river, bridges and rooftops as simple friendly shapes, a bright blue sky and warm golden light.",
      "Luminous, warm, hopeful, painterly, not a photograph.",
      "No text, no letters, no numbers, no logos, no watermarks, no signs, no writing, no recognizable people, no faces, no crowd.",
    ].join(" "),
  },
  {
    id: "omra",
    prompt: [
      "A wide landscape illustration of pale stone arches and a vast quiet courtyard at sunrise, seen from far away.",
      "A respectful, empty sanctuary, architecture only, soft blue sky warming into golden light.",
      "Luminous, calm, painterly, not a photograph.",
      "No crowd, no person, no silhouette, no face, no calligraphy, no inscriptions, no letters, no numbers, no logos, no signs, no flags, no text of any kind.",
    ].join(" "),
  },
  {
    id: "tunis",
    prompt: [
      "A wide landscape travel illustration of Tunis by the Mediterranean.",
      "White and blue buildings and the sea, a bright blue sky and warm golden light.",
      "Luminous, warm, hopeful, painterly, not a photograph.",
      "No text, no letters, no numbers, no logos, no watermarks, no signs, no writing, no recognizable people, no faces, no crowd.",
    ].join(" "),
  },
  {
    id: "barcelona",
    prompt: [
      "A wide landscape travel illustration of Barcelona by the sea, seen from a distance.",
      "Tiled roofs and the waterfront, a bright blue sky and warm golden light.",
      "Luminous, warm, hopeful, painterly, not a photograph.",
      "No text, no letters, no numbers, no logos, no watermarks, no signs, no mosaics forming words, no recognizable people, no faces, no crowd.",
    ].join(" "),
  },
];

const SIZE = "1792x1024";
const COST_USD = 0.01;

function loadEnv(file) {
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(join(root, ".env.local"));
loadEnv(join(root, ".env"));

const apiKey = process.env.META_API_KEY;
const model = process.env.MODEL_IMAGE;
const base = (process.env.META_API_BASE_URL || "https://api.meta.ai/v1").replace(/\/$/, "");

if (!apiKey || !model || !process.env.META_API_BASE_URL) {
  console.error("META_API_KEY, META_API_BASE_URL and MODEL_IMAGE are required in .env.local");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const named = args.filter((arg) => arg !== "--force");
const unknown = named.filter((id) => !IDEAS.some((idea) => idea.id === id));
if (unknown.length > 0) {
  console.error(`Unknown idea: ${unknown.join(", ")}`);
  process.exit(1);
}
const selected = named.length > 0 ? IDEAS.filter((idea) => named.includes(idea.id)) : IDEAS;

const dir = join(root, "public", "ideas");
mkdirSync(dir, { recursive: true });
const promptsPath = join(dir, "prompts.json");
let record = {};
if (existsSync(promptsPath)) {
  try {
    record = JSON.parse(readFileSync(promptsPath, "utf8"));
  } catch {
    record = {};
  }
}

function redact(text) {
  return text.split(apiKey).join("[redacted]").slice(0, 300);
}

let spent = 0;
for (const idea of selected) {
  const file = join(dir, `${idea.id}.webp`);
  if (existsSync(file) && !force) {
    console.log(`skip ${idea.id} (already exists)`);
    continue;
  }
  const started = Date.now();
  const response = await fetch(`${base}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: idea.prompt,
      n: 1,
      size: SIZE,
      response_format: "b64_json",
      output_format: "webp",
    }),
  });
  const latency = Date.now() - started;
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Muse Image ${idea.id} ${response.status} after ${latency} ms: ${redact(detail)}`);
    process.exit(1);
  }
  const payload = await response.json();
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    console.error(`Muse Image ${idea.id} returned no image.`);
    process.exit(1);
  }
  writeFileSync(file, Buffer.from(b64, "base64"));
  record[idea.id] = {
    prompt: idea.prompt,
    model,
    date: new Date().toISOString(),
    cost_usd: COST_USD,
  };
  spent += COST_USD;
  console.log(`wrote public/ideas/${idea.id}.webp in ${latency} ms ($${COST_USD.toFixed(2)})`);
}

writeFileSync(promptsPath, `${JSON.stringify(record, null, 2)}\n`);
console.log(`done. new cost $${spent.toFixed(2)}`);

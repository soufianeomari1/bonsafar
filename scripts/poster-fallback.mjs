/**
 * Generates the Istanbul poster once, with Muse Image, for the live-call fallback.
 * Run: npm run poster:fallback
 * Reads META_API_KEY, META_API_BASE_URL and MODEL_IMAGE from .env.local.
 * Endpoint and fields: https://dev.meta.ai/docs/image-generation
 * POST /v1/images/generations, size sets the 9:16 ratio, output is webp base64.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

if (!apiKey || !model) {
  console.error("META_API_KEY and MODEL_IMAGE are required in .env.local");
  process.exit(1);
}

const prompt = [
  "A vertical travel illustration of Istanbul, Turkey, at golden hour.",
  "Warm luminous sky, soft clouds, the skyline and landmarks drawn as simple friendly shapes.",
  "Bright, warm, hopeful travel-poster illustration, painterly, not a photograph.",
  "No text, no letters, no numbers, no logos, no watermarks, no writing on signs or flags, no recognizable people, no faces.",
].join(" ");

const size = "1152x2048";
const started = Date.now();

const response = await fetch(`${base}/images/generations`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model,
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
    output_format: "webp",
  }),
});

const latency = Date.now() - started;
if (!response.ok) {
  const detail = await response.text();
  console.error(`Muse Image ${response.status}: ${detail.slice(0, 400)}`);
  process.exit(1);
}

const payload = await response.json();
const b64 = payload.data?.[0]?.b64_json;
if (!b64) {
  console.error("Muse Image returned no image.");
  process.exit(1);
}

const dir = join(root, "public", "posters");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "istanbul-fallback.webp"), Buffer.from(b64, "base64"));

const record = {
  "istanbul-fallback": {
    file: "istanbul-fallback.webp",
    prompt,
    date: new Date().toISOString(),
    cost_usd: 0.01,
    size,
    output_format: "webp",
    latency_ms: latency,
    model_env: "MODEL_IMAGE",
  },
};
writeFileSync(join(dir, "prompts.json"), `${JSON.stringify(record, null, 2)}\n`);
console.log(`wrote public/posters/istanbul-fallback.webp in ${latency} ms`);

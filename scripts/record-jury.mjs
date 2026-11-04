// Records the three judges' scenarios live, from their voice notes, so the
// board can replay them honestly: transcription, intent, then the agent run
// with the jury label (jury-istanbul, jury-paris, jury-sea), saved by the
// server like any live run. Needs a running server and JURY_ACCESS_KEY.
// Stops before any call when a voice note is missing.
// Usage: npm run record:jury -- [http://localhost:3001] [istanbul|paris|sea ...]
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FATIMA } from "../src/lib/agent/scenarios.ts";
import { JURY_SCENARIOS } from "../src/lib/jury/scenarios.ts";
import { juryCookie } from "./jury-cookie.mjs";

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? process.env.AGENT_URL ?? "http://localhost:3001").replace(/\/$/, "");
const picked = args.filter((a) => !/^https?:\/\//.test(a));
const scenarios = picked.length ? JURY_SCENARIOS.filter((s) => picked.includes(s.id)) : JURY_SCENARIOS;
const usd = (n) => `$${n.toFixed(4)}`;
const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

const missing = scenarios.filter((s) => !existsSync(join("public", s.audio)));
if (missing.length) {
  console.error("Missing voice notes, nothing was recorded:");
  for (const s of missing) console.error(`  - public${s.audio} (scenario ${s.number}, ${s.title})`);
  console.error("Add them as WAV PCM16 mono 24 kHz, then run npm run record:jury again.");
  process.exit(1);
}

const cookie = await juryCookie(base).catch(() => null);
if (!cookie) {
  console.error(`No jury cookie from ${base}/jury. Is the server running, and JURY_ACCESS_KEY set in .env.local?`);
  process.exit(1);
}

/** Reads a text/event-stream body and calls onEvent with each data line parsed as JSON. */
async function readSse(response, onEvent) {
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    let index;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      const name = /^event: (.+)$/m.exec(block)?.[1];
      const data = block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data) onEvent(name, JSON.parse(data));
    }
  }
}

async function transcribe(file, runId) {
  const response = await fetch(`${base}/api/transcribe`, {
    method: "POST",
    headers: { "content-type": "audio/wav", "x-run-id": runId, Cookie: cookie },
    body: readFileSync(file),
  });
  if (!response.ok) throw new Error(`transcribe: HTTP ${response.status} ${await response.text()}`);
  let final = null;
  let failure = null;
  await readSse(response, (event, data) => {
    if (event === "final" || data.event === "final") final = data.data ?? data;
    if (event === "error" || data.event === "error") failure = (data.data ?? data).message;
  });
  if (!final?.text) throw new Error(`transcribe: ${failure ?? "no transcript"}`);
  return final;
}

async function understand(transcript, runId, answers) {
  const response = await fetch(`${base}/api/intent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-run-id": runId, Cookie: cookie },
    body: JSON.stringify({ transcript, profile: FATIMA, lang: "en", jury: true, answers }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.intent) throw new Error(`intent: HTTP ${response.status} ${body?.error ?? ""}`);
  return body.intent;
}

async function record(scenario) {
  const runId = `run-jury-${scenario.id}-${Date.now().toString(36)}`;
  console.log(`\n${scenario.number}. ${scenario.title} (${scenario.label})`);
  const final = await transcribe(join("public", scenario.audio), runId);
  console.log(`  transcript: ${final.text}`);
  console.log(`  ${final.model}${final.fallback ? " (fallback)" : ""}, ${sec(final.latency_ms)}, ${usd(final.cost_usd)}`);

  // The judge answers the one question with a quick reply; the script takes the first one.
  const answers = [];
  let intent = await understand(final.text, runId, answers);
  while (intent.question && answers.length < 2) {
    const option = intent.question.options[0];
    if (!option) break;
    console.log(`  question: ${intent.question.en} -> ${option.en}`);
    answers.push({ question: intent.question.en, answer: option.en });
    intent = await understand(final.text, runId, answers);
  }
  if (!intent.destination || !intent.depart_date || !intent.return_date) {
    throw new Error(`intent incomplete: ${JSON.stringify({ destination: intent.destination, depart: intent.depart_date, back: intent.return_date })}`);
  }
  console.log(`  intent: ${intent.origin_iata} -> ${intent.destination.city}, ${intent.depart_date} to ${intent.return_date}, ${intent.adults} adult(s)`);

  const response = await fetch(`${base}/api/agent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-run-id": runId, Cookie: cookie },
    body: JSON.stringify({ intent, profile: FATIMA, lang: "en", jury: true, scenario: scenario.label }),
  });
  if (!response.ok) throw new Error(`agent: HTTP ${response.status} ${await response.text()}`);
  let saved = false;
  let end = null;
  let error = null;
  let result = null;
  await readSse(response, (_event, data) => {
    if (data.type === "result") result = data.package;
    if (data.type === "saved") saved = data.ok;
    if (data.type === "error") error = `${data.code}${data.detail ? `: ${data.detail}` : ""}`;
    if (data.type === "end") end = data;
  });
  if (error || !result) throw new Error(`agent: ${error ?? "no package"}`);
  if (!saved) throw new Error("agent: the run finished but was not saved (check SUPABASE_SECRET_KEY and the runs table)");
  console.log(`  package: ${result.destination.city}, status ${result.status}, prices captured ${result.prices_captured_at}`);
  console.log(`  recorded: agent ${sec(end.total_ms)}, ${usd(end.cost_usd)}`);
}

let failed = 0;
for (const scenario of scenarios) {
  try {
    await record(scenario);
  } catch (error) {
    failed += 1;
    console.error(`  FAILED: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(failed ? `\n${failed} scenario(s) not recorded.` : "\nAll scenarios recorded. The board replays them from now on.");
process.exit(failed ? 1 : 0);

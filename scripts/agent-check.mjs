// Runs the Istanbul and Paris scenarios against POST /api/agent of a running
// server and prints total time, total measured cost and the recommended
// package. With --replay, streams the latest saved run instead and checks it
// is the same event sequence as the live run, every event marked replay.
// By default it also runs one live Arabic run (lang "ar", not saved as a demo
// scenario) and checks every "ar" line is filled: why, entry notes, plus
// /api/good-to-know, /api/translate (targets ar and darija-arab) and the
// /api/intent question.
// Usage: npm run agent:check -- [http://localhost:3001] [istanbul] [--replay paris] [--ar istanbul] [--no-ar]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FATIMA, SCENARIOS } from "../src/lib/agent/scenarios.ts";
import { juryCookie } from "./jury-cookie.mjs";

const args = process.argv.slice(2);
const urlArg = args.find((a) => /^https?:\/\//.test(a));
const flagged = (flag) => args.flatMap((a, i) => (args[i - 1] === flag && a in SCENARIOS ? [a] : []));
const replays = flagged("--replay");
const arabicRuns = flagged("--ar");
const live = args.filter((a, i) => a in SCENARIOS && args[i - 1] !== "--replay" && args[i - 1] !== "--ar");
const onlyFlagged = !live.length && (replays.length || arabicRuns.length);
const jobs = [
  ...(onlyFlagged ? [] : live.length ? live : Object.keys(SCENARIOS)).map((name) => ({
    name,
    replay: false,
    arabic: false,
  })),
  ...replays.map((name) => ({ name, replay: true, arabic: false })),
  ...(arabicRuns.length ? arabicRuns : args.includes("--no-ar") || replays.length ? [] : ["istanbul"]).map(
    (name) => ({ name, replay: false, arabic: true }),
  ),
];
const FATIMA_AR = { ...FATIMA, ui_lang: "ar" };

const REQUIRED_TYPES = ["run", "step", "log", "offers", "result", "saved", "end"];
const REPLAY_MAX_S = 12;
// The live event sequence of each scenario, kept between runs of this script.
const sequenceDir = join(tmpdir(), "bonsafar-agent-check");
const sequenceFile = (name) => join(sequenceDir, `${name}.json`);
const describeEvent = (e) => (e.type === "step" ? `step:${e.step}:${e.phase}:${e.destination ?? ""}` : e.type);

async function pickBase() {
  if (urlArg) return urlArg.replace(/\/$/, "");
  if (process.env.AGENT_URL) return process.env.AGENT_URL.replace(/\/$/, "");
  // The route only accepts POST: a 405 on GET means this server has it.
  for (const base of ["http://localhost:3000", "http://localhost:3001"]) {
    try {
      const probe = await fetch(`${base}/api/agent`, { signal: AbortSignal.timeout(15_000) });
      if (probe.status === 405) return base;
    } catch {
      // try the next port
    }
  }
  throw new Error("No server with /api/agent on :3000 or :3001. Start `npm run dev` or pass a URL.");
}

const mad = (n) => `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(n)} MAD`;
const dh = (n) => `${new Intl.NumberFormat("en").format(n)} DH`;
const usd = (n) => `$${n.toFixed(4)}`;

const filled = (value) => typeof value === "string" && value.trim().length > 0;
const ARABIC_LETTERS = /[\u0600-\u06FF]/;
const arabicProblem = (label, value) =>
  !filled(value) ? `${label}: ar is empty` : !ARABIC_LETTERS.test(value) ? `${label}: ar has no Arabic letters` : null;

/** Checks the "ar" lines of an Arabic run and of the Arabic side calls. */
async function checkArabic(base, result) {
  const problems = [];
  result.why.forEach((w, i) => problems.push(arabicProblem(`why[${i}]`, w.ar)));
  for (const [label, entry] of [
    ["requested entry notes", result.requested.entry],
    ["entry notes", result.entry],
  ]) {
    if (entry) problems.push(arabicProblem(label, entry.notes.ar));
  }
  console.log(`  why (ar): ${result.why.map((w) => w.ar ?? "∅").join(" | ")}`);
  if (result.entry?.notes.ar) console.log(`  entry notes (ar): ${result.entry.notes.ar}`);

  const post = async (path, body) => {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, body: await response.json().catch(() => null) };
  };

  const good = await post("/api/good-to-know", {
    city: result.destination.city,
    country: result.destination.country,
    origin: "Casablanca",
    origin_iata: "CMN",
    destination_iata: result.destination.iata,
    depart_date: "2026-12-15",
    month: "December 2026",
    script: "latn",
    lang: "ar",
  });
  if (good.status !== 200 || !good.body?.notes) problems.push(`good-to-know: HTTP ${good.status}`);
  else {
    for (const [key, line] of Object.entries(good.body.notes)) problems.push(arabicProblem(`good-to-know ${key}`, line.ar));
    console.log(`  good to know (ar): ${Object.values(good.body.notes).map((l) => l.ar ?? "∅").join(" | ")}`);
  }

  const source = result.why[0]?.en ?? "Direct flight, and breakfast is included.";
  const translated = await post("/api/translate", { transcript: source, target: "ar" });
  if (translated.status !== 200) problems.push(`translate ar: HTTP ${translated.status}`);
  else {
    problems.push(arabicProblem("translate ar", translated.body?.translation));
    if (translated.body?.target !== "ar") problems.push("translate ar: target is not ar");
    console.log(`  translate (ar): ${translated.body?.translation}`);
  }
  const darija = await post("/api/translate", { transcript: source, target: "darija-arab" });
  if (darija.status !== 200) problems.push(`translate darija-arab: HTTP ${darija.status}`);
  else {
    problems.push(arabicProblem("translate darija-arab", darija.body?.translation));
    console.log(`  translate (darija-arab): ${darija.body?.translation}`);
  }

  const intent = await post("/api/intent", {
    transcript: "Bghit nsafer f sif m3a rajli",
    profile: FATIMA_AR,
    lang: "ar",
    jury: false,
  });
  const question = intent.body?.intent?.question;
  if (intent.status !== 200) problems.push(`intent ar: HTTP ${intent.status}`);
  else if (!question) console.log("  intent (ar): no question asked, nothing to check");
  else {
    problems.push(arabicProblem("intent question", question.ar));
    question.options.forEach((o, i) => problems.push(arabicProblem(`intent option[${i}]`, o.ar)));
    console.log(`  intent question (ar): ${question.ar} [${question.options.map((o) => o.ar).join(" / ")}]`);
  }

  return problems.filter(Boolean);
}

let cookie;

async function run(base, name, replay, arabic) {
  // Replays need the signed jury cookie.
  cookie ??= (await juryCookie(base)) ?? "";
  const started = performance.now();
  const response = await fetch(`${base}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(
      replay
        ? { replay: true, scenario: name }
        : arabic
          ? { intent: SCENARIOS[name], profile: FATIMA_AR, lang: "ar", jury: false, scenario: null }
          : { intent: SCENARIOS[name], profile: FATIMA, lang: "en", jury: true, scenario: name },
    ),
  });
  if (!response.ok || !response.body) throw new Error(`${name}: HTTP ${response.status}`);

  const offers = new Map();
  const sequence = [];
  const replayProblems = [];
  let runEvent = null;
  let result = null;
  let end = null;
  let error = null;
  let saved = null;
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    let index;
    while ((index = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      const data = frame.split("\n").find((line) => line.startsWith("data: "));
      if (!data) continue;
      const event = JSON.parse(data.slice(6));
      sequence.push(describeEvent(event));
      if (event.type === "run") runEvent = event;
      if (event.type === "log" && event.event.replay !== replay) {
        replayProblems.push(`log ${event.event.step} has replay=${event.event.replay}`);
      }
      if (event.type === "offers") for (const offer of event.offers) offers.set(offer.id, offer);
      else if (event.type === "result") result = event.package;
      else if (event.type === "end") end = event;
      else if (event.type === "error") error = event;
      else if (event.type === "saved") saved = event.ok;
      else if (event.type === "step" && event.phase !== "progress") {
        const t = ((performance.now() - started) / 1000).toFixed(1).padStart(5);
        console.log(`  ${t}s  ${event.step.padEnd(18)} ${event.phase.padEnd(6)} ${event.destination ?? ""}`);
      }
    }
  }

  const wallSeconds = (performance.now() - started) / 1000;
  const seconds = ((end?.total_ms ?? performance.now() - started) / 1000).toFixed(1);
  const label = `${name.toUpperCase()}${replay ? " (REPLAY)" : ""}${arabic ? " (AR)" : ""}`;
  console.log(`\n${label}: ${seconds} s, cost ${usd(end?.cost_usd ?? 0)}, saved: ${saved}`);
  if (replay && end?.recorded) {
    console.log(`  recorded live run: ${(end.recorded.total_ms / 1000).toFixed(1)} s, ${usd(end.recorded.cost_usd)}`);
  }

  if (replay) {
    if (runEvent?.replay !== true || !runEvent?.captured_at) replayProblems.push("run event lacks replay or captured_at");
    if (end?.replay !== true || end?.cost_usd !== 0) replayProblems.push("end event is not replay with cost 0");
    if (wallSeconds > REPLAY_MAX_S + 0.5) replayProblems.push(`replay took ${wallSeconds.toFixed(1)} s`);
    const types = new Set(sequence.map((s) => s.split(":")[0]));
    const missing = REQUIRED_TYPES.filter((t) => !types.has(t));
    if (missing.length && !error) replayProblems.push(`missing event types: ${missing.join(", ")}`);
    let recorded = null;
    try {
      recorded = JSON.parse(readFileSync(sequenceFile(name), "utf8"));
    } catch {
      // no live run of this scenario recorded by this script
    }
    if (recorded?.run_id === runEvent?.run_id) {
      const same = recorded.sequence.length === sequence.length && recorded.sequence.every((s, i) => s === sequence[i]);
      if (!same) replayProblems.push("event sequence differs from the live run");
      else console.log(`  replay check: same ${sequence.length} events in the same order as live run ${recorded.run_id}`);
    } else if (recorded) {
      const liveTypes = [...new Set(recorded.sequence.map((s) => s.split(":")[0]))].sort().join(",");
      if (liveTypes !== [...types].sort().join(",")) replayProblems.push("event types differ from the last live run");
      else console.log(`  replay check: same event types as the last live run (a different run, ${recorded.run_id})`);
    }
  } else if (result && saved && !arabic) {
    mkdirSync(sequenceDir, { recursive: true });
    writeFileSync(sequenceFile(name), JSON.stringify({ run_id: runEvent?.run_id, sequence }));
  }
  if (replayProblems.length) {
    console.log(`  REPLAY CHECK FAILED:\n    ${replayProblems.join("\n    ")}`);
    return { ok: false, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
  }
  if (replay && !error) console.log(`  replay check: ${sequence.length} events, all marked replay, cost 0, ${wallSeconds.toFixed(1)} s`);
  if (error || !result) {
    console.log(`  FAILED: ${error?.code ?? "no result"} ${error?.detail ?? ""}`);
    return { ok: false, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
  }

  const describe = (option) => {
    const f = offers.get(option.flight_id);
    const h = offers.get(option.hotel_id);
    const leg = (l) => `${l.route.join("-")} ${l.departure.slice(11, 16)}-${l.arrival.slice(11, 16)} ${l.flights.join("/")}`;
    return [
      `${option.flight_id} ${f ? `${leg(f.attrs.outbound)} | back ${leg(f.attrs.inbound)}` : "?"}`,
      `${f ? `${f.price} ${f.currency} = ${mad(f.price_mad)}, shown ${dh(f.price_mad_display)} (${f.source})` : ""}`,
      `${option.hotel_id} ${h ? `${h.attrs.name}, ${h.attrs.stars}*, ${h.attrs.review_rating}/10, ${mad(h.price_mad)}, shown ${dh(h.price_mad_display)} (${h.source})` : "?"}`,
      `total shown ${dh(option.totals.total_display_mad)} (exact ${mad(option.totals.total_mad)}) for ${option.totals.passengers} passengers`,
    ].map((line) => `    ${line}`).join("\n");
  };

  // Every displayed total must be the sum of the displayed (whole dirham) lines.
  const options = [["recommended", result.recommended], ...result.alternatives.map((a) => [a.label, a])];
  const roundingErrors = options.flatMap(([label, option]) => {
    const t = option.totals;
    const lines = [offers.get(option.flight_id)?.price_mad_display, offers.get(option.hotel_id)?.price_mad_display];
    const problems = [];
    if (![t.total_display_mad, t.flight.price_mad_display, t.hotel.price_mad_display].every(Number.isInteger)) {
      problems.push("display amounts are not whole dirhams");
    }
    if (lines[0] !== t.flight.price_mad_display || lines[1] !== t.hotel.price_mad_display) {
      problems.push(`lines ${lines.join(" + ")} differ from the store`);
    }
    if (t.total_display_mad !== lines[0] + lines[1]) {
      problems.push(`total_display_mad ${t.total_display_mad} != ${lines[0]} + ${lines[1]}`);
    }
    return problems.map((p) => `${label}: ${p}`);
  });

  console.log(`  status: ${result.status}  notices: ${result.notices.join(", ") || "none"}`);
  if (result.requested.entry) {
    const e = result.requested.entry;
    console.log(`  entry ${result.requested.destination.city}: visa_needed=${e.visa_needed} (${e.visa_kind}), sources: ${e.sources.map((s) => s.url).join(" ")}`);
  }
  if (result.destination.city !== result.requested.destination.city) {
    console.log(`  alternative destination: ${result.destination.city}, visa_needed=${result.entry?.visa_needed}`);
  }
  console.log(`  recommended:\n${describe(result.recommended)}`);
  for (const alt of result.alternatives) console.log(`  ${alt.label}:\n${describe(alt)}`);
  const d = result.smart_tip.delta;
  const signed = (n) => (n >= 0 ? `+${n}` : `${n}`);
  console.log(
    `  smart tip: ${result.smart_tip.kind}${
      d
        ? ` ${d.compare_id} vs ${d.base_id}: ${d.extra ? `${signed(d.extra.amount)} ${d.extra.currency}` : ""} = ${signed(d.extra_display_mad)} DH shown, ${signed(d.saved_minutes)} min saved (out ${d.saved_minutes_by_leg.outbound}, back ${d.saved_minutes_by_leg.inbound})`
        : ""
    }`,
  );
  console.log(`  why: ${result.why.map((w) => w.en).join(" | ")}`);
  console.log(`  rate: 1 EUR = ${result.fx.rate} MAD (${result.fx.date}), prices captured ${result.prices_captured_at}`);
  if (d && !(Number.isInteger(d.saved_minutes) && Number.isInteger(d.extra_display_mad))) {
    roundingErrors.push("smart tip: saved_minutes or extra_display_mad is not an integer");
  }
  if (roundingErrors.length) {
    console.log(`  ROUNDING CHECK FAILED:\n    ${roundingErrors.join("\n    ")}`);
    return { ok: false, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
  }
  console.log(`  rounding check: ${options.length}/3 options, total_display_mad = sum of displayed lines`);
  if (arabic) {
    const problems = await checkArabic(base, result);
    if (problems.length) {
      console.log(`  ARABIC CHECK FAILED:\n    ${problems.join("\n    ")}`);
      return { ok: false, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
    }
    console.log("  arabic check: every ar line is filled with Arabic text");
  }
  return { ok: true, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
}

const base = await pickBase();
console.log(`Agent check against ${base}\n`);
const results = [];
for (const job of jobs) {
  console.log(`> ${job.name}${job.replay ? " (replay)" : ""}${job.arabic ? " (lang ar)" : ""}`);
  results.push(await run(base, job.name, job.replay, job.arabic));
  console.log("");
}
const totalMs = results.reduce((s, r) => s + r.ms, 0);
const totalCost = results.reduce((s, r) => s + r.cost, 0);
console.log(`TOTAL: ${(totalMs / 1000).toFixed(1)} s, ${usd(totalCost)}, ${results.filter((r) => r.ok).length}/${results.length} ok`);
process.exit(results.every((r) => r.ok) ? 0 : 1);

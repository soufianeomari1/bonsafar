// Runs the Istanbul and Paris scenarios against POST /api/agent of a running
// server and prints total time, total measured cost and the recommended
// package. Usage: npm run agent:check [-- http://localhost:3001] [-- istanbul]
import { FATIMA, SCENARIOS } from "../src/lib/agent/scenarios.ts";

const args = process.argv.slice(2);
const urlArg = args.find((a) => /^https?:\/\//.test(a));
const only = args.filter((a) => a in SCENARIOS);
const names = only.length ? only : Object.keys(SCENARIOS);

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

async function run(base, name) {
  const started = performance.now();
  const response = await fetch(`${base}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent: SCENARIOS[name], profile: FATIMA, lang: "en", jury: true, scenario: name }),
  });
  if (!response.ok || !response.body) throw new Error(`${name}: HTTP ${response.status}`);

  const offers = new Map();
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

  const seconds = ((end?.total_ms ?? performance.now() - started) / 1000).toFixed(1);
  console.log(`\n${name.toUpperCase()}: ${seconds} s, cost ${usd(end?.cost_usd ?? 0)}, saved: ${saved}`);
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
  return { ok: true, ms: end?.total_ms ?? 0, cost: end?.cost_usd ?? 0 };
}

const base = await pickBase();
console.log(`Agent check against ${base}\n`);
const results = [];
for (const name of names) {
  console.log(`> ${name}`);
  results.push(await run(base, name));
  console.log("");
}
const totalMs = results.reduce((s, r) => s + r.ms, 0);
const totalCost = results.reduce((s, r) => s + r.cost, 0);
console.log(`TOTAL: ${(totalMs / 1000).toFixed(1)} s, ${usd(totalCost)}, ${results.filter((r) => r.ok).length}/${results.length} ok`);
process.exit(results.every((r) => r.ok) ? 0 : 1);

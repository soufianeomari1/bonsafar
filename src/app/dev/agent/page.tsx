"use client";

import { useRef, useState } from "react";
import type { RunEvent } from "@/lib/ai/events";
import { FATIMA, SCENARIOS, type ScenarioName } from "@/lib/agent/scenarios";
import type { AgentPackage, AgentStreamEvent } from "@/lib/agent/schema";
import type { Offer } from "@/lib/prices/store";

/** Developer page: run the agent on a prefilled intent and watch the raw stream. */

const amount = (value: number, currency: string) =>
  new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

const time = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(
    new Date(iso),
  );

function describeOffer(offer: Offer): string {
  if (offer.kind === "flight") {
    const out = offer.attrs.outbound;
    const back = offer.attrs.inbound;
    return `${out.route.join("-")} ${out.departure.slice(11, 16)} ${out.flights.join("/")}${
      back ? ` · back ${back.route.join("-")} ${back.departure.slice(11, 16)}` : ""
    } · ${offer.attrs.passengers.adults + offer.attrs.passengers.children} pax`;
  }
  if (offer.kind === "hotel") {
    return `${offer.attrs.name} · ${offer.attrs.stars ?? "?"}* · ${offer.attrs.review_rating ?? "?"}/10 · ${offer.attrs.nights} nights${
      offer.attrs.breakfast ? " · breakfast" : ""
    }`;
  }
  return `${offer.attrs.month} · ${offer.attrs.star_rating}* · avg per night`;
}

export default function DevAgentPage() {
  const [running, setRunning] = useState<ScenarioName | null>(null);
  const [raw, setRaw] = useState<string[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [result, setResult] = useState<AgentPackage | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const abort = useRef<AbortController | null>(null);

  async function run(name: ScenarioName) {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setRunning(name);
    setRaw([]);
    setOffers([]);
    setEvents([]);
    setResult(null);
    setStatus("running");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: SCENARIOS[name], profile: FATIMA, lang: "en", jury: true, scenario: name }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        setStatus(`HTTP ${response.status}: ${await response.text()}`);
        return;
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let index;
        while ((index = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, index);
          buffer = buffer.slice(index + 2);
          setRaw((lines) => [...lines, frame]);
          const data = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!data) continue;
          const event = JSON.parse(data.slice(6)) as AgentStreamEvent;
          if (event.type === "offers") setOffers((list) => [...list, ...event.offers]);
          else if (event.type === "log") setEvents((list) => [...list, event.event]);
          else if (event.type === "result") setResult(event.package);
          else if (event.type === "error") setStatus(`error: ${event.code} ${event.detail ?? ""}`);
          else if (event.type === "end") {
            setStatus((s) =>
              s.startsWith("error") ? s : `done in ${(event.total_ms / 1000).toFixed(1)} s, $${event.cost_usd.toFixed(4)}`,
            );
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) setStatus(`failed: ${String(error)}`);
      else setStatus("stopped");
    } finally {
      setRunning(null);
    }
  }

  const totalCost = events.reduce((sum, e) => sum + e.cost_usd, 0);
  const used = new Set(
    result ? [result.recommended, ...result.alternatives].flatMap((o) => [o.flight_id, o.hotel_id]) : [],
  );

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6 font-mono text-xs">
      <h1 className="text-base font-bold">/dev/agent</h1>
      <p>Fatima, CMN, 2 adults, Moroccan passport, no Schengen visa, comfort, breakfast. 15 to 22 Dec 2026.</p>

      <div className="flex gap-3">
        {(Object.keys(SCENARIOS) as ScenarioName[]).map((name) => (
          <button
            key={name}
            type="button"
            disabled={running !== null}
            onClick={() => run(name)}
            className="rounded border px-4 py-2 font-semibold disabled:opacity-40"
          >
            {SCENARIOS[name].destination.city}
          </button>
        ))}
        <button
          type="button"
          disabled={running === null}
          onClick={() => abort.current?.abort()}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          Stop
        </button>
        <span className="self-center">{status}</span>
      </div>

      {result && (
        <section>
          <h2 className="mb-2 font-bold">Package</h2>
          <pre className="max-h-96 overflow-auto rounded border p-3">{JSON.stringify(result, null, 2)}</pre>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-bold">Price store ({offers.length} offers)</h2>
        <div className="max-h-[28rem] overflow-auto rounded border">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white">
              <tr>
                {["id", "offer", "original", "MAD", "rate", "source", "fetched", "link"].map((h) => (
                  <th key={h} className="border-b p-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} className={used.has(offer.id) ? "font-bold" : undefined}>
                  <td className="border-b p-1">{offer.id}</td>
                  <td className="border-b p-1">{offer.destination} · {describeOffer(offer)}</td>
                  <td className="border-b p-1 text-right">{amount(offer.price, offer.currency)}</td>
                  <td className="border-b p-1 text-right">{amount(offer.price_mad, "MAD")}</td>
                  <td className="border-b p-1">{offer.fx ? `${offer.fx.rate} (${offer.fx.date})` : "-"}</td>
                  <td className="border-b p-1">{offer.source}</td>
                  <td className="border-b p-1">{time(offer.fetched_at)}</td>
                  <td className="border-b p-1">
                    {offer.deeplink ? (
                      <a href={offer.deeplink} target="_blank" rel="noreferrer" className="underline">open</a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">
          Events ({events.length}, total ${totalCost.toFixed(4)})
        </h2>
        <div className="max-h-[28rem] overflow-auto rounded border">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white">
              <tr>
                {["time", "step", "model / tool", "latency", "in", "out (reasoning)", "cost", "status", "note"].map((h) => (
                  <th key={h} className="border-b p-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => (
                <tr key={index}>
                  <td className="border-b p-1">{time(event.t)}</td>
                  <td className="border-b p-1">{event.step}</td>
                  <td className="border-b p-1">{event.model}</td>
                  <td className="border-b p-1 text-right">{event.latency_ms} ms</td>
                  <td className="border-b p-1 text-right">{event.tokens_in}</td>
                  <td className="border-b p-1 text-right">
                    {event.tokens_out} ({event.tokens_reasoning})
                  </td>
                  <td className="border-b p-1 text-right">${event.cost_usd.toFixed(5)}</td>
                  <td className="border-b p-1">{event.status}</td>
                  <td className="border-b p-1">{event.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">Raw SSE ({raw.length} frames)</h2>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-all rounded border p-3">
          {raw.join("\n\n")}
        </pre>
      </section>
    </main>
  );
}

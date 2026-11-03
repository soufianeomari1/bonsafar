"use client";

import { useRef, useState } from "react";
import { Microphone, Stop } from "@phosphor-icons/react";
import { newRunId, type RunEvent } from "@/lib/ai/events";
import { formatUsd } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import { REASONING_EFFORTS, type Intent, type IntentEffort } from "@/lib/intent/schema";
import { useProfile } from "@/lib/profile/useProfile";
import { fetchIntent, transcribeWav } from "@/lib/voice/client";
import type { TranscribeFinal } from "@/lib/voice/protocol";
import { RecorderError, VoiceRecorder } from "@/lib/voice/recorder";
import { toWav24k } from "@/lib/voice/wav";
import { cn } from "@/lib/utils";

type Phase = "idle" | "recording" | "transcribing" | "understanding";

/**
 * Developer bench for block 2: record, watch the words arrive, then the
 * intent JSON and every measured event (latency, tokens, cost). English only.
 */
export default function VoiceBenchPage() {
  const { lang, jury } = useLanguage();
  const { profile, ready } = useProfile();
  const recorder = useRef<VoiceRecorder | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [partial, setPartial] = useState("");
  const [final, setFinal] = useState<TranscribeFinal | null>(null);
  const [text, setText] = useState("");
  const [intent, setIntent] = useState<Intent | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [effort, setEffort] = useState<IntentEffort>("minimal");
  const [clientMs, setClientMs] = useState<{ wav?: number; transcribe?: number; intent?: number }>({});

  async function understand(transcript: string, runId: string) {
    setPhase("understanding");
    const started = performance.now();
    try {
      const response = await fetchIntent({ transcript, profile, lang, jury, effort }, runId);
      setIntent(response.intent);
      setEvents((current) => [...current, ...response.events]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Intent failed.");
    } finally {
      setClientMs((current) => ({ ...current, intent: Math.round(performance.now() - started) }));
      setPhase("idle");
    }
  }

  function reset() {
    setPartial("");
    setFinal(null);
    setIntent(null);
    setEvents([]);
    setError(null);
    setClientMs({});
  }

  async function startRecording() {
    reset();
    const next = new VoiceRecorder();
    try {
      await next.start();
    } catch (caught) {
      setError(caught instanceof RecorderError ? `Microphone: ${caught.kind}` : "Microphone failed.");
      return;
    }
    recorder.current = next;
    setPhase("recording");
  }

  async function stopRecording() {
    const active = recorder.current;
    if (!active) return;
    recorder.current = null;
    const take = await active.stop();
    const runId = newRunId();
    setPhase("transcribing");
    try {
      const wavStarted = performance.now();
      const { wav } = await toWav24k(take);
      const transcribeStarted = performance.now();
      setClientMs({ wav: Math.round(transcribeStarted - wavStarted) });
      const result = await transcribeWav(wav, runId, (message) => {
        if (message.event === "partial") setPartial(message.data.text);
        if (message.event === "log") setEvents((current) => [...current, message.data]);
        if (message.event === "fallback") setError(`Fallback: ${message.data.reason}`);
      });
      setClientMs((current) => ({ ...current, transcribe: Math.round(performance.now() - transcribeStarted) }));
      setFinal(result);
      setText(result.text);
      if (result.text.trim()) await understand(result.text, runId);
      else setPhase("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Transcription failed.");
      setPhase("idle");
    }
  }

  const total = events.reduce((sum, event) => sum + event.cost_usd, 0);

  return (
    <main lang="en" dir="ltr" className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 text-ink">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted">Dev bench</span>
        <h1 className="text-3xl font-extrabold tracking-tight">Voice to intent</h1>
        <p className="text-sm text-muted">
          Profile: {ready ? `${profile.home_airport ?? "no airport"}, ${profile.companions ?? "no companions"}, passport ${profile.passport_country ?? "?"}, Schengen ${profile.has_schengen ? "yes" : "no"}, ${profile.travel_style ?? "no style"}` : "loading"} · UI {lang}
          {jury ? " · jury" : ""}
        </p>
      </header>

      <section className="flex flex-wrap items-center gap-3">
        {phase === "recording" ? (
          <button
            type="button"
            onClick={() => void stopRecording()}
            className="flex h-12 items-center gap-2 rounded-pill bg-red px-5 font-semibold text-card"
          >
            <Stop size={18} weight="fill" /> Stop and send
          </button>
        ) : (
          <button
            type="button"
            disabled={phase !== "idle"}
            onClick={() => void startRecording()}
            className="flex h-12 items-center gap-2 rounded-pill bg-ink px-5 font-semibold text-card disabled:opacity-40"
          >
            <Microphone size={18} weight="fill" /> Record
          </button>
        )}
        <label className="flex items-center gap-2 text-sm font-semibold">
          Reasoning effort
          <select
            value={effort}
            onChange={(event) => setEffort(event.target.value as IntentEffort)}
            className="h-10 rounded-xl border border-line bg-card px-3"
          >
            {REASONING_EFFORTS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <span className="font-mono text-xs text-muted">{phase}</span>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted">Transcript</h2>
        <p dir="auto" className="min-h-12 rounded-2xl bg-card p-4 text-lg shadow-soft">
          {partial || <span className="text-muted">Partial words appear here while the server transcribes.</span>}
        </p>
        {final && (
          <p className="font-mono text-xs text-muted">
            {final.model} · {final.latency_ms} ms server · {final.audio_seconds} s audio · {formatUsd(final.cost_usd)}
            {final.fallback ? " · FALLBACK" : ""} · client WAV {clientMs.wav} ms, round trip {clientMs.transcribe} ms
          </p>
        )}
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!text.trim() || phase !== "idle") return;
            reset();
            void understand(text.trim(), newRunId());
          }}
        >
          <input
            dir="auto"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Or type a request to test understanding only"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-card px-4"
          />
          <button
            type="submit"
            disabled={phase !== "idle" || !text.trim()}
            className="h-12 rounded-xl bg-ink px-5 font-semibold text-card disabled:opacity-40"
          >
            Understand
          </button>
        </form>
      </section>

      {error && (
        <p role="alert" className="rounded-xl bg-red-soft p-3 text-sm text-red">
          {error}
        </p>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Intent {clientMs.intent ? `· ${clientMs.intent} ms round trip` : ""}
          </h2>
          <pre className="max-h-[520px] overflow-auto rounded-2xl bg-ink p-4 font-mono text-xs leading-relaxed text-card">
            {intent ? JSON.stringify(intent, null, 2) : "—"}
          </pre>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Run log · total {formatUsd(total)}
          </h2>
          <div className="overflow-auto rounded-2xl bg-card shadow-soft">
            <table className="w-full font-mono text-xs">
              <thead className="text-left text-muted">
                <tr>
                  {["step", "model", "ms", "in", "out", "reason", "usd", "status"].map((head) => (
                    <th key={head} className="px-3 py-2 font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr key={index} className="border-t border-line align-top">
                    <td className="px-3 py-2">{event.step}</td>
                    <td className="px-3 py-2">{event.model}</td>
                    <td className="tabular px-3 py-2">{event.latency_ms}</td>
                    <td className="tabular px-3 py-2">{event.tokens_in}</td>
                    <td className="tabular px-3 py-2">{event.tokens_out}</td>
                    <td className="tabular px-3 py-2">{event.tokens_reasoning}</td>
                    <td className="tabular px-3 py-2">{formatUsd(event.cost_usd)}</td>
                    <td className={cn("px-3 py-2", event.status === "ok" || event.status === "passed" ? "text-green" : "text-orange")}>
                      {event.status}
                      {event.note ? <span className="block text-muted">{event.note}</span> : null}
                    </td>
                  </tr>
                ))}
                {!events.length && (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-muted">
                      No events yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

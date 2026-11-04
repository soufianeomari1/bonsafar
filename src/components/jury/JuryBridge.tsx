"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  configureJuryRun,
  fetchRecordedRun,
  packageOptionId,
  readAgentRun,
  readServerAgentRun,
  resetAgentRun,
  selectPackage,
  setShowGloss,
  startAgentRun,
  startJuryReplay,
  subscribeAgentRun,
  withTripSearch,
} from "@/lib/agent-client/store";
import { readJuryEmbedded, readLang, readServerJuryEmbedded } from "@/lib/i18n/store";
import { hasIndispensableInfo } from "@/lib/intent/edits";
import { IntentSchema } from "@/lib/intent/schema";
import { post, read, type BoardMessage, type PhoneTrip } from "@/lib/jury/protocol";
import { profileForLang } from "@/lib/profile/schema";
import { readProfileState } from "@/lib/profile/store";
import { clearTrip, loadRecordedTrip, readServerTrip, readTrip, startVoiceTrip, subscribeToTrip } from "@/lib/trip/store";

const subscribe = () => () => {};

const TRIP_ROUTES = ["/trip/understood", "/trip/plan", "/trip/result", "/trip/package", "/trip/ready", "/trip/file"];

/** Screens where a tap means the judge wants to look around: the guided demo stops there. */
const EXPLORE_ROUTES = new Set(["/trip/result", "/trip/package", "/trip/ready"]);

/** Pauses of the guided demo, long enough to read each screen. */
const PAUSE = { understood: 2400, result: 2600, package: 5000, ready: 5000, finished: 3500 } as const;

/** Duration and a coarse waveform for the voice bubble, from the decoded file. */
async function measure(blob: Blob): Promise<{ durationMs: number; levels: number[] }> {
  try {
    const context = new AudioContext();
    try {
      const audio = await context.decodeAudioData(await blob.arrayBuffer());
      const data = audio.getChannelData(0);
      const bars = 40;
      const size = Math.max(1, Math.floor(data.length / bars));
      const levels: number[] = [];
      for (let bar = 0; bar < bars; bar += 1) {
        let sum = 0;
        const end = Math.min(data.length, (bar + 1) * size);
        for (let i = bar * size; i < end; i += 1) sum += data[i] * data[i];
        levels.push(Math.sqrt(sum / size));
      }
      const peak = Math.max(...levels, 1e-6);
      return { durationMs: Math.round(audio.duration * 1000), levels: levels.map((level) => Math.min(1, level / peak)) };
    } finally {
      void context.close();
    }
  } catch {
    return { durationMs: 0, levels: [] };
  }
}

/** Mounted everywhere, active only inside the phone of /jury. */
export function JuryBridge() {
  const embedded = useSyncExternalStore(subscribe, readJuryEmbedded, readServerJuryEmbedded);
  return embedded ? <Bridge /> : null;
}

/**
 * The real app runs in the phone; the board drives it through postMessage
 * and mirrors its state (route, run, trip events) for the guided strip, the
 * panel and the end card. The guided demo moves through the screens with
 * pauses, and stops as soon as the judge starts exploring.
 */
function Bridge() {
  const router = useRouter();
  const pathname = usePathname();
  const run = useSyncExternalStore(subscribeAgentRun, readAgentRun, readServerAgentRun);
  const trip = useSyncExternalStore(subscribeToTrip, readTrip, readServerTrip);
  const [autopilot, setAutopilot] = useState(false);
  const finishedFor = useRef<string | null>(null);

  useEffect(() => {
    configureJuryRun(null);
    resetAgentRun();
    clearTrip();
    post(window.parent, { type: "ready" });
  }, []);

  useEffect(() => {
    const prefetch = () => {
      for (const route of TRIP_ROUTES) router.prefetch(`${route}?jury=1`);
    };
    const handle = async (message: BoardMessage) => {
      switch (message.type) {
        case "run-live": {
          configureJuryRun({ scenario: message.scenario, silenceMs: message.silenceMs });
          resetAgentRun();
          clearTrip();
          finishedFor.current = null;
          setAutopilot(true);
          prefetch();
          const response = await fetch(message.audio).catch(() => null);
          if (!response?.ok) {
            post(window.parent, { type: "failed", reason: "audio" });
            return;
          }
          const blob = await response.blob();
          const { durationMs, levels } = await measure(blob);
          void startVoiceTrip(blob, durationMs, levels);
          router.push("/trip/understood?jury=1");
          return;
        }
        case "run-replay": {
          configureJuryRun(null);
          resetAgentRun();
          finishedFor.current = null;
          setAutopilot(true);
          prefetch();
          const recorded = await fetchRecordedRun(message.scenario);
          const intent = IntentSchema.safeParse(recorded?.intent);
          if (intent.success) loadRecordedTrip(intent.data);
          else clearTrip();
          startJuryReplay(message.scenario);
          router.push("/trip/plan?jury=1");
          return;
        }
        case "own":
          configureJuryRun({ scenario: null, silenceMs: message.silenceMs });
          resetAgentRun();
          clearTrip();
          finishedFor.current = null;
          setAutopilot(true);
          prefetch();
          router.push("/home?jury=1");
          return;
        case "reset":
          configureJuryRun(null);
          resetAgentRun();
          clearTrip();
          finishedFor.current = null;
          setAutopilot(false);
          router.push("/home?jury=1");
          return;
        case "gloss":
          setShowGloss(message.show);
          return;
      }
    };
    const onMessage = (event: MessageEvent) => {
      const message = read<BoardMessage>(event, window.parent);
      if (message) void handle(message);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [router]);

  useEffect(() => {
    const phoneTrip: PhoneTrip | null = trip
      ? {
          phase: trip.phase,
          events: trip.events,
          asking: trip.phase === "ready" && !!trip.intent?.question,
          source: trip.source,
        }
      : null;
    post(window.parent, { type: "state", path: pathname, run, trip: phoneTrip, autopilot });
  }, [pathname, run, trip, autopilot]);

  useEffect(() => {
    if (!autopilot) return;
    const stop = () => {
      if (EXPLORE_ROUTES.has(pathname)) setAutopilot(false);
    };
    document.addEventListener("pointerdown", stop, true);
    document.addEventListener("keydown", stop, true);
    return () => {
      document.removeEventListener("pointerdown", stop, true);
      document.removeEventListener("keydown", stop, true);
    };
  }, [autopilot, pathname]);

  const intent = trip?.intent ?? null;
  const readyToSearch =
    trip?.phase === "ready" && !!intent && !intent.question && hasIndispensableInfo(intent);
  const result = run.result;
  useEffect(() => {
    if (!autopilot) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (pathname === "/trip/understood" && readyToSearch && run.status === "idle") {
      timer = setTimeout(() => {
        const current = readTrip();
        if (!current?.intent || readAgentRun().status !== "idle") return;
        const lang = readLang();
        const { profile } = readProfileState();
        startAgentRun({ intent: current.intent, profile: profileForLang(profile, lang), lang, jury: true, scenario: null }, null);
        router.push(withTripSearch("/trip/plan"));
      }, PAUSE.understood);
    } else if (pathname === "/trip/result" && run.status === "done" && result) {
      timer = setTimeout(() => {
        selectPackage(packageOptionId(result.recommended.flight_id, result.recommended.hotel_id));
        router.push(withTripSearch("/trip/package"));
      }, PAUSE.result);
    } else if (pathname === "/trip/package" && result) {
      timer = setTimeout(() => router.push(withTripSearch("/trip/ready")), PAUSE.package);
    } else if (pathname === "/trip/ready" && result) {
      timer = setTimeout(() => router.push(withTripSearch("/trip/file")), PAUSE.ready);
    }
    return () => clearTimeout(timer);
  }, [autopilot, pathname, readyToSearch, run.status, result, router]);

  const runId = run.run?.run_id ?? null;
  useEffect(() => {
    if (pathname !== "/trip/file" || !result || !runId || finishedFor.current === runId) return;
    const timer = setTimeout(() => {
      finishedFor.current = runId;
      post(window.parent, { type: "finished", run_id: runId });
    }, PAUSE.finished);
    return () => clearTimeout(timer);
  }, [pathname, result, runId]);

  return null;
}

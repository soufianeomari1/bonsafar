import { loadReplayRun } from "@/lib/agent/replay";
import { isJuryRequest } from "@/lib/jury/access";
import type { JuryStatus } from "@/lib/jury/protocol";
import { JURY_SCENARIOS } from "@/lib/jury/scenarios";
import { liveDisabled } from "@/lib/usage/guard";

/** Checked here so a missing voice note is not a 404 in the judges' console. */
async function hasAudio(origin: string, path: string): Promise<boolean> {
  try {
    const response = await fetch(`${origin}${path}`, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

/** What the judges' board can offer right now: live or replay only, each voice note and each recording. */
export async function GET(request: Request) {
  if (!(await isJuryRequest(request))) return Response.json({ error: "forbidden" }, { status: 403 });

  const origin = new URL(request.url).origin;
  const [disabled, audio, runs] = await Promise.all([
    liveDisabled(),
    Promise.all(JURY_SCENARIOS.map((scenario) => hasAudio(origin, scenario.audio))),
    Promise.all(JURY_SCENARIOS.map((scenario) => loadReplayRun(scenario.label).catch(() => null))),
  ]);
  const status: JuryStatus = {
    live: !disabled,
    audio: Object.fromEntries(JURY_SCENARIOS.map((scenario, index) => [scenario.id, audio[index]])),
    replays: Object.fromEntries(
      JURY_SCENARIOS.map((scenario, index) => {
        const run = runs[index];
        return [
          scenario.label,
          run
            ? {
                captured_at: run.prices_captured_at,
                total_ms: run.package.total_ms,
                cost_usd: run.package.cost_usd,
                legacy: run.legacy,
              }
            : null,
        ];
      }),
    ),
  };
  return Response.json(status, { headers: { "Cache-Control": "no-store" } });
}

import { loadReplayRun } from "@/lib/agent/replay";
import { isJuryRequest } from "@/lib/jury/access";
import { JURY_SCENARIOS } from "@/lib/jury/scenarios";
import { liveDisabled } from "@/lib/usage/guard";

export type JuryStatus = {
  live: boolean;
  replays: Record<
    string,
    { captured_at: string; total_ms: number; cost_usd: number; legacy: boolean } | null
  >;
};

/** What the judges' board can offer right now: live or replay only, and each recording. */
export async function GET(request: Request) {
  if (!(await isJuryRequest(request))) return Response.json({ error: "forbidden" }, { status: 403 });

  const [disabled, ...runs] = await Promise.all([
    liveDisabled(),
    ...JURY_SCENARIOS.map((scenario) => loadReplayRun(scenario.label).catch(() => null)),
  ]);
  const status: JuryStatus = {
    live: !disabled,
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

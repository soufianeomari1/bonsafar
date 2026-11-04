import { loadReplayRun } from "@/lib/agent/replay";
import { isJuryRequest } from "@/lib/jury/access";
import { JURY_LABELS } from "@/lib/jury/scenarios";

/**
 * The recorded run of a jury scenario in one JSON body. The phone loads it at
 * the start of a live run, so the switch to replay still works when the
 * network drops in the middle.
 */
export async function GET(request: Request) {
  if (!(await isJuryRequest(request))) return Response.json({ error: "forbidden" }, { status: 403 });
  const scenario = new URL(request.url).searchParams.get("scenario") ?? "";
  if (!JURY_LABELS.includes(scenario)) return Response.json({ error: "invalid_request" }, { status: 400 });

  const run = await loadReplayRun(scenario).catch(() => null);
  if (!run) return Response.json({ error: "replay_unavailable" }, { status: 404 });
  return Response.json(
    {
      id: run.id,
      created_at: run.created_at,
      prices_captured_at: run.prices_captured_at,
      legacy: run.legacy,
      intent: run.intent,
      package: { total_ms: run.package.total_ms, cost_usd: run.package.cost_usd },
      stream: run.stream,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

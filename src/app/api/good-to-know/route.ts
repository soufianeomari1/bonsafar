import { z } from "zod";
import { RunLog } from "@/lib/ai/events";
import { fetchGoodToKnow } from "@/lib/ai/good-to-know";

export const maxDuration = 30;

const Body = z.object({
  run_id: z.string().regex(/^[\w-]{1,64}$/).optional(),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
  origin: z.string().trim().min(1).max(80),
  month: z.string().trim().min(1).max(40),
  script: z.enum(["latn", "arab"]).default("latn"),
});

/** Four practical notes from Muse Spark. Amounts of money are rejected. */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const body = Body.safeParse(json);
  if (!body.success) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const log = new RunLog(body.data.run_id);
  try {
    const notes = await fetchGoodToKnow(
      {
        city: body.data.city,
        country: body.data.country,
        origin: body.data.origin,
        month: body.data.month,
        script: body.data.script,
      },
      log,
    );
    return Response.json({ ok: true, notes, events: log.list() });
  } catch {
    return Response.json({ ok: false, error: "good_to_know_failed", events: log.list() }, { status: 502 });
  }
}

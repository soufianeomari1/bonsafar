import { z } from "zod";
import { after } from "next/server";
import { RunLog } from "@/lib/ai/events";
import { recordUsage } from "@/lib/usage/guard";
import { generatePosterImage, posterPrompt, storePoster } from "@/lib/ai/image";

export const maxDuration = 60;

const Body = z.object({
  run_id: z.string().regex(/^[\w-]{1,64}$/).optional(),
  city: z.string().trim().min(1).max(80),
  country: z.string().trim().min(1).max(80),
});

/**
 * Muse Image, one vertical illustration, no text in the picture.
 * The bucket upload stays off until POSTERS_BUCKET_READY=1.
 */
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
  after(() => recordUsage(log.totalCostUsd()));
  const prompt = posterPrompt(body.data.city, body.data.country);
  try {
    const image = await generatePosterImage(prompt, log);
    let url: string | null = null;
    if (process.env.POSTERS_BUCKET_READY === "1") {
      const bytes = Buffer.from(image.b64, "base64");
      const name = `${body.data.run_id ?? "poster"}-${Date.now().toString(36)}.webp`;
      url = await storePoster(bytes, name);
    }
    return Response.json({
      ok: true,
      media_type: image.mediaType,
      b64: image.b64,
      url,
      events: log.list(),
    });
  } catch {
    return Response.json({ ok: false, error: "poster_failed", events: log.list() }, { status: 502 });
  }
}

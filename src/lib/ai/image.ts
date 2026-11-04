import { serverEnv } from "@/lib/env";
import { metaClient } from "@/lib/ai/client";
import type { RunLog } from "@/lib/ai/events";
import { PRICING } from "@/lib/ai/pricing";

/**
 * Portrait prompt for Muse Image. The words stay out of the picture:
 * labels are drawn in HTML afterwards.
 */
export function posterPrompt(city: string, country: string): string {
  return [
    `A vertical travel illustration of ${city}, ${country}, at golden hour.`,
    "Warm luminous sky, soft clouds, the skyline and landmarks drawn as simple friendly shapes.",
    "Bright, warm, hopeful travel-poster illustration, painterly, not a photograph.",
    "No text, no letters, no numbers, no logos, no watermarks, no writing on signs or flags, no recognizable people, no faces.",
  ].join(" ");
}

export type GeneratedImage = {
  b64: string;
  mediaType: string;
};

type ImagePayload = {
  data?: { b64_json?: string | null }[];
};

/**
 * One-off text-to-image on POST /v1/images/generations (OpenAI-compatible).
 * `size` sets the aspect ratio, not the exact pixels. 1152x2048 is 9:16
 * and both edges are divisible by 16. `output_format: webp` and
 * `response_format: b64_json` are the documented fields.
 * Cost is the flat per-image price, measured latency included.
 */
export const POSTER_SIZE = "1152x2048";

export async function generatePosterImage(prompt: string, log: RunLog): Promise<GeneratedImage> {
  const env = serverEnv();
  const started = performance.now();
  try {
    const response = (await metaClient().images.generate(
      {
        model: env.MODEL_IMAGE,
        prompt,
        n: 1,
        size: POSTER_SIZE,
        response_format: "b64_json",
        output_format: "webp",
      },
      { timeout: 55_000, maxRetries: 0 },
    )) as ImagePayload;
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("Image response had no data.");
    log.add({
      step: "poster",
      model: env.MODEL_IMAGE,
      latency_ms: Math.round(performance.now() - started),
      cost_usd: PRICING.image.usdPerImage,
      note: "1 image, webp, 9:16",
    });
    return { b64, mediaType: "image/webp" };
  } catch (error) {
    log.add({
      step: "poster",
      model: env.MODEL_IMAGE,
      latency_ms: Math.round(performance.now() - started),
      status: "error",
      note: error instanceof Error ? error.message.slice(0, 200) : "image failed",
    });
    throw error;
  }
}

/**
 * Uploads a poster to the public Supabase bucket `posters`.
 * Runs only when POSTERS_BUCKET_READY=1, after the bucket SQL is applied.
 */
export async function storePoster(bytes: Uint8Array, path: string): Promise<string | null> {
  if (process.env.POSTERS_BUCKET_READY !== "1") return null;
  const { adminClient } = await import("@/lib/supabase/admin");
  const supabase = adminClient();
  const { error } = await supabase.storage.from("posters").upload(path, bytes, {
    contentType: "image/webp",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("posters").getPublicUrl(path);
  return data.publicUrl;
}

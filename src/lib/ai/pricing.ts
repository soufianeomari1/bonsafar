import { serverEnv } from "@/lib/env";

/**
 * Prices from docs/meta-model-api.md (Meta dashboard, 2026-11-03).
 * Keyed by role, not by model id: the ids live in env vars only.
 */
export const PRICING = {
  /** Muse Voice Transcribe, billed per second of processed audio. */
  transcribe: { usdPerAudioHour: 0.18 },
  /** Muse Spark, USD per 1M tokens. Reasoning tokens are billed as output. */
  spark: { input: 1.25, cachedInput: 0.15, output: 4.25 },
  /** Muse Wonder, USD per 1M tokens. */
  wonder: { input: 4.0, cachedInput: 0.2, output: 20.0 },
  /** Muse Image, USD per image. */
  image: { usdPerImage: 0.01 },
} as const;

/** web_search tool on text models, on top of tokens (dev.meta.ai/docs/pricing-rate-limits). */
export const WEB_SEARCH_USD_PER_QUERY = 2.5 / 1000;

export type ModelRole = keyof typeof PRICING;

export type TokenUsage = {
  /** Prompt tokens, cached ones included. */
  tokensIn: number;
  cachedIn: number;
  /** Completion tokens, reasoning included. */
  tokensOut: number;
};

/** Maps a model id from the env back to the role that sets its price. */
export function roleOf(model: string): ModelRole | null {
  const env = serverEnv();
  if (model === env.MODEL_TRANSCRIBE) return "transcribe";
  if (model === env.MODEL_SPARK || model === env.MODEL_SPARK_AUDIO) return "spark";
  if (model === env.MODEL_WONDER) return "wonder";
  if (model === env.MODEL_IMAGE) return "image";
  return null;
}

export function tokenCostUsd(model: string, usage: TokenUsage): number {
  const role = roleOf(model);
  if (role !== "spark" && role !== "wonder") return 0;
  const price = PRICING[role];
  const uncached = Math.max(0, usage.tokensIn - usage.cachedIn);
  return (
    (uncached * price.input +
      usage.cachedIn * price.cachedInput +
      usage.tokensOut * price.output) /
    1_000_000
  );
}

/** Meta bills processed audio rounded down to whole seconds. */
export function transcribeCostUsd(audioSeconds: number): number {
  return (Math.floor(audioSeconds) * PRICING.transcribe.usdPerAudioHour) / 3600;
}

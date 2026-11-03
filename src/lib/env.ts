import { z } from "zod";

/**
 * Environment variables, validated with zod.
 *
 * Two separate surfaces:
 * - `publicEnv`: the `NEXT_PUBLIC_*` values, inlined at build time, safe in the browser.
 * - `serverEnv()`: everything else, read lazily so a missing secret fails with a clear
 *   message inside the route that needs it instead of breaking `next build`.
 */

const serverSchema = z.object({
  // Meta Model API
  META_API_KEY: z.string().min(1),
  META_API_BASE_URL: z.url().default("https://api.meta.ai/v1"),
  MODEL_TRANSCRIBE: z.string().min(1),
  MODEL_SPARK: z.string().min(1),
  MODEL_SPARK_AUDIO: z.string().min(1),
  MODEL_WONDER: z.string().min(1),
  MODEL_IMAGE: z.string().min(1),

  // Supabase, server side only
  SUPABASE_SECRET_KEY: z.string().min(1),

  // Official MCP servers for live travel data
  KIWI_MCP_URL: z.url(),
  TRIVAGO_MCP_URL: z.url(),

  // Bank Al-Maghrib reference rate, entered by hand
  EUR_MAD_RATE: z.coerce.number().positive(),
  EUR_MAD_DATE: z.iso.date(),

  // App settings
  DOTATION_MAD: z.coerce.number().positive(),
  SPEND_LIMIT_USD: z.coerce.number().positive(),
  JURY_REPLAY_AFTER_MS: z.coerce.number().int().positive(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

/**
 * `process.env` is not a plain object in the browser bundle: every
 * `NEXT_PUBLIC_*` value has to be read through a literal member expression so
 * Next.js can inline it.
 */
const rawPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};

function describe(error: z.ZodError, scope: string): string {
  const lines = error.issues.map(
    (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`
  );
  return [
    `Invalid ${scope} environment variables:`,
    ...lines,
    "Copy .env.example to .env.local and fill in the missing values.",
  ].join("\n");
}

let serverCache: ServerEnv | null = null;

/**
 * Server-only environment. Call it inside a route handler, a server action or a
 * server component, never at module scope of a file that the browser can reach.
 */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() was called in the browser. Keep secrets server side.");
  }
  if (serverCache) return serverCache;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(describe(parsed.error, "server"));
  }
  serverCache = parsed.data;
  return serverCache;
}

let publicCache: PublicEnv | null = null;

/** Public environment, available on both sides. Throws only when actually used. */
export function publicEnv(): PublicEnv {
  if (publicCache) return publicCache;

  const parsed = publicSchema.safeParse(rawPublicEnv);
  if (!parsed.success) {
    throw new Error(describe(parsed.error, "public"));
  }
  publicCache = parsed.data;
  return publicCache;
}

/** The site origin, used for OAuth redirects. Falls back to the live domain. */
export function siteUrl(): string {
  return rawPublicEnv.NEXT_PUBLIC_SITE_URL ?? "https://bonsafar.com";
}

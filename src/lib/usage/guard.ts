import { serverEnv } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";

/**
 * Spend cap and live-run limits, server side only. Tables and functions:
 * supabase/schema.sql (usage_daily, usage_ip_hourly). Until they exist every
 * check lets the run through and every write is a no-op: the demo must not
 * break because a migration is late.
 */

export const LIVE_RUNS_PER_HOUR = { user: 10, jury: 30 } as const;

export type LiveBlock = "rate_limited" | "spend_limit";

const encoder = new TextEncoder();

/** First hop of x-forwarded-for (set by Vercel), then x-real-ip. */
function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || null;
}

/** HMAC with a server-only salt: the address itself is never stored. */
async function hashIp(ip: string, scope: "user" | "jury"): Promise<string> {
  const salt = process.env.IP_HASH_SALT?.trim() || `derived:${serverEnv().SUPABASE_SECRET_KEY}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${scope}:${ip}`)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Cumulated cost of every live call, or null when the table is not there yet. */
export async function spentUsd(): Promise<number | null> {
  try {
    const { data, error } = await adminClient().from("usage_daily").select("cost_usd");
    if (error || !data) return null;
    return data.reduce((sum, row) => sum + Number((row as { cost_usd: number | string }).cost_usd ?? 0), 0);
  } catch {
    return null;
  }
}

export async function liveDisabled(): Promise<boolean> {
  const spent = await spentUsd();
  return spent !== null && spent >= serverEnv().SPEND_LIMIT_USD;
}

/**
 * Before a live agent run: the spend cap first (it applies to everyone), then
 * one slot of the hourly per-IP budget, taken atomically by the database.
 */
export async function admitLiveRun(request: Request, jury: boolean): Promise<LiveBlock | null> {
  if (await liveDisabled()) return "spend_limit";
  const ip = clientIp(request);
  if (!ip) return null;
  try {
    const scope = jury ? "jury" : "user";
    const { data, error } = await adminClient().rpc("usage_take_run", {
      p_ip_hash: await hashIp(ip, scope),
      p_limit: LIVE_RUNS_PER_HOUR[scope],
    });
    if (error) return null;
    return data === false ? "rate_limited" : null;
  } catch {
    return null;
  }
}

/** Adds the measured cost of a live request (and its agent runs) to today's row. */
export async function recordUsage(costUsd: number, runs = 0): Promise<void> {
  if (!(costUsd > 0) && runs <= 0) return;
  try {
    await adminClient().rpc("usage_add", { p_cost: Math.max(0, costUsd), p_runs: Math.max(0, runs) });
  } catch {
    // Table not created yet: the counter starts once the migration lands.
  }
}

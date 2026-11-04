// Opens /jury?k=<JURY_ACCESS_KEY> on a running server and returns the signed
// jury cookie as a Cookie header. The key comes from the environment or
// .env.local and is never printed.
import { existsSync, readFileSync } from "node:fs";

function readKey() {
  if (process.env.JURY_ACCESS_KEY) return process.env.JURY_ACCESS_KEY.trim();
  if (!existsSync(".env.local")) return null;
  const match = /^JURY_ACCESS_KEY=(.*)$/m.exec(readFileSync(".env.local", "utf8"));
  return match?.[1].trim() || null;
}

export async function juryCookie(base) {
  const key = readKey();
  if (!key) return null;
  const response = await fetch(`${base}/jury?k=${encodeURIComponent(key)}`, { redirect: "manual" });
  const cookie = response.headers
    .getSetCookie()
    .map((line) => line.split(";")[0])
    .find((pair) => pair.startsWith("bs_jury="));
  return cookie ?? null;
}

import { JURY_COOKIE, JURY_MAX_AGE_S } from "./flags";

/**
 * Jury access, server side only (proxy and route handlers). Web Crypto, so it
 * runs the same in the proxy and in Node route handlers. The key itself never
 * leaves the server and is never logged.
 */

const encoder = new TextEncoder();

function accessKey(): string | null {
  const key = process.env.JURY_ACCESS_KEY?.trim();
  return key && key.length >= 12 ? key : null;
}

async function hmac(key: string, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message)));
}

function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/.test(value)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i += 1) bytes[i] = parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** Both sides go through the HMAC first: same length, compared in constant time. */
export async function isJuryKey(candidate: string): Promise<boolean> {
  const key = accessKey();
  if (!key || !candidate) return false;
  const [given, expected] = await Promise.all([hmac(key, `key:${candidate}`), hmac(key, `key:${key}`)]);
  return sameBytes(given, expected);
}

/** `<expiry in s>.<hex HMAC>`: no state on the server, rotating the key revokes every cookie. */
export async function signJuryToken(now = Date.now()): Promise<string | null> {
  const key = accessKey();
  if (!key) return null;
  const expires = Math.floor(now / 1000) + JURY_MAX_AGE_S;
  return `${expires}.${toHex(await hmac(key, `jury:${expires}`))}`;
}

export async function verifyJuryToken(token: string | null | undefined, now = Date.now()): Promise<boolean> {
  const key = accessKey();
  if (!key || !token) return false;
  const match = /^(\d{10})\.([0-9a-f]{64})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires * 1000 <= now) return false;
  const given = fromHex(match[2]);
  if (!given) return false;
  return sameBytes(given, await hmac(key, `jury:${expires}`));
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return null;
}

/** For route handlers: true only with a valid signed jury cookie. */
export async function isJuryRequest(request: Request): Promise<boolean> {
  return verifyJuryToken(readCookie(request.headers.get("cookie"), JURY_COOKIE));
}

export const JURY_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: JURY_MAX_AGE_S,
} as const;

export const JURY_UI_COOKIE_OPTIONS = { ...JURY_COOKIE_OPTIONS, httpOnly: false } as const;

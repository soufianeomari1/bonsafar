// High-quality film captures for the demo edit.
// CDP Page.startScreencast (JPEG q=90) plus an ffmpeg concat of the real
// frame timestamps. Playwright's recordVideo is intentionally not used.
//
// The jury key is read from JURY_ACCESS_KEY, or from .env.local when the
// shell did not export it (same source the dev server already loaded).
// It is never printed, never put in a file name, and never written to a log.
//
// Usage: node scripts/film/capture.mjs [--mobile]
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm, readdir, stat } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const ROOT = process.cwd();
const OUT = path.join(ROOT, "exports", "film");
const WORK = path.join(OUT, ".work");

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1.5 };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2 };

function readKey() {
  const fromEnv = process.env.JURY_ACCESS_KEY?.trim();
  if (fromEnv) return fromEnv;
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return null;
  const match = /^JURY_ACCESS_KEY=(.*)$/m.exec(readFileSync(file, "utf8"));
  if (!match) return null;
  let value = match[1].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return value || null;
}

function installRedaction(secret) {
  if (!secret) return;
  for (const stream of [process.stdout, process.stderr]) {
    const write = stream.write.bind(stream);
    stream.write = (chunk, encoding, callback) => {
      const text = typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      if (text.includes(secret)) return write(text.split(secret).join("[redacted]"), encoding, callback);
      return write(chunk, encoding, callback);
    };
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let ffmpegBin = "";

function findFfmpeg() {
  if (ffmpegBin) return ffmpegBin;
  const local = process.env.LOCALAPPDATA;
  const roots = [local ? path.join(local, "Microsoft", "WinGet", "Packages") : null, "C:\\ffmpeg", "C:\\tools"].filter(Boolean);
  const stack = [...roots];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === "ffmpeg.exe") {
        ffmpegBin = full;
        return full;
      }
      if (entry.isDirectory() && entry.name !== "node_modules") stack.push(full);
    }
  }
  ffmpegBin = "ffmpeg";
  return ffmpegBin;
}

function probeDuration(file) {
  const ffmpeg = findFfmpeg();
  const ffprobe = ffmpeg.replace(/ffmpeg(\.exe)?$/i, "ffprobe$1");
  return new Promise((resolve) => {
    const child = spawn(ffprobe, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], {
      stdio: ["ignore", "pipe", "ignore"],
    });
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.on("close", () => {
      const value = Number(out.trim());
      resolve(Number.isFinite(value) ? value : null);
    });
    child.on("error", () => resolve(null));
  });
}

function jpegSize(file) {
  const buf = readFileSync(file);
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    const size = buf.readUInt16BE(offset + 2);
    offset += 2 + size;
  }
  return null;
}

function runFfmpeg(ffmpeg, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpeg, args, { stdio: ["ignore", "pipe", "pipe"] });
    let err = "";
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
      if (err.length > 8000) err = err.slice(-8000);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(err);
      else reject(new Error(`ffmpeg exited ${code}: ${err.slice(-500)}`));
    });
  });
}

class Recorder {
  constructor(page, id, scale) {
    this.page = page;
    this.id = id;
    this.scale = scale;
    this.dir = path.join(WORK, id);
    this.frames = [];
    this.pending = [];
    this.client = null;
    this.lastFrameAt = 0;
    this.startedAt = 0;
    this.keepAlive = null;
  }

  async start() {
    await mkdir(this.dir, { recursive: true });
    this.client = await this.page.context().newCDPSession(this.page);
    const { width, height } = this.page.viewportSize();
    this.opts = {
      format: "jpeg",
      quality: 90,
      everyNthFrame: 1,
      maxWidth: Math.round(width * this.scale),
      maxHeight: Math.round(height * this.scale),
    };
    this.client.on("Page.screencastFrame", (event) => {
      const index = this.frames.length;
      const file = path.join(this.dir, `f${String(index).padStart(6, "0")}.jpg`);
      this.frames.push({ timestamp: event.metadata?.timestamp ?? index / 30, file });
      this.lastFrameAt = Date.now();
      this.pending.push(writeFile(file, Buffer.from(event.data, "base64")));
      this.client.send("Page.screencastFrameAck", { sessionId: event.sessionId }).catch(() => {});
    });
    await this.client.send("Page.startScreencast", this.opts);
    this.startedAt = Date.now();
    this.lastFrameAt = Date.now();
    this.keepAlive = setInterval(() => {
      if (Date.now() - this.lastFrameAt > 700) {
        this.client.send("Page.startScreencast", this.opts).catch(() => {});
      }
    }, 400);
  }

  async still(name) {
    const file = path.join(OUT, name);
    await this.page.screenshot({ path: file, type: "png", animations: "allow" });
    return file;
  }

  async stop(filename) {
    clearInterval(this.keepAlive);
    await this.client.send("Page.stopScreencast").catch(() => {});
    await Promise.all(this.pending);
    await this.client.detach().catch(() => {});
    if (this.frames.length < 2) throw new Error(`${this.id}: not enough frames (${this.frames.length})`);

    const frames = this.frames
      .filter((frame) => existsSync(frame.file))
      .sort((a, b) => a.timestamp - b.timestamp);
    const deltas = [];
    for (let i = 1; i < frames.length; i += 1) {
      const delta = frames[i].timestamp - frames[i - 1].timestamp;
      if (delta > 0 && delta < 2) deltas.push(delta);
    }
    deltas.sort((a, b) => a - b);
    const fallback = deltas[Math.floor(deltas.length / 2)] ?? 1 / 30;

    const lines = ["ffconcat version 1.0"];
    for (let i = 0; i < frames.length; i += 1) {
      const next = frames[i + 1];
      let duration = next ? next.timestamp - frames[i].timestamp : fallback;
      if (!Number.isFinite(duration) || duration <= 0) duration = fallback;
      if (duration > 2) duration = 2;
      const file = frames[i].file.replace(/\\/g, "/");
      lines.push(`file '${file}'`);
      lines.push(`duration ${duration.toFixed(6)}`);
    }
    const last = frames[frames.length - 1].file.replace(/\\/g, "/");
    lines.push(`file '${last}'`);
    const list = path.join(this.dir, "frames.ffconcat");
    await writeFile(list, lines.join("\n"));

    const out = path.join(OUT, filename);
    const ffmpeg = findFfmpeg();
    await runFfmpeg(ffmpeg, [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      "-fps_mode",
      "cfr",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-an",
      "-movflags",
      "+faststart",
      out,
    ]);
    const size = jpegSize(frames[Math.floor(frames.length / 2)].file);
    const info = await stat(out);
    const durationSec = await probeDuration(out);
    await rm(this.dir, { recursive: true, force: true });
    return {
      file: filename,
      bytes: info.size,
      frames: frames.length,
      width: size?.width ?? null,
      height: size?.height ?? null,
      durationSec,
      wallSec: (Date.now() - this.startedAt) / 1000,
    };
  }
}

async function setCursor(page, x, y, visible) {
  await page.evaluate(
    ({ x, y, visible }) => {
      const el = document.getElementById("film-cursor");
      if (!el) return;
      el.style.opacity = visible ? "1" : "0";
      el.style.transform = `translate(${x}px, ${y}px)`;
    },
    { x, y, visible },
  );
}

async function glide(page, x, y, cursor) {
  const steps = 28;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const nx = cursor.x + (x - cursor.x) * e;
    const ny = cursor.y + (y - cursor.y) * e;
    cursor.x = nx;
    cursor.y = ny;
    await page.mouse.move(nx, ny);
    await setCursor(page, nx, ny, true);
    await sleep(36);
  }
}

async function glideClick(page, x, y, cursor) {
  await glide(page, x, y, cursor);
  await page.mouse.down();
  await sleep(90);
  await page.mouse.up();
  await sleep(1000);
}

async function pointOf(locator) {
  const box = await locator.boundingBox();
  if (!box) return null;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function revealInAside(page, locator) {
  const delta = await locator.evaluate((el) => {
    const scroller = el.closest("aside");
    if (!scroller) return 0;
    const er = el.getBoundingClientRect();
    const sr = scroller.getBoundingClientRect();
    if (er.top >= sr.top + 12 && er.bottom <= sr.bottom - 12) return 0;
    return er.top - (sr.top + sr.height / 2) + er.height / 2;
  });
  if (!delta) return;
  const steps = 22;
  for (let i = 0; i < steps; i += 1) {
    await locator.evaluate((el, dy) => el.closest("aside")?.scrollBy(0, dy), delta / steps);
    await sleep(40);
  }
  await sleep(250);
}

async function clickRole(page, name, nth, cursor) {
  const locator = page.getByRole("button", { name, exact: true }).nth(nth);
  await locator.waitFor({ state: "visible", timeout: 20_000 });
  await revealInAside(page, locator);
  const point = await pointOf(locator);
  if (!point) throw new Error(`No box for button ${name}`);
  await glideClick(page, point.x, point.y, cursor);
}

const CURSOR_SCRIPT = (initialLang) => {
  const chosen = sessionStorage.getItem("film.lang") || initialLang;
  try {
    localStorage.setItem("bonsafar.lang", chosen);
  } catch {
    // The language still applies for this document via the fallback below.
  }
  const paint = () => {
    if (document.getElementById("film-cursor")) return;
    const style = document.createElement("style");
    style.textContent = `
      #film-cursor {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 2147483646;
        width: 28px;
        height: 28px;
        pointer-events: none;
        opacity: 0;
        transform: translate(-40px, -40px);
        filter: drop-shadow(0 1px 1px rgba(0,0,0,.35));
      }
    `;
    const el = document.createElement("div");
    el.id = "film-cursor";
    el.innerHTML =
      '<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M5 3 L5 22 L10.2 16.6 L14.2 24 L17.2 22.6 L13.1 15.2 L20.5 15.2 Z" fill="#0B0B0F" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.append(style, el);
  };
  if (document.documentElement) paint();
  else document.addEventListener("DOMContentLoaded", paint);
};

async function openJuryGate(page, key) {
  const url = new URL("/jury", BASE);
  url.searchParams.set("k", key);
  try {
    await page.goto(url.href, { waitUntil: "domcontentloaded", timeout: 45_000 });
  } catch {
    throw new Error("Jury gate navigation failed");
  }
  let landed;
  try {
    landed = new URL(page.url());
  } catch {
    throw new Error("Jury gate did not settle");
  }
  if (landed.pathname !== "/jury" || landed.search) throw new Error("Jury gate did not accept the key");
  // The board can render the heading twice, and on a phone viewport it sits
  // outside the visible frame. The cookie is already set once the key is gone
  // from the URL. Attached is enough.
  await page.getByRole("heading", { name: /Meet Fatima/ }).first().waitFor({ state: "attached", timeout: 20_000 });
}

async function scrapeBoard(page) {
  return page.evaluate(() => {
    const iframe = document.querySelector("iframe");
    const doc = iframe?.contentDocument;
    const path = doc ? new URL(doc.location.href).pathname : "";
    const h1 = doc?.querySelector("h1")?.innerText?.replace(/\s+/g, " ").trim() ?? "";
    const end = document.querySelector("#end-title");
    const endText = end?.closest("[role='dialog']")?.innerText?.replace(/\s+\n/g, "\n").trim() ?? "";
    let total = "";
    let tip = "";
    let tipVisible = false;
    if (doc && path === "/trip/package") {
      total = doc.querySelector(".text-2xl")?.innerText?.replace(/\s+/g, " ").trim() ?? "";
      const nodes = [...doc.querySelectorAll("p, span, h2, h3")];
      const title = nodes.find((el) => /safar.?s tip/i.test(el.textContent ?? ""));
      const block = title?.parentElement?.parentElement;
      tip = block?.innerText?.replace(/\s+/g, " ").trim() ?? "";
      if (title) {
        const rect = title.getBoundingClientRect();
        tipVisible = rect.bottom > 0 && rect.top < (doc.documentElement?.clientHeight ?? 844) && rect.height > 0;
      }
    }
    const leafReplay = (root) => {
      if (!root) return [];
      const hits = [];
      const all = root.querySelectorAll("*");
      for (const el of all) {
        if (el.children.length) continue;
        const text = (el.textContent ?? "").trim();
        if (!/^replay$/i.test(text)) continue;
        const rect = el.getBoundingClientRect();
        const style = root.defaultView?.getComputedStyle(el);
        if (!style || rect.width < 2 || rect.height < 2) continue;
        if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
        hits.push(text);
      }
      return hits;
    };
    return {
      path,
      h1,
      end: !!end,
      endText,
      total,
      tip,
      tipVisible,
      replayBadges: [...leafReplay(document), ...leafReplay(doc)],
    };
  });
}

async function personalData(page) {
  return page.evaluate(() => {
    const read = (root) => (root?.body?.innerText ?? "").toLowerCase();
    const iframe = document.querySelector("iframe");
    const text = `${read(document)} ${read(iframe?.contentDocument)}`;
    if (text.includes("soufiane")) return "name";
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return "email";
    return "";
  });
}

function pushSample(samples, startedAt, snap) {
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const row = {
    sec,
    path: snap.path,
    h1: snap.h1,
    end: snap.end,
    replay: snap.replayBadges,
  };
  const prev = samples[samples.length - 1];
  if (!prev || prev.sec !== sec) samples.push(row);
  else samples[samples.length - 1] = row;
}

async function waitForLive(page, recorder, samples, facts, cursor, options) {
  const deadline = Date.now() + 8 * 60 * 1000;
  let endSince = 0;
  let asked = false;
  let packageShot = false;
  let planShot = false;
  while (Date.now() < deadline) {
    const leak = await personalData(page);
    if (leak) throw new Error(`Personal data on screen (${leak}); stopped`);
    const snap = await scrapeBoard(page);
    pushSample(samples, recorder.startedAt, snap);
    if (snap.total) facts.total = snap.total;
    if (snap.tip) {
      facts.tip = snap.tip;
      facts.tipVisible = snap.tipVisible;
    }
    if (snap.end && snap.endText) facts.endText = snap.endText;
    if (snap.replayBadges.length) facts.replayBadges = snap.replayBadges;

    if (!planShot && snap.path === "/trip/plan") {
      planShot = true;
      await recorder.still(options.planStill);
    }
    if (!packageShot && snap.path === "/trip/package" && snap.total) {
      packageShot = true;
      await recorder.still(options.packageStill);
      await scrollPhone(page, 640, 2200);
      const after = await scrapeBoard(page);
      if (after.tip) {
        facts.tip = after.tip;
        facts.tipVisible = after.tipVisible;
      }
      if (options.tipStill) await recorder.still(options.tipStill);
    }
    if (!asked && snap.path === "/trip/understood") {
      const point = await questionPoint(page);
      if (point) {
        asked = true;
        facts.quickReply = point.text;
        if (options.questionStill) await recorder.still(options.questionStill);
        await glideClick(page, point.x, point.y, cursor);
        facts.quickReplyClicked = true;
      }
    }
    if (snap.end) {
      if (!endSince) {
        endSince = Date.now();
        await recorder.still(options.endStill);
      }
      if (Date.now() - endSince >= 4000) return;
    }
    await sleep(250);
  }
  throw new Error("End card did not appear within 8 minutes");
}

async function questionPoint(page) {
  return page.evaluate(() => {
    const iframe = document.querySelector("iframe");
    const doc = iframe?.contentDocument;
    if (!doc || !iframe) return null;
    const button = doc.querySelector("section .grid button:not([disabled])");
    if (!button) return null;
    const text = button.innerText.replace(/\s+/g, " ").trim();
    if (!text) return null;
    button.scrollIntoView({ block: "center", inline: "nearest" });
    const rect = button.getBoundingClientRect();
    const ir = iframe.getBoundingClientRect();
    const sx = ir.width / iframe.clientWidth;
    const sy = ir.height / iframe.clientHeight;
    return {
      x: ir.x + (rect.x + rect.width / 2) * sx,
      y: ir.y + (rect.y + rect.height / 2) * sy,
      text,
    };
  });
}

async function scrollPhone(page, pixels, ms) {
  const steps = Math.max(8, Math.round(ms / 50));
  for (let i = 0; i < steps; i += 1) {
    const moved = await page.evaluate((dy) => {
      const doc = document.querySelector("iframe")?.contentDocument;
      if (!doc) return false;
      const scroller = [...doc.querySelectorAll(".overflow-y-auto")].find((el) => el.scrollHeight > el.clientHeight + 24);
      if (!scroller) return false;
      scroller.scrollTop += dy;
      return true;
    }, pixels / steps);
    if (!moved) return;
    await sleep(ms / steps);
  }
}

async function scrollMain(page, pixels, ms) {
  const steps = Math.max(8, Math.round(ms / 50));
  for (let i = 0; i < steps; i += 1) {
    const moved = await page.evaluate((dy) => {
      const root = document.querySelector("[data-phone-root]") ?? document.body;
      const scroller = [...root.querySelectorAll(".overflow-y-auto")].find((el) => el.scrollHeight > el.clientHeight + 24);
      if (!scroller) return false;
      scroller.scrollTop += dy;
      return true;
    }, pixels / steps);
    if (!moved) return;
    await sleep(ms / steps);
  }
}

async function mobileReplayBadges(page) {
  return page.evaluate(() => {
    const hits = [];
    const all = document.querySelectorAll("*");
    for (const el of all) {
      if (el.children.length) continue;
      const text = (el.textContent ?? "").trim();
      if (!/^replay$/i.test(text)) continue;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width < 2 || rect.height < 2) continue;
      if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0) continue;
      hits.push({ text, top: Math.round(rect.top), left: Math.round(rect.left) });
    }
    return hits;
  });
}

async function setFilmLang(page, lang) {
  await page.evaluate((value) => sessionStorage.setItem("film.lang", value), lang);
}

async function assertGuest(page) {
  const leak = await personalData(page);
  if (leak) throw new Error(`Personal data on screen (${leak}); stopped`);
}

function contextOptions(viewport) {
  return {
    viewport: { width: viewport.width, height: viewport.height },
    // Bitmap scale comes from --force-device-scale-factor. Setting it here as
    // well makes the CDP screencast stay at CSS pixels.
    deviceScaleFactor: 1,
    locale: "en-GB",
    timezoneId: "Africa/Casablanca",
    reducedMotion: "no-preference",
    colorScheme: "light",
    isMobile: viewport.width < 500,
    hasTouch: viewport.width < 500,
  };
}

async function adopt(id, file) {
  const full = path.join(OUT, file);
  if (!existsSync(full)) return null;
  const info = await stat(full);
  const durationSec = await probeDuration(full);
  console.log(`SKIP ${id} already encoded (${durationSec}s)`);
  return { id, file, bytes: info.size, durationSec, adopted: true };
}

function launchScaled(scale) {
  return chromium.launch({
    headless: true,
    args: [`--force-device-scale-factor=${scale}`, "--high-dpi-support=1"],
  });
}

async function main() {
  const mobileOnly = process.argv.includes("--mobile");
  const key = readKey();
  installRedaction(key);
  if (!key) {
    console.error("JURY_ACCESS_KEY is missing from the environment.");
    process.exit(1);
  }

  await mkdir(OUT, { recursive: true });
  await rm(WORK, { recursive: true, force: true });
  const notes = { takes: [], errors: [], d2: null, m3ReplayBadge: null };
  if (mobileOnly && existsSync(path.join(OUT, "notes.json"))) {
    try {
      const previous = JSON.parse(readFileSync(path.join(OUT, "notes.json"), "utf8"));
      notes.takes = (previous.takes ?? []).filter((take) => !String(take.id ?? "").startsWith("M"));
      notes.errors = (previous.errors ?? []).filter((item) => !String(item.label ?? "").startsWith("M"));
      notes.d2 = previous.d2 ?? null;
      notes.d4 = previous.d4;
      notes.m3ReplayBadge = previous.m3ReplayBadge ?? null;
    } catch {
      // A broken notes file should not block the takes.
    }
  }
  const saveNotes = () => writeFile(path.join(OUT, "notes.json"), JSON.stringify(notes, null, 2));
  const opened = [];

  const runStep = async (label, fn) => {
    try {
      const value = await fn();
      await saveNotes();
      return value;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${label} ${message}`);
      notes.errors.push({ label, message });
      await saveNotes();
      return null;
    }
  };

  try {
    if (!mobileOnly) {
    const browser = await launchScaled(DESKTOP.deviceScaleFactor);
    opened.push(browser);
    const desktop = await browser.newContext(contextOptions(DESKTOP));
    await desktop.addInitScript(CURSOR_SCRIPT, "en");
    const page = await desktop.newPage();
    const cursor = { x: 160, y: 120 };
    await openJuryGate(page, key);
    await assertGuest(page);

    const d1 = (await adopt("D1", "D1-board.mp4")) ?? (await runStep("D1", () => takeD1(page)));
    if (d1) notes.takes.push(d1);

    const d2 =
      (await adopt("D2", "D2-istanbul-live.mp4")) ??
      (await runStep("D2", () =>
        takeLive(page, cursor, {
          id: "D2",
          file: "D2-istanbul-live.mp4",
          nth: 0,
          planStill: "D2-02-plan.png",
          packageStill: "D2-03-package.png",
          endStill: "D2-04-end.png",
          clickStill: "D2-01-click.png",
        }),
      ));
    if (d2?.samples) {
      notes.d2 = { samples: d2.samples, facts: d2.facts };
      notes.takes.push(d2.meta);
    } else if (d2) notes.takes.push(d2);

    await page.goto(`${BASE}/jury`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.getByText("Meet Fatima").waitFor({ timeout: 20_000 }).catch(() => {});
    const d3 = await runStep("D3", () =>
      takeLive(page, cursor, {
        id: "D3",
        file: "D3-paris-live.mp4",
        nth: 1,
        planStill: "D3-02-plan.png",
        packageStill: "D3-03-package.png",
        endStill: "D3-04-end.png",
        clickStill: "D3-01-click.png",
        questionStill: "D3-02-question.png",
      }),
    );
    if (d3) notes.takes.push(d3.meta);

    await page.goto(`${BASE}/jury`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.getByText("Meet Fatima").waitFor({ timeout: 20_000 }).catch(() => {});
    const d4 = await runStep("D4", () =>
      takeLive(page, cursor, {
        id: "D4",
        file: "D4-sea-live.mp4",
        nth: 2,
        clickQuestion: true,
        questionStill: "D4-01-question.png",
        planStill: "D4-02-plan.png",
        packageStill: "D4-03-package.png",
        endStill: "D4-04-end.png",
        clickStill: "D4-00-click.png",
      }),
    );
    if (d4) {
      notes.d4 = { facts: d4.facts };
      notes.takes.push(d4.meta);
    }
    await desktop.close();
    await browser.close();
    }

    const phoneBrowser = await launchScaled(MOBILE.deviceScaleFactor);
    opened.push(phoneBrowser);
    const mobile = await phoneBrowser.newContext(contextOptions(MOBILE));
    await mobile.addInitScript(CURSOR_SCRIPT, "en");
    const phone = await mobile.newPage();
    const mobileCursor = { x: 40, y: 80 };
    await openJuryGate(phone, key);
    const m1 = await runStep("M1", () => takeM1(phone));
    if (m1) notes.takes.push(m1);
    const m2 = await runStep("M2", () => takeM2(phone));
    if (m2) notes.takes.push(m2);
    const m3 = await runStep("M3", () => takeM3(phone, mobileCursor));
    if (m3) {
      notes.takes.push(m3.meta);
      notes.m3ReplayBadge = m3.replay;
    }
    const m4 = await runStep("M4", () => takeM4(phone, mobileCursor));
    if (m4) notes.takes.push(m4);
    await mobile.close();
    await phoneBrowser.close();
  } finally {
    for (const item of opened) await item.close().catch(() => {});
    await rm(WORK, { recursive: true, force: true });
    await saveNotes();
  }

  await writeFile(path.join(OUT, "notes.json"), JSON.stringify(notes, null, 2));
  console.log("CAPTURE_DONE");
  console.log(JSON.stringify({ takes: notes.takes.map((take) => take.file ?? take.id), m3: notes.m3ReplayBadge }, null, 2));
}

async function takeD1(page) {
  console.log("TAKE D1");
  const recorder = new Recorder(page, "D1", DESKTOP.deviceScaleFactor);
  await recorder.start();
  await sleep(1000);
  await recorder.still("D1-01.png");
  await sleep(2000);
  await recorder.still("D1-02.png");
  await sleep(2000);
  await recorder.still("D1-03.png");
  await sleep(1000);
  const meta = await recorder.stop("D1-board.mp4");
  console.log(`ENCODE D1 ${meta.frames} frames ${meta.width}x${meta.height}`);
  return { id: "D1", ...meta, sees: "Judges' board at rest: Fatima, the three figures, three scenarios." };
}

async function takeLive(page, cursor, options) {
  console.log(`TAKE ${options.id}`);
  await assertGuest(page);
  const button = page.getByRole("button", { name: "Run live", exact: true }).nth(options.nth);
  await button.waitFor({ timeout: 20_000 });
  const ready = await page
    .waitForFunction(
      (index) => {
        const buttons = [...document.querySelectorAll("button")].filter((el) => el.textContent?.includes("Run live"));
        return buttons[index] && !buttons[index].disabled;
      },
      options.nth,
      { timeout: 25_000 },
    )
    .then(() => true)
    .catch(() => false);
  if (!ready) {
    const paused = await page.getByText("Live paused").count();
    throw new Error(paused ? `${options.id}: live runs are paused` : `${options.id}: Run live is disabled`);
  }

  const recorder = new Recorder(page, options.id, DESKTOP.deviceScaleFactor);
  const samples = [];
  const facts = { quickReplyClicked: false };
  let encoded = false;
  try {
    await setCursor(page, cursor.x, cursor.y, true);
    await recorder.start();
    await revealInAside(page, button);
    const point = await pointOf(button);
    if (!point) throw new Error(`${options.id}: Run live has no box`);
    await glide(page, point.x, point.y, cursor);
    await recorder.still(options.clickStill);
    await page.mouse.down();
    await sleep(90);
    await page.mouse.up();
    await sleep(1000);
    await waitForLive(page, recorder, samples, facts, cursor, options);
    const meta = await recorder.stop(options.file);
    encoded = true;
    console.log(`ENCODE ${options.id} ${meta.frames} frames ${meta.width}x${meta.height} ${meta.durationSec}s`);
    return { meta: { id: options.id, ...meta }, samples, facts };
  } catch (error) {
    if (!encoded && recorder.startedAt) {
      await recorder.stop(options.file).catch(() => {});
    }
    throw error;
  }
}

async function takeM1(page) {
  console.log("TAKE M1");
  await setFilmLang(page, "en");
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.locator("[data-welcome]").waitFor({ timeout: 20_000 });
  await assertGuest(page);
  const recorder = new Recorder(page, "M1", MOBILE.deviceScaleFactor);
  await recorder.start();
  await sleep(1200);
  await recorder.still("M1-01.png");
  await sleep(2800);
  await recorder.still("M1-02.png");
  await sleep(2800);
  await recorder.still("M1-03.png");
  await sleep(1200);
  const meta = await recorder.stop("M1-welcome-en.mp4");
  console.log(`ENCODE M1 ${meta.frames} frames ${meta.width}x${meta.height}`);
  return { id: "M1", ...meta, sees: "Welcome screen in English, guest, no account." };
}

async function takeM2(page) {
  console.log("TAKE M2");
  const langs = ["en", "darija-latn", "darija-arab", "ar", "fr"];
  const recorder = new Recorder(page, "M2", MOBILE.deviceScaleFactor);
  await recorder.start();
  const shots = ["M2-01-en.png", null, "M2-02-darija-arab.png", null, "M2-03-fr.png"];
  for (let i = 0; i < langs.length; i += 1) {
    await setFilmLang(page, langs[i]);
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.locator("[data-welcome]").waitFor({ timeout: 20_000 });
    await assertGuest(page);
    await sleep(1500);
    if (shots[i]) await recorder.still(shots[i]);
    await sleep(1500);
  }
  const meta = await recorder.stop("M2-welcome-languages.mp4");
  console.log(`ENCODE M2 ${meta.frames} frames ${meta.width}x${meta.height}`);
  return { id: "M2", ...meta, sees: "Welcome in en, darija-latn, darija-arab, ar, fr, 3s each." };
}

async function takeM3(page, cursor) {
  console.log("TAKE M3");
  await setFilmLang(page, "en");
  const recorder = new Recorder(page, "M3", MOBILE.deviceScaleFactor);
  const replayLog = [];
  const noteReplay = async (where) => {
    const hits = await mobileReplayBadges(page);
    replayLog.push({ where, path: new URL(page.url()).pathname, hits });
  };
  await recorder.start();
  await page.goto(`${BASE}/trip/plan?replay=istanbul`, { waitUntil: "domcontentloaded" });
  await page.locator("h1").first().waitFor({ timeout: 20_000 });
  await assertGuest(page);
  await sleep(1500);
  await noteReplay("plan");
  await recorder.still("M3-01-plan.png");

  await page.waitForURL(/\/trip\/result/, { timeout: 60_000 });
  await noteReplay("result");
  await sleep(1200);
  await scrollMain(page, 280, 2200);
  await sleep(600);
  const card = page.locator("ul button").first();
  const cardPoint = await pointOf(card);
  if (cardPoint) await glideClick(page, cardPoint.x, cardPoint.y, cursor);

  await page.waitForURL(/\/trip\/package/, { timeout: 20_000 });
  await noteReplay("package");
  await sleep(1200);
  await scrollMain(page, 520, 2800);
  await sleep(700);
  await recorder.still("M3-02-package.png");
  await scrollMain(page, 420, 2200);
  await sleep(800);
  const confirm = page.getByRole("button", { name: "I confirm", exact: true });
  const confirmPoint = await pointOf(confirm);
  if (!confirmPoint) throw new Error("M3: confirm button missing");
  await glideClick(page, confirmPoint.x, confirmPoint.y, cursor);

  await page.waitForURL(/\/trip\/ready/, { timeout: 20_000 });
  await noteReplay("ready");
  await sleep(1500);
  await scrollMain(page, 360, 2400);
  await sleep(800);
  const cont = page.getByRole("button", { name: "Continue", exact: true });
  const contPoint = await pointOf(cont);
  if (!contPoint) throw new Error("M3: continue button missing");
  await glideClick(page, contPoint.x, contPoint.y, cursor);

  await page.waitForURL(/\/trip\/check/, { timeout: 20_000 });
  await sleep(800);
  const next = page.getByRole("button", { name: "Next", exact: true });
  const nextPoint = await pointOf(next);
  if (nextPoint) await glideClick(page, nextPoint.x, nextPoint.y, cursor);
  const flight = page.getByRole("link", { name: "Open the flight on Kiwi.com" });
  await flight.waitFor({ timeout: 15_000 });
  const flightPoint = await pointOf(flight);
  const popupPromise = page.waitForEvent("popup", { timeout: 8000 }).catch(() => null);
  if (flightPoint) await glideClick(page, flightPoint.x, flightPoint.y, cursor);
  const popup = await popupPromise;
  if (popup) await popup.close().catch(() => {});
  const booked = page.getByRole("button", { name: "I've booked, see my file", exact: true });
  const bookedPoint = await pointOf(booked);
  if (bookedPoint) await glideClick(page, bookedPoint.x, bookedPoint.y, cursor);

  await page.waitForURL(/\/trip\/file/, { timeout: 20_000 });
  await noteReplay("file");
  await sleep(2600);
  await recorder.still("M3-03-file.png");
  const poster = page.getByRole("button", { name: "See the poster", exact: true });
  const posterPoint = await pointOf(poster);
  if (posterPoint) await glideClick(page, posterPoint.x, posterPoint.y, cursor);
  await page.waitForURL(/\/trip\/poster/, { timeout: 20_000 });
  await page.getByText("MADE WITH BONSAFAR").waitFor({ timeout: 28_000 }).catch(() => {});
  await noteReplay("poster");
  await sleep(2000);
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const sheet = await page
    .getByText("So, is it booked?")
    .waitFor({ timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  await sleep(2500);
  await noteReplay(sheet ? "sheet" : "sheet-missing");

  const meta = await recorder.stop("M3-istanbul-replay.mp4");
  const visible = replayLog.filter((row) => row.hits.length > 0);
  console.log(`ENCODE M3 ${meta.frames} frames ${meta.width}x${meta.height} replaySteps=${visible.length} sheet=${sheet}`);
  return { meta: { id: "M3", ...meta, sheet, replayLog }, replay: { sheet, visible, replayLog } };
}

async function takeM4(page, cursor) {
  console.log("TAKE M4");
  await setFilmLang(page, "darija-latn");
  await page.goto(`${BASE}/trip/plan?replay=istanbul`, { waitUntil: "domcontentloaded" });
  await page.locator("h1").first().waitFor({ timeout: 20_000 });
  await assertGuest(page);
  const skip = page.locator("header button").first();
  if (await skip.count()) await skip.click();
  await page.waitForURL(/\/trip\/result/, { timeout: 60_000 });
  await page.locator("ul button").first().click();
  await page.waitForURL(/\/trip\/package/, { timeout: 20_000 });

  const recorder = new Recorder(page, "M4", MOBILE.deviceScaleFactor);
  await recorder.start();
  await sleep(800);
  await recorder.still("M4-01-map.png");
  await scrollMain(page, 640, 3200);
  await sleep(600);
  await recorder.still("M4-02-tip.png");
  const confirm = page.getByRole("button", { name: "Wakha, yallah", exact: true });
  const point = await pointOf(confirm);
  if (!point) throw new Error("M4: confirm button missing");
  await glideClick(page, point.x, point.y, cursor);
  await page.waitForURL(/\/trip\/ready/, { timeout: 20_000 });
  await sleep(1200);
  await scrollMain(page, 300, 2000);
  await sleep(600);
  await recorder.still("M4-03-ready.png");
  await sleep(1800);
  const meta = await recorder.stop("M4-darija-package-ready.mp4");
  console.log(`ENCODE M4 ${meta.frames} frames ${meta.width}x${meta.height}`);
  return { id: "M4", ...meta, sees: "Istanbul package and ready screen in darija-latn." };
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`CAPTURE_FAIL ${message}`);
  process.exit(1);
});

/**
 * Compact airport coordinates from OurAirports (public domain).
 * Run: node scripts/build-airports.mjs
 * Source: https://davidmegginson.github.io/ourairports-data/airports.csv
 * Keeps large_airport and medium_airport rows that have an IATA code.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const URL = "https://davidmegginson.github.io/ourairports-data/airports.csv";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "src", "lib", "geo", "airports.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const response = await fetch(URL);
if (!response.ok) {
  console.error(`OurAirports download failed: ${response.status}`);
  process.exit(1);
}
const rows = parseCsv(await response.text());
const header = rows[0];
const col = (name) => {
  const index = header.indexOf(name);
  if (index < 0) throw new Error(`Missing column ${name}`);
  return index;
};
const typeCol = col("type");
const latCol = col("latitude_deg");
const lngCol = col("longitude_deg");
const iataCol = col("iata_code");

const wanted = new Set(["large_airport", "medium_airport"]);
/** @type {Map<string, { lat: number, lng: number, large: boolean }>} */
const byCode = new Map();

for (const row of rows.slice(1)) {
  const type = row[typeCol];
  if (!wanted.has(type)) continue;
  const iata = (row[iataCol] ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata)) continue;
  const lat = Number(row[latCol]);
  const lng = Number(row[lngCol]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  const large = type === "large_airport";
  const previous = byCode.get(iata);
  if (previous && (previous.large || !large)) continue;
  byCode.set(iata, { lat, lng, large });
}

const airports = Object.fromEntries(
  [...byCode.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([iata, point]) => [
      iata,
      [Math.round(point.lat * 100) / 100, Math.round(point.lng * 100) / 100],
    ]),
);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(airports)}\n`);
console.log(`wrote ${Object.keys(airports).length} airports to src/lib/geo/airports.json`);

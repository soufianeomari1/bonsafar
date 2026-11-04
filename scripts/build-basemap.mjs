/**
 * Regional Natural Earth basemap for routes over Europe, Africa and the Middle East.
 * Run: node scripts/build-basemap.mjs
 * Source: world-atlas countries-50m (public domain). Keeps countries that touch
 * longitude -30..75 and latitude -40..72, still as TopoJSON.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";

const WEST = -30;
const EAST = 75;
const SOUTH = -40;
const NORTH = 72;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(root, "node_modules", "world-atlas", "countries-50m.json");
const outPath = join(root, "public", "geo", "basemap.json");

const world = JSON.parse(readFileSync(sourcePath, "utf8"));
const countries = feature(world, world.objects.countries);

function pointInZone(lng, lat) {
  return lng >= WEST && lng <= EAST && lat >= SOUTH && lat <= NORTH;
}

function geometryTouches(geometry) {
  let hit = false;
  const scan = (coords) => {
    if (hit) return;
    if (typeof coords[0] === "number") {
      if (pointInZone(coords[0], coords[1])) hit = true;
      return;
    }
    for (const child of coords) scan(child);
  };
  scan(geometry.coordinates);
  return hit;
}

/** A country can cover the zone with no vertex inside it. */
const SAMPLES = [
  [-10, 30],
  [2, 47],
  [10, 36],
  [30, 30],
  [45, 25],
  [30, 0],
  [20, -30],
  [40, 15],
];

function touches(feat) {
  if (!feat.geometry) return false;
  if (geometryTouches(feat.geometry)) return true;
  return SAMPLES.some((point) => geoContains(feat, point));
}

const keptIds = new Set(
  countries.features.filter(touches).map((feat) => String(feat.id)),
);

function walk(arcs, visit) {
  if (typeof arcs[0] === "number") visit(arcs);
  else for (const child of arcs) walk(child, visit);
}

const used = new Set();
for (const geometry of world.objects.countries.geometries) {
  if (!keptIds.has(String(geometry.id))) continue;
  walk(geometry.arcs, (arc) => {
    for (const index of arc) used.add(index < 0 ? ~index : index);
  });
}

const order = [...used].sort((a, b) => a - b);
const remap = new Map(order.map((old, index) => [old, index]));

function rewrite(arcs) {
  if (typeof arcs[0] === "number") {
    return arcs.map((index) => {
      const next = remap.get(index < 0 ? ~index : index);
      return index < 0 ? ~next : next;
    });
  }
  return arcs.map(rewrite);
}

const geometries = world.objects.countries.geometries
  .filter((geometry) => keptIds.has(String(geometry.id)))
  .map((geometry) => ({
    type: geometry.type,
    arcs: rewrite(geometry.arcs),
    id: geometry.id,
  }));

const basemap = {
  type: "Topology",
  objects: {
    countries: { type: "GeometryCollection", geometries },
  },
  arcs: order.map((index) => world.arcs[index]),
  transform: world.transform,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(basemap));

const before = statSync(sourcePath).size;
const after = statSync(outPath).size;
console.log(`countries kept: ${geometries.length} of ${world.objects.countries.geometries.length}`);
console.log(`basemap before (countries-50m): ${before} bytes`);
console.log(`basemap after (regional): ${after} bytes`);

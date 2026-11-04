/**
 * Map data started on the flight plan, so screens 06 and 07 draw without a wait.
 * The regional basemap covers longitude -30..75 and latitude -40..72
 * (Europe, Africa, the Middle East). A route outside it uses countries-110m.
 */

import type { Topology } from "topojson-specification";

export const BASEMAP_ZONE = { west: -30, east: 75, south: -40, north: 72 } as const;

let basemap: Promise<Topology> | null = null;

export function coordsInBasemapZone(coords: readonly (readonly [number, number])[]): boolean {
  return coords.every(
    ([lng, lat]) =>
      lng >= BASEMAP_ZONE.west &&
      lng <= BASEMAP_ZONE.east &&
      lat >= BASEMAP_ZONE.south &&
      lat <= BASEMAP_ZONE.north,
  );
}

/** The regional Natural Earth file. Shared so a preload and the map parse it once. */
export function loadBasemapTopology(): Promise<Topology> {
  basemap ??= fetch("/geo/basemap.json").then((response) => {
    if (!response.ok) throw new Error("basemap");
    return response.json() as Promise<Topology>;
  });
  return basemap;
}

/** Fire-and-forget. Does not block the flight-plan animation. */
export function preloadMapData() {
  void loadBasemapTopology().catch(() => undefined);
  void import("@/lib/airports");
}

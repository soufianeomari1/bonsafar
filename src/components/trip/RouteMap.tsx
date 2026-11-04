"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { geoBounds, geoInterpolate, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, MultiLineString, MultiPolygon, Polygon, Position } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { SafarLogo } from "@/components/bs/Brand";
import { airport } from "@/lib/airports";
import { useT } from "@/lib/i18n/provider";
import type { MapStop } from "@/lib/trip/describe";
import { cn } from "@/lib/utils";

type Atlas = { land: FeatureCollection<MultiPolygon>; borders: MultiLineString };

let atlasJob: Promise<Atlas> | null = null;

/** Antarctica and any shape wider than 200° of longitude would fill the whole map. */
function keepPolygon(feature: Feature, rings: Position[][]): boolean {
  if (feature.id === "010") return false;
  const [[west], [east]] = geoBounds({ type: "Polygon", coordinates: rings });
  const span = east >= west ? east - west : east - west + 360;
  return span <= 200;
}

/** Natural Earth (world-atlas, public domain), loaded only by the screens that draw a map. */
function loadAtlas(): Promise<Atlas> {
  atlasJob ??= Promise.all([import("world-atlas/countries-50m.json"), import("topojson-client")]).then(
    ([atlas, topojson]) => {
      const world = (atlas.default ?? atlas) as unknown as Topology<{ countries: GeometryCollection }>;
      const countries = topojson.feature(world, world.objects.countries) as FeatureCollection<Polygon | MultiPolygon>;
      const land: Feature<MultiPolygon>[] = countries.features.flatMap((feature) => {
        const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        const kept = polygons.filter((rings) => keepPolygon(feature, rings));
        return kept.length
          ? [{ type: "Feature", id: feature.id, properties: {}, geometry: { type: "MultiPolygon", coordinates: kept } }]
          : [];
      });
      return {
        land: { type: "FeatureCollection", features: land },
        borders: topojson.mesh(world, world.objects.countries, (a, b) => a !== b),
      };
    },
  );
  return atlasJob;
}

const round = (n: number) => Math.round(n * 10) / 10;
const ARABIC = /[\u0600-\u06FF]/;

export type RouteMapProps = {
  stops: MapStop[];
  height?: number;
  /** Space the sheet covers at the bottom, so labels and the credit stay visible. */
  overlap?: number;
  /** Safar flies the route once, then lands near the arrival. */
  showSafar?: boolean;
  onArrived?: () => void;
  /** Round buttons laid over the map (back, share). */
  children?: ReactNode;
  className?: string;
};

type Point = { x: number; y: number; stop: MapStop };

/** The real route on a real map: Mercator fitted on the trip's airports, SVG only, no tiles. */
export function RouteMap({ stops, height = 250, overlap = 22, showSafar = true, onArrived, children, className }: RouteMapProps) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [atlas, setAtlas] = useState<Atlas | null>(null);
  const reduced = !!useReducedMotion();
  // Screens rebuild `stops` on every render: the map is drawn again only when the route changes.
  const routeKey = JSON.stringify(stops);

  useLayoutEffect(() => {
    const element = box.current;
    if (!element) return;
    setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    void loadAtlas().then((value) => alive && setAtlas(value));
    return () => {
      alive = false;
    };
  }, []);

  const known = useMemo(
    () =>
      (JSON.parse(routeKey) as MapStop[]).flatMap((stop) => {
        const point = airport(stop.iata);
        return point ? [{ stop, coord: [point.lng, point.lat] as [number, number] }] : [];
      }),
    [routeKey],
  );

  const drawing = useMemo(() => {
    if (!width || known.length < 2) return null;
    const lngs = known.map((k) => k.coord[0]);
    const lats = known.map((k) => k.coord[1]);
    const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    // A minimum span keeps a short hop from zooming onto a single street.
    const frame: Position[] = [...known.map((k) => k.coord), [midLng - 5, midLat - 3], [midLng + 5, midLat + 3]];
    const projection = geoMercator().fitExtent(
      [
        [44, 64],
        [width - 44, height - overlap - 40],
      ],
      { type: "MultiPoint", coordinates: frame },
    );
    projection.clipExtent([
      [-8, -8],
      [width + 8, height + 8],
    ]);
    const path = geoPath(projection).digits(1);

    const points: Point[] = known.map(({ stop, coord }) => {
      const [x, y] = projection(coord) ?? [0, 0];
      return { x: round(x), y: round(y), stop };
    });
    const route: string[] = [];
    known.forEach((k, index) => {
      if (index === 0) return;
      const step = geoInterpolate(known[index - 1].coord, k.coord);
      for (let i = index === 1 ? 0 : 1; i <= 16; i += 1) {
        const [x, y] = projection(step(i / 16)) ?? [0, 0];
        route.push(`${route.length ? "L" : "M"}${round(x)},${round(y)}`);
      }
    });

    return {
      points,
      route: route.join(""),
      land: atlas ? (path(atlas.land) ?? "") : "",
      borders: atlas ? (path(atlas.borders) ?? "") : "",
    };
  }, [width, height, overlap, known, atlas]);

  useEffect(() => {
    if (reduced && drawing && showSafar) onArrived?.();
  }, [reduced, drawing, showSafar, onArrived]);

  return (
    <div
      ref={box}
      dir="ltr"
      className={cn("relative w-full shrink-0 overflow-hidden bg-gradient-to-b from-map-sea-top to-map-sea-bottom", className)}
      style={{ height }}
    >
      {drawing && (
        <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 block">
          {drawing.land && (
            <path d={drawing.land} className="bs-fade-in fill-map-land stroke-map-edge" strokeWidth={0.7} />
          )}
          {drawing.borders && <path d={drawing.borders} className="fill-none stroke-map-edge" strokeWidth={0.6} />}
          <path d={drawing.route} className="fill-none stroke-blue" strokeWidth={2.6} strokeLinecap="round" opacity={0.18} />
          <path
            d={drawing.route}
            className="fill-none stroke-blue"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
          {drawing.points.map((point, index) => (
            <Marker
              key={`${point.stop.iata}-${index}`}
              point={point}
              width={width}
              bottom={height - overlap}
              stopover={index > 0 && index < drawing.points.length - 1}
            />
          ))}
        </svg>
      )}

      {drawing && showSafar && (
        <div
          className={cn("pointer-events-none absolute left-0 top-0 size-11", !reduced && "bs-fly")}
          style={
            {
              offsetPath: `path("${drawing.route}")`,
              offsetRotate: "0deg",
              offsetAnchor: "50% 70%",
              offsetDistance: reduced ? "90%" : undefined,
            } as CSSProperties
          }
          onAnimationEnd={() => onArrived?.()}
        >
          <SafarLogo size={44} className="-rotate-[8deg]" />
        </div>
      )}

      <span
        className="pointer-events-none absolute right-3.5 font-mono text-[9px] font-semibold tracking-[0.04em] text-map-credit"
        style={{ bottom: overlap + 8 }}
      >
        {t("map.credit")}
      </span>
      {children}
    </div>
  );
}

function Marker({ point, width, bottom, stopover }: { point: Point; width: number; bottom: number; stopover: boolean }) {
  const end = point.x > width * 0.62;
  const dx = end ? -12 : 12;
  let dy = stopover ? -4 : 18;
  if (point.y + dy + 16 > bottom) dy = -30;
  const arabic = ARABIC.test(point.stop.name);
  const arabicSub = ARABIC.test(point.stop.sub);
  const halo = { paintOrder: "stroke", stroke: "var(--color-map-halo)", strokeWidth: 4, strokeLinejoin: "round" } as const;
  return (
    <g transform={`translate(${point.x},${point.y})`}>
      <circle r={7} className="fill-card stroke-ink" strokeWidth={2.5} />
      <circle r={2.6} className="fill-ink" />
      <g transform={`translate(${dx},${dy})`}>
        <text
          textAnchor={end ? "end" : "start"}
          className={cn("fill-ink font-bold", arabic ? "font-arabic" : "font-sans")}
          fontSize={arabic ? 13 : 12.5}
          style={halo}
        >
          {point.stop.name}
        </text>
        <text
          y={13}
          textAnchor={end ? "end" : "start"}
          className={cn("fill-muted font-semibold", arabicSub ? "font-arabic" : "font-mono")}
          fontSize={arabicSub ? 10.5 : 9.5}
          style={halo}
          direction={arabicSub ? "rtl" : "ltr"}
        >
          {point.stop.sub}
        </text>
      </g>
    </g>
  );
}

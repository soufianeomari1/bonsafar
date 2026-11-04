"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Safar } from "@/components/bs/Safar";
import { arcPath, projectAirport } from "@/lib/airports";
import { EASE_DEFAULT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const W = 390;
const H = 260;

export type RouteMapProps = {
  from: string;
  to: string;
  toLabel: string;
  /** Safar flies the arc. One per screen: hide him when he has moved to the tip. */
  showSafar?: boolean;
  /** Screen 06 zooms onto the destination once he arrives. */
  zoom?: boolean;
  /** Seconds. Screen 07's reference is 5s, screen 06's A5 is 1.6s. */
  duration?: number;
  className?: string;
  back?: React.ReactNode;
  onArrived?: () => void;
};

function pointAt(from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  const cx = (from.x + to.x) / 2;
  const cy = Math.max(16, Math.min(from.y, to.y) - 78);
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * cx + t * t * to.x,
    y: u * u * from.y + 2 * u * t * cy + t * t * to.y,
  };
}

/** Stylised sea-and-land band. Same drawing as the package reference, arc from real coordinates. */
export function RouteMap({
  from,
  to,
  toLabel,
  showSafar = true,
  zoom = false,
  duration = 1.6,
  className,
  back,
  onArrived,
}: RouteMapProps) {
  const reduced = useReducedMotion();
  const [arrived, setArrived] = useState(!!reduced);
  const origin = projectAirport(from || "CMN", W, H);
  const dest = projectAirport(to || "IST", W, H);
  const d = arcPath(origin, dest);
  const samples = [0, 0.35, 0.7, 1].map((t) => pointAt(origin, dest, reduced ? 1 : t));
  const seconds = reduced ? 0 : duration;

  return (
    <div className={cn("relative h-[260px] w-full overflow-hidden bg-sea", className)}>
    <motion.div
      className="absolute inset-0"
      animate={zoom && arrived && !reduced ? { scale: 1.18 } : { scale: 1 }}
      transition={{ duration: 0.8, ease: EASE_DEFAULT }}
      style={{ transformOrigin: `${((origin.x + dest.x) / 2 / W) * 100}% ${((origin.y + dest.y) / 2 / H) * 100}%` }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M0,150 C40,140 70,170 110,200 C130,215 120,260 120,260 L0,260 Z" className="fill-land" />
        <path d="M240,40 C280,20 340,30 390,40 L390,150 C350,140 320,120 290,110 C260,100 236,70 240,40 Z" className="fill-land" />
        <path d="M150,0 C190,10 220,30 230,60 C200,62 170,40 150,0 Z" className="fill-land" />
        <motion.path
          d={d}
          className="fill-none stroke-blue"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: reduced ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: seconds, ease: [0.45, 0, 0.2, 1] }}
        />
        <circle cx={origin.x} cy={origin.y} r={7} className="fill-card stroke-ink" strokeWidth={3} />
        <circle cx={dest.x} cy={dest.y} r={7} className="fill-blue stroke-ink" strokeWidth={3} />
      </svg>

      <span
        className="absolute rounded-md bg-card px-1.5 py-0.5 font-mono text-[11px] font-semibold"
        style={{ left: `${(origin.x / W) * 100}%`, top: `${(origin.y / H) * 100}%`, transform: "translate(4px, 8px)" }}
      >
        <bdi>{from}</bdi>
      </span>
      <span
        className="absolute rounded-pill bg-ink px-2 py-1 font-mono text-[11px] font-bold text-card"
        style={{ left: `${(dest.x / W) * 100}%`, top: `${(dest.y / H) * 100}%`, transform: "translate(-110%, -130%)" }}
      >
        <bdi>
          {to} {toLabel}
        </bdi>
      </span>

      {showSafar && (
        <motion.div
          className="absolute z-10"
          initial={{ left: `${(samples[0].x / W) * 100}%`, top: `${(samples[0].y / H) * 100}%` }}
          animate={{
            left: samples.map((point) => `${(point.x / W) * 100}%`),
            top: samples.map((point) => `${(point.y / H) * 100}%`),
          }}
          transition={{ duration: seconds, ease: [0.45, 0, 0.2, 1], times: [0, 0.35, 0.7, 1] }}
          onAnimationComplete={() => {
            setArrived(true);
            onArrived?.();
          }}
          style={{ translate: "-50% -50%" }}
        >
          <Safar state="idle" size={54} tilt={-14} />
        </motion.div>
      )}
    </motion.div>
      {back}
    </div>
  );
}

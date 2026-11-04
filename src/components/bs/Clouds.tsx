"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type CloudLayer = {
  top: number;
  width: number;
  opacity: number;
  duration: number;
  delay: number;
  /** Stay in a corner. Without this, the cloud crosses the whole screen. */
  pin?: "start" | "end";
  /** Inset from that side. Negative hangs the cloud off the edge. */
  inset?: number;
  /** Local drift in px. Negative moves toward the inline start. */
  drift?: number;
};

/** Three layers, slower the further away, as in docs section 3 (A9). */
const LAYERS: CloudLayer[] = [
  { top: 70, width: 90, opacity: 1, duration: 38, delay: 0 },
  { top: 118, width: 60, opacity: 0.8, duration: 26, delay: -12 },
  { top: 168, width: 44, opacity: 0.6, duration: 54, delay: -30 },
];

export type CloudsProps = {
  className?: string;
  layers?: CloudLayer[];
};

/** A9: small white clouds drifting behind a header while something loads. */
export function Clouds({ className, layers = LAYERS }: CloudsProps) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {layers.map((layer, index) => {
        const pinned = layer.pin !== undefined;
        return (
          <motion.svg
            key={index}
            viewBox="0 0 90 34"
            width={layer.width}
            height={(layer.width * 34) / 90}
            className={cn("absolute text-card", !pinned && "left-0")}
            style={{
              top: layer.top,
              opacity: layer.opacity,
              ...(layer.pin === "end"
                ? { insetInlineEnd: layer.inset ?? 0 }
                : layer.pin === "start"
                  ? { insetInlineStart: layer.inset ?? 0 }
                  : {}),
            }}
            animate={
              pinned
                ? { x: reduced ? 0 : [0, layer.drift ?? -26, 0] }
                : reduced
                  ? { x: "60%" }
                  : { x: ["-120%", "640%"] }
            }
            transition={
              reduced
                ? { duration: 0.2 }
                : {
                    duration: layer.duration,
                    delay: layer.delay,
                    ease: pinned ? "easeInOut" : "linear",
                    repeat: Infinity,
                  }
            }
          >
            <path
              d="M20 30h52a12 12 0 0 0 0-24 16 16 0 0 0-30-4A14 14 0 0 0 20 30z"
              fill="currentColor"
            />
          </motion.svg>
        );
      })}
    </div>
  );
}

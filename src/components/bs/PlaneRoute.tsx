"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { AirplaneTilt } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { haptic, setFlightPlanMode } from "@/lib/haptics";
import { SPRING_DEFAULT } from "@/lib/motion";
import { StatusBadge } from "./StatusBadge";

export type PlaneRouteStop = {
  id: string;
  /** Main label, in the profile language. */
  title: string;
  /** Darija under-line shown to the judges, or any secondary line. */
  subtitle?: string;
  /** Short status word, already translated. */
  status?: string;
};

export type PlaneRouteProps = {
  stops: PlaneRouteStop[];
  /** Index of the stop the plane is flying to. Equal to stops.length when done. */
  activeStep: number;
  className?: string;
};

const STOP_HEIGHT = 76;
const DOT_OFFSET = 26;

/**
 * A3, the agent's flight plan. A plane descends from stop to stop, the trail
 * behind it turns blue, and each landed stop gets a green check and a `tick`.
 */
export function PlaneRoute({ stops, activeStep, className }: PlaneRouteProps) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(activeStep, stops.length));
  const planeY = Math.min(clamped, stops.length - 1) * STOP_HEIGHT;
  const trailHeight = planeY;

  // The flight plan is the one place allowed to vibrate faster than once a second.
  useEffect(() => {
    setFlightPlanMode(true);
    return () => setFlightPlanMode(false);
  }, []);

  useEffect(() => {
    if (clamped > 0) haptic("tick");
  }, [clamped]);

  return (
    <div
      className={cn("relative", className)}
      style={{ paddingLeft: 44 }}
      role="list"
    >
      {/* Grey route, then the blue trail that follows the plane */}
      <span
        aria-hidden
        className="absolute left-[15px] w-0.5 rounded-pill bg-line"
        style={{ top: DOT_OFFSET, height: (stops.length - 1) * STOP_HEIGHT }}
      />
      <motion.span
        aria-hidden
        className="absolute left-[15px] w-0.5 rounded-pill bg-blue"
        style={{ top: DOT_OFFSET }}
        initial={{ height: 0 }}
        animate={{ height: trailHeight }}
        transition={reduced ? { duration: 0.2 } : SPRING_DEFAULT}
      />

      {!reduced && (
        <motion.span
          aria-hidden
          className="absolute left-[4px] text-blue"
          style={{ top: DOT_OFFSET - 12 }}
          initial={{ y: 0 }}
          animate={{ y: planeY }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.2 }}
        >
          {/* AirplaneTilt points up and right: turn it so it flies down the route. */}
          <AirplaneTilt size={24} weight="fill" className="rotate-[135deg]" />
        </motion.span>
      )}

      {stops.map((stop, index) => {
        const done = index < clamped;
        const running = index === clamped && clamped < stops.length;
        // The plane itself marks the stop it sits on, so the dot stays hidden.
        const planeHere = !reduced && index === Math.min(clamped, stops.length - 1);

        return (
          <div
            key={stop.id}
            role="listitem"
            className="relative flex flex-col justify-center"
            style={{ height: STOP_HEIGHT }}
          >
            <span
              aria-hidden
              className={cn(
                "absolute -left-[36px] top-[18px] flex size-4 items-center justify-center rounded-pill border-2 bg-card",
                done
                  ? "border-green-bright"
                  : running
                    ? "border-blue"
                    : "border-line",
                planeHere && "opacity-0"
              )}
            >
              {done && (
                <motion.svg
                  viewBox="0 0 16 16"
                  className="size-3 text-green-bright"
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <motion.path
                    d="M3 8.5 L6.5 12 L13 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </span>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold">{stop.title}</p>
                {stop.subtitle && (
                  <p className="truncate text-sm italic text-muted">
                    {stop.subtitle}
                  </p>
                )}
              </div>
              {stop.status && (
                <StatusBadge
                  tone={done ? "done" : running ? "running" : "todo"}
                  dot={running}
                >
                  {stop.status}
                </StatusBadge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

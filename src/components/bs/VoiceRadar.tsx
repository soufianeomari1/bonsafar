"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export type VoiceRadarProps = {
  /** Idle on the home screen, listening while recording. */
  listening?: boolean;
  /** Current voice level, 0 to 1. Read on each ring spawn, not on render. */
  getLevel?: () => number;
  /** Diameter in px; the radar shrinks if its container is narrower. */
  size?: number;
  /** Diameter of the button in the middle, where the rings start. */
  core?: number;
  className?: string;
  children: React.ReactNode;
};

type Ring = { id: number; strength: number };

const RING_LIFE_S = 1.4;

/**
 * A1, the voice radar (docs section 3): control-tower circles escape from the
 * mic, faster and wider when the voice rises, under a slow conic sweep.
 */
export function VoiceRadar({
  listening = false,
  getLevel,
  size = 250,
  core = 84,
  className,
  children,
}: VoiceRadarProps) {
  const reduced = useReducedMotion();
  const [rings, setRings] = useState<Ring[]>([]);
  const nextId = useRef(0);
  const levelRef = useRef(getLevel);

  useEffect(() => {
    levelRef.current = getLevel;
  }, [getLevel]);

  useEffect(() => {
    if (!listening || reduced) return;
    let timer: ReturnType<typeof setTimeout>;
    const spawn = () => {
      const level = Math.min(1, Math.max(0, levelRef.current?.() ?? 0));
      if (level > 0.04) {
        const id = nextId.current++;
        setRings((current) => [...current.slice(-2), { id, strength: level }]);
      }
      // Quiet room: one ring every 900ms. Loud voice: one every 280ms.
      timer = setTimeout(spawn, 900 - level * 620);
    };
    timer = setTimeout(spawn, 120);
    return () => clearTimeout(timer);
  }, [listening, reduced]);

  const sweep = listening
    ? "conic-gradient(from 0deg, transparent 0deg, transparent 280deg, color-mix(in srgb, var(--color-blue) 28%, transparent) 360deg)"
    : "conic-gradient(from 0deg, transparent 0deg, transparent 290deg, color-mix(in srgb, var(--color-blue) 22%, transparent) 360deg)";

  return (
    <div
      className={cn("relative flex aspect-square items-center justify-center", className)}
      style={{ width: size, maxWidth: "100%" }}
    >
      <span aria-hidden className="absolute inset-0 rounded-pill border border-radar" />
      <span aria-hidden className="absolute inset-[16.5%] rounded-pill border border-radar" />
      <span aria-hidden className="absolute inset-[33%] rounded-pill border border-dashed border-radar-dash" />
      {!listening && (
        <>
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-radar-axis" />
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-radar-axis" />
        </>
      )}
      <span
        aria-hidden
        className="bs-motion absolute inset-0 rounded-pill"
        style={{
          background: sweep,
          animation: reduced ? undefined : `bs-sweep ${listening ? 2.6 : 3}s linear infinite`,
        }}
      />
      {!listening && (
        <>
          <span
            aria-hidden
            className="absolute left-[25.6%] top-[23.2%] size-[7px] rounded-pill bg-blue shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-blue)_15%,transparent)]"
          />
          <span
            aria-hidden
            className="absolute right-[20.8%] top-[60%] size-1.5 rounded-pill bg-green-bright shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-green-bright)_15%,transparent)]"
          />
        </>
      )}

      {/* Idle: the calm heartbeat of the home screen. */}
      {!listening && !reduced &&
        [0, 1.2].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute rounded-pill border-2 border-blue"
            style={{ width: core, height: core }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 2.4, ease: "easeOut", repeat: Infinity, delay }}
          />
        ))}

      {/* Listening: one ring per beat of the real microphone level. */}
      {listening &&
        rings.map((ring) => (
          <motion.span
            key={ring.id}
            aria-hidden
            className="absolute rounded-pill border-[3px] border-blue"
            style={{ width: core, height: core }}
            initial={{ scale: 1, opacity: 0.3 + ring.strength * 0.4 }}
            animate={{ scale: 2.2 + ring.strength * 0.8, opacity: 0 }}
            transition={{ duration: RING_LIFE_S, ease: "easeOut" }}
            onAnimationComplete={() =>
              setRings((current) => current.filter((r) => r.id !== ring.id))
            }
          />
        ))}

      <div className="relative">{children}</div>
    </div>
  );
}

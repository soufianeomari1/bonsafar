"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useReducedMotion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic, type HapticPattern } from "@/lib/haptics";
import { useT } from "@/lib/i18n/provider";
import type { TranslationKey } from "@/lib/i18n";
import { EASE_DEFAULT, SPRING_DEFAULT } from "@/lib/motion";

/**
 * Safar, the BonSafar mascot.
 * Geometry and motion: design/motion/README.md and safar-states.html.
 * The face crossfades in 120ms. The body springs into the new pose, then
 * the state's loop takes over. prefers-reduced-motion: the pose, no loop.
 */

export const SAFAR_STATES = ["idle", "listening", "thinking", "found", "oops", "bye"] as const;

export type SafarState = (typeof SAFAR_STATES)[number];

export type SafarProps = {
  state?: SafarState;
  /** Rendered size in px. The viewBox stays 200. */
  size?: number;
  /** Resting tilt in degrees. The state loops are offsets of this. */
  tilt?: number;
  /** Voice volume, 0 to 1. Drives the listening arcs only. */
  level?: number;
  /** The pose without any loop, as with reduced motion. For a second Safar on a screen. */
  still?: boolean;
  className?: string;
};

const BODY =
  "M80,45 H120 A30,30 0 0 1 150,75 V105 A30,30 0 0 1 130,131 L140,160 Q118,156 108,135 H80 A30,30 0 0 1 50,105 V75 A30,30 0 0 1 80,45 Z";
const WING =
  "M54,84 C42,78 24,76 12,82 C9,88 12,94 18,95 C14,100 17,106 25,106 C23,111 28,115 35,114 C42,113 49,108 54,104 Z";

/** The one face color that is not a token: the tongue in safar-states.html. */
const TONGUE = "#FF8FA3";

const LABEL: Record<SafarState, TranslationKey> = {
  idle: "safar.idle",
  listening: "safar.listening",
  thinking: "safar.thinking",
  found: "safar.found",
  oops: "safar.oops",
  bye: "safar.bye",
};

const HAPTIC_ON_ENTER: Partial<Record<SafarState, HapticPattern>> = {
  listening: "start",
  found: "success",
  oops: "warn",
};

const INK = "fill-none stroke-ink";
const OUTLINE = "fill-card stroke-ink";

type Pose = {
  x: number;
  y: number;
  rotate: number;
  scaleX: number;
  scaleY: number;
};

type LoopPose = {
  x: number | number[];
  y: number | number[];
  rotate: number | number[];
  scaleX: number | number[];
  scaleY: number | number[];
};

/** Reference rotations assume a -12° tilt. Shift them with the tilt prop. */
function shift(tilt: number): number {
  return tilt + 12;
}

function restPose(state: SafarState, tilt: number): Pose {
  const d = shift(tilt);
  const flat = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  switch (state) {
    case "idle":
      return { ...flat, rotate: -12 + d };
    case "listening":
    case "thinking":
    case "found":
      return { ...flat, rotate: -10 + d };
    case "oops":
      return { ...flat, rotate: -8 + d };
    case "bye":
      return { x: -26, y: 14, rotate: -18 + d, scaleX: 1, scaleY: 1 };
  }
}

function loopPose(state: SafarState, tilt: number): LoopPose | null {
  const d = shift(tilt);
  switch (state) {
    case "idle":
      return {
        x: 0,
        y: [0, -8, 0],
        rotate: [-12 + d, -8 + d, -12 + d],
        scaleX: 1,
        scaleY: 1,
      };
    case "found":
      return {
        x: 0,
        y: [0, -22, 0, 0, 0],
        rotate: [-10 + d, -4 + d, -10 + d, -10 + d, -10 + d],
        scaleX: [1, 1.04, 1.06, 1, 1],
        scaleY: [1, 1.04, 0.94, 1, 1],
      };
    case "oops":
      return {
        x: [0, -4, 4, -4, 4, -4, 0, 0],
        y: 0,
        rotate: [-8 + d, -11 + d, -5 + d, -11 + d, -5 + d, -11 + d, -8 + d, -8 + d],
        scaleX: 1,
        scaleY: 1,
      };
    case "bye":
      return {
        x: [-26, 18, -26],
        y: [14, -12, 14],
        rotate: [-18 + d, -6 + d, -18 + d],
        scaleX: 1,
        scaleY: 1,
      };
    default:
      return null;
  }
}

function loopTransition(state: SafarState): Transition | null {
  switch (state) {
    case "idle":
      return { duration: 3.2, ease: "easeInOut", repeat: Infinity, times: [0, 0.5, 1] };
    case "found":
      return {
        duration: 1.6,
        ease: EASE_DEFAULT,
        repeat: Infinity,
        times: [0, 0.2, 0.4, 0.55, 1],
      };
    case "oops":
      return {
        duration: 2.2,
        ease: "easeInOut",
        repeat: Infinity,
        times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1],
      };
    case "bye":
      return { duration: 3, ease: "easeInOut", repeat: Infinity, times: [0, 0.5, 1] };
    default:
      return null;
  }
}

function wingSeconds(state: SafarState): number {
  if (state === "listening" || state === "found") return 0.26;
  if (state === "thinking") return 2.4;
  return 0.9;
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

const FADE: Transition = { duration: 0.12, ease: "easeOut" };
const FADE_REDUCED: Transition = { duration: 0.2, ease: "easeOut" };

export function Safar({
  state = "idle",
  size = 112,
  tilt = -12,
  level = 1,
  still = false,
  className,
}: SafarProps) {
  const t = useT();
  const reduced = useReducedMotion() || still;
  const controls = useAnimation();
  const previous = useRef<{ state: SafarState; tilt: number } | null>(null);
  const volume = clamp01(level);
  const fade = reduced ? FADE_REDUCED : FADE;
  const droop = state === "oops";

  useEffect(() => {
    const pattern = HAPTIC_ON_ENTER[state];
    if (pattern) haptic(pattern);
    // Fire once per entry, including the first mount. Strict mode re-runs
    // this effect; the haptic throttle keeps a single pulse.
  }, [state]);

  useEffect(() => {
    const rest = restPose(state, tilt);
    const changed =
      previous.current !== null &&
      (previous.current.state !== state || previous.current.tilt !== tilt);
    previous.current = { state, tilt };
    let alive = true;

    const startLoop = () => {
      if (!alive || reduced) return;
      const loop = loopPose(state, tilt);
      const timing = loopTransition(state);
      if (!loop || !timing) return;
      void controls.start(loop, timing).catch(() => {});
    };

    if (reduced) {
      void controls.start(rest, FADE_REDUCED).catch(() => {});
    } else if (changed) {
      void controls
        .start(rest, SPRING_DEFAULT)
        .then(startLoop)
        .catch(() => {});
    } else {
      startLoop();
    }

    return () => {
      alive = false;
    };
  }, [controls, reduced, state, tilt]);

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Trail active={state === "bye"} reduced={!!reduced} fade={fade} />
      <Sparkles active={state === "found"} reduced={!!reduced} fade={fade} />

      <motion.div
        className="h-full w-full"
        initial={restPose(state, tilt)}
        animate={controls}
        style={{ transformOrigin: "50% 50%" }}
      >
        <svg
          role="img"
          aria-label={t(LABEL[state])}
          viewBox="0 0 200 200"
          width={size}
          height={size}
          className="overflow-visible"
        >
          <SoundArcs active={state === "listening"} level={volume} reduced={!!reduced} fade={fade} />
          <ThoughtDots active={state === "thinking"} reduced={!!reduced} fade={fade} />

          <Wing mirrored droop={droop} seconds={wingSeconds(state)} reduced={!!reduced} size={size} />
          <Wing droop={droop} seconds={wingSeconds(state)} reduced={!!reduced} size={size} />

          <path d={BODY} className="fill-blue stroke-ink" strokeWidth={7} strokeLinejoin="round" />

          <Face state="idle" show={state === "idle"} fade={fade} blink={!reduced} />
          <Face state="listening" show={state === "listening"} fade={fade} />
          <Face state="thinking" show={state === "thinking"} fade={fade} />
          <Face state="found" show={state === "found"} fade={fade} />
          <Face state="oops" show={state === "oops"} fade={fade} />
          <Face state="bye" show={state === "bye"} fade={fade} />
        </svg>
      </motion.div>
    </div>
  );
}

function Wing({
  mirrored = false,
  droop,
  seconds,
  reduced,
  size,
}: {
  mirrored?: boolean;
  droop: boolean;
  seconds: number;
  reduced: boolean;
  size: number;
}) {
  const droopY = (16 * size) / 200;
  const still = droop || reduced;

  return (
    <g transform={mirrored ? "translate(200 -10) scale(-1 1)" : undefined}>
      <motion.g
        initial={false}
        animate={
          still
            ? { rotate: droop ? 18 : 0, y: droop ? droopY : 0 }
            : { rotate: [0, -18, 0], y: 0 }
        }
        transition={
          still
            ? reduced
              ? FADE_REDUCED
              : SPRING_DEFAULT
            : { duration: seconds, ease: "easeInOut", repeat: Infinity, times: [0, 0.5, 1] }
        }
        style={{ transformBox: "fill-box", transformOrigin: "100% 50%" }}
      >
        <path d={WING} className={OUTLINE} strokeWidth={7} strokeLinejoin="round" />
      </motion.g>
    </g>
  );
}

function Face({
  state,
  show,
  fade,
  blink = false,
}: {
  state: SafarState;
  show: boolean;
  fade: Transition;
  blink?: boolean;
}) {
  return (
    <motion.g initial={false} animate={{ opacity: show ? 1 : 0 }} transition={fade}>
      {state === "idle" && <IdleFace blink={blink && show} />}
      {state === "listening" && <ListeningFace />}
      {state === "thinking" && <ThinkingFace />}
      {state === "found" && <FoundFace />}
      {state === "oops" && <OopsFace />}
      {state === "bye" && <ByeFace />}
    </motion.g>
  );
}

function IdleFace({ blink }: { blink: boolean }) {
  return (
    <>
      <motion.g
        animate={blink ? { scaleY: [1, 1, 0.15, 1] } : { scaleY: 1 }}
        transition={
          blink
            ? { duration: 4.5, ease: "easeInOut", repeat: Infinity, times: [0, 0.9, 0.94, 1] }
            : FADE_REDUCED
        }
        style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
      >
        <path
          d="M74,89 Q82,78 90,89 M108,89 Q116,78 124,89"
          className={INK}
          strokeWidth={6}
          strokeLinecap="round"
        />
      </motion.g>
      <path
        d="M88,104 Q99,116 110,104"
        className={INK}
        strokeWidth={6}
        strokeLinecap="round"
      />
    </>
  );
}

function ListeningFace() {
  return (
    <>
      <circle cx={82} cy={86} r={6.5} className="fill-ink" />
      <circle cx={116} cy={86} r={6.5} className="fill-ink" />
      <circle cx={84} cy={84} r={2} className="fill-card" />
      <circle cx={118} cy={84} r={2} className="fill-card" />
      <ellipse cx={99} cy={108} rx={6} ry={7} className="fill-ink" />
    </>
  );
}

function ThinkingFace() {
  return (
    <>
      <circle cx={88} cy={80} r={6} className="fill-ink" />
      <circle cx={122} cy={80} r={6} className="fill-ink" />
      <path d="M90,108 Q100,104 110,108" className={INK} strokeWidth={6} strokeLinecap="round" />
    </>
  );
}

function FoundFace() {
  return (
    <>
      <path
        d="M74,89 Q82,77 90,89 M108,89 Q116,77 124,89"
        className={INK}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <path
        d="M86,101 Q99,124 112,101 Z"
        className="fill-ink stroke-ink"
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path d="M92,110 Q99,116 106,110" fill={TONGUE} />
    </>
  );
}

function OopsFace() {
  return (
    <>
      <path
        d="M162,50 Q172,66 162,74 Q152,66 162,50 Z"
        className="fill-blue-soft stroke-ink"
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path
        d="M72,78 L90,72 M108,72 L126,78"
        className={INK}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx={82} cy={88} r={5.5} className="fill-ink" />
      <circle cx={116} cy={88} r={5.5} className="fill-ink" />
      <path
        d="M86,110 Q92,103 98,110 Q104,117 110,110"
        className={INK}
        strokeWidth={5.5}
        strokeLinecap="round"
      />
    </>
  );
}

function ByeFace() {
  return (
    <>
      <path d="M74,89 Q82,78 90,89" className={INK} strokeWidth={6} strokeLinecap="round" />
      <circle cx={116} cy={86} r={6.5} className="fill-ink" />
      <path d="M86,102 Q99,118 114,102" className={INK} strokeWidth={6} strokeLinecap="round" />
    </>
  );
}

function SoundArcs({
  active,
  level,
  reduced,
  fade,
}: {
  active: boolean;
  level: number;
  reduced: boolean;
  fade: Transition;
}) {
  return (
    <motion.g initial={false} animate={{ opacity: active ? 1 : 0 }} transition={fade}>
      <Arc
        d="M162,74 Q174,92 162,110"
        delay={0}
        level={level}
        active={active}
        reduced={reduced}
      />
      <Arc
        d="M176,62 Q196,92 176,122"
        delay={0.3}
        level={level}
        active={active}
        reduced={reduced}
      />
    </motion.g>
  );
}

function Arc({
  d,
  delay,
  level,
  active,
  reduced,
}: {
  d: string;
  delay: number;
  level: number;
  active: boolean;
  reduced: boolean;
}) {
  const low = 0.15;
  const high = 0.15 + 0.85 * level;
  const scaleLow = 0.82;
  const scaleHigh = 0.82 + 0.18 * level;
  const pulsing = active && !reduced;

  return (
    <motion.path
      d={d}
      className="fill-none stroke-blue"
      strokeWidth={6}
      strokeLinecap="round"
      initial={false}
      animate={
        pulsing
          ? { opacity: [low, high, low], scale: [scaleLow, scaleHigh, scaleLow] }
          : { opacity: active ? high : 0, scale: active ? scaleHigh : scaleLow }
      }
      transition={
        pulsing
          ? { duration: 0.9, ease: "easeInOut", repeat: Infinity, delay, times: [0, 0.5, 1] }
          : FADE_REDUCED
      }
      style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }}
    />
  );
}

const DOTS = [
  { cx: 128, cy: 26, delay: 0 },
  { cx: 150, cy: 22, delay: 0.15 },
  { cx: 172, cy: 18, delay: 0.3 },
] as const;

function ThoughtDots({
  active,
  reduced,
  fade,
}: {
  active: boolean;
  reduced: boolean;
  fade: Transition;
}) {
  return (
    <motion.g initial={false} animate={{ opacity: active ? 1 : 0 }} transition={fade}>
      {DOTS.map((dot) => (
        <motion.circle
          key={dot.cx}
          cx={dot.cx}
          cy={dot.cy}
          r={7}
          className="fill-blue stroke-ink"
          strokeWidth={3}
          initial={false}
          animate={active && !reduced ? { y: [0, -9, 0, 0] } : { y: 0 }}
          transition={
            active && !reduced
              ? {
                  duration: 1.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: dot.delay,
                  times: [0, 0.3, 0.6, 1],
                }
              : FADE_REDUCED
          }
        />
      ))}
    </motion.g>
  );
}

const STARS = [
  {
    d: "M34,46 C36,54 39,57 47,59 C39,61 36,64 34,72 C32,64 29,61 21,59 C29,57 32,54 34,46 Z",
    viewBox: "19 44 30 30",
    className: "absolute -left-[8%] top-[2%] w-[24%]",
    delay: 0,
  },
  {
    d: "M168,34 C170,41 172,43 179,45 C172,47 170,49 168,56 C166,49 164,47 157,45 C164,43 166,41 168,34 Z",
    viewBox: "155 32 26 26",
    className: "absolute -right-[6%] -top-[4%] w-[18%]",
    delay: 0.5,
  },
  {
    d: "M172,150 C173,155 175,157 180,158 C175,159 173,161 172,166 C171,161 169,159 164,158 C169,157 171,155 172,150 Z",
    viewBox: "162 148 20 20",
    className: "absolute bottom-[14%] -right-[4%] w-[16%]",
    delay: 0.5,
  },
] as const;

function Sparkles({
  active,
  reduced,
  fade,
}: {
  active: boolean;
  reduced: boolean;
  fade: Transition;
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {STARS.map((star) => (
        <motion.svg
          key={star.viewBox}
          viewBox={star.viewBox}
          className={star.className}
          initial={false}
          animate={
            !active
              ? { opacity: 0, scale: 0.7, rotate: 0 }
              : reduced
                ? { opacity: 1, scale: 1, rotate: 0 }
                : { opacity: [0.4, 1, 0.4], scale: [0.7, 1.25, 0.7], rotate: [0, 25, 0] }
          }
          transition={
            active && !reduced
              ? {
                  duration: 1.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: star.delay,
                  times: [0, 0.5, 1],
                }
              : fade
          }
          style={{ transformOrigin: "50% 50%" }}
        >
          <path d={star.d} className="fill-yellow stroke-ink" strokeWidth={2.5} strokeLinejoin="round" />
        </motion.svg>
      ))}
    </div>
  );
}

function Trail({
  active,
  reduced,
  fade,
}: {
  active: boolean;
  reduced: boolean;
  fade: Transition;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 210"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
    >
      <motion.path
        d="M8,180 C40,170 60,150 84,128"
        className="fill-none stroke-ink"
        strokeOpacity={0.55}
        strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray="0.1 15"
        initial={false}
        animate={
          active && !reduced
            ? { strokeDashoffset: [0, -30], opacity: 1 }
            : { strokeDashoffset: 0, opacity: active ? 1 : 0 }
        }
        transition={
          active && !reduced
            ? { duration: 1.2, ease: "linear", repeat: Infinity }
            : fade
        }
      />
    </svg>
  );
}

export type SafarBubbleProps = {
  children: React.ReactNode;
  state?: SafarState;
  size?: number;
  tilt?: number;
  level?: number;
  still?: boolean;
  className?: string;
  bubbleClassName?: string;
};

/**
 * Safar beside a white bubble. The 6px corner is on his side
 * (bottom-inline-start), so it follows RTL.
 */
export function SafarBubble({
  children,
  state = "idle",
  size = 96,
  tilt,
  level,
  still,
  className,
  bubbleClassName,
}: SafarBubbleProps) {
  return (
    <div className={cn("flex items-end gap-2.5", className)}>
      <Safar state={state} size={size} tilt={tilt} level={level} still={still} className="shrink-0" />
      <div
        className={cn(
          "mb-3.5 min-w-0 flex-1 bg-card px-4 py-3.5 shadow-soft",
          bubbleClassName
        )}
        style={{
          borderStartStartRadius: 22,
          borderStartEndRadius: 22,
          borderEndEndRadius: 22,
          borderEndStartRadius: 6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

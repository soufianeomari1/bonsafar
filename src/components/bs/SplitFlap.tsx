"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

const DIGITS = "0123456789";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const FLIPS = 3;
const FLIP_MS = 90;
const CELL_OFFSET_MS = 30;

function randomGlyph(target: string): string {
  if (DIGITS.includes(target)) {
    return DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }
  const upper = target.toUpperCase();
  if (LETTERS.includes(upper)) {
    return LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return target;
}

export type SplitFlapProps = {
  /** Final text. Already formatted by code: prices and dates never come from a model. */
  value: string;
  className?: string;
  cellClassName?: string;
};

/**
 * A4, the departure board. Characters tumble through a couple of random
 * glyphs before settling, with a single `tick` vibration at the end.
 */
export function SplitFlap(props: SplitFlapProps) {
  // Remounting on a new value is what restarts the animation, and it keeps the
  // whole sequence out of effect-driven state updates.
  return <Flap key={props.value} {...props} />;
}

function Flap({ value, className, cellClassName }: SplitFlapProps) {
  const reduced = useReducedMotion();
  const target = useMemo(() => Array.from(value), [value]);
  // Starts on the final value: the prerender must not call Math.random().
  const [display, setDisplay] = useState<string[]>(target);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reduced) {
      timers.push(
        setTimeout(() => {
          setDisplay(target);
          haptic("tick");
        }, 0)
      );
      return () => timers.forEach(clearTimeout);
    }

    const setChar = (index: number, char: string) =>
      setDisplay((prev) => {
        const next = [...prev];
        next[index] = char;
        return next;
      });

    target.forEach((char, index) => {
      for (let step = 0; step < FLIPS; step++) {
        timers.push(
          setTimeout(
            () => setChar(index, randomGlyph(char)),
            index * CELL_OFFSET_MS + step * FLIP_MS
          )
        );
      }
      timers.push(
        setTimeout(
          () => setChar(index, char),
          index * CELL_OFFSET_MS + FLIPS * FLIP_MS
        )
      );
    });

    const settledAt =
      (target.length - 1) * CELL_OFFSET_MS + FLIPS * FLIP_MS + FLIP_MS;
    timers.push(setTimeout(() => haptic("tick"), settledAt));

    return () => timers.forEach(clearTimeout);
  }, [target, reduced]);

  return (
    <span
      // Times and prices always read left to right, even on an RTL screen.
      dir="ltr"
      className={cn("inline-flex items-baseline tabular", className)}
      aria-label={value}
    >
      {display.map((char, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "inline-block [perspective:200px]",
            char === " " ? "w-[0.3em]" : "",
            cellClassName
          )}
        >
          <motion.span
            key={`${index}-${char}`}
            className="inline-block"
            initial={{ rotateX: 90, opacity: 0.35 }}
            animate={{ rotateX: 0, opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

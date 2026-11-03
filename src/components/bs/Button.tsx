"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { haptic, type HapticPattern } from "@/lib/haptics";
import { PRESS_SCALE, PRESS_TRANSITION } from "@/lib/motion";

const button = cva(
  "inline-flex select-none items-center justify-center gap-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "h-14 rounded-button bg-ink px-6 text-[17px] text-card",
        secondary:
          "h-14 rounded-button border border-line bg-card px-6 text-[17px] text-ink",
        quiet: "h-14 rounded-button bg-fill px-6 text-[17px] text-ink",
        link: "h-12 px-3 text-base text-ink underline underline-offset-4",
      },
      full: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", full: false },
  }
);

export type ButtonProps = HTMLMotionProps<"button"> &
  VariantProps<typeof button> & {
    /** Vibration fired on press. Pass null for a button that must stay silent. */
    feedback?: HapticPattern | null;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, full, feedback = "tap", onClick, type, ...props },
    ref
  ) {
    const reduced = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        type={type ?? "button"}
        className={cn(button({ variant, full }), className)}
        whileTap={reduced ? undefined : { scale: PRESS_SCALE }}
        transition={PRESS_TRANSITION}
        onClick={(event) => {
          if (feedback) haptic(feedback);
          onClick?.(event);
        }}
        {...props}
      />
    );
  }
);

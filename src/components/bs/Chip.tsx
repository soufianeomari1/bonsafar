"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { PRESS_SCALE, PRESS_TRANSITION } from "@/lib/motion";

export type ChipProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  selected?: boolean;
  /** Static chips (the ones the understood screen fills) are not buttons. */
  interactive?: boolean;
};

/** Small white pill with an optional coloured icon, used for intent chips. */
export function Chip({
  icon,
  selected = false,
  interactive = true,
  className,
  children,
  onClick,
  ...props
}: ChipProps) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-pill border bg-card px-3.5 py-2 text-[15px] font-medium text-ink shadow-soft",
        selected ? "border-ink" : "border-line",
        !interactive && "cursor-default disabled:opacity-100",
        className
      )}
      whileTap={reduced || !interactive ? undefined : { scale: PRESS_SCALE }}
      transition={PRESS_TRANSITION}
      onClick={(event) => {
        if (interactive) haptic("select");
        onClick?.(event);
      }}
      {...props}
    >
      {icon}
      {/* City names, dates and codes keep their own direction inside an RTL screen. */}
      <bdi>{children}</bdi>
    </motion.button>
  );
}

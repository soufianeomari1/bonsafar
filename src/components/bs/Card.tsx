"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";
import { enterTransition, enterVariants } from "@/lib/motion";

export type CardProps = HTMLMotionProps<"div"> & {
  /** The one "AI" card of a screen gets the halo, and nothing else. */
  halo?: boolean;
  /** Animate on mount. Off inside a staggered list, which drives its children. */
  animate?: boolean;
};

export function Card({
  halo = false,
  animate = true,
  className,
  children,
  ...props
}: CardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "rounded-card bg-card p-4 shadow-soft",
        halo && "ring-2 ring-violet/25 ring-offset-2 ring-offset-bg",
        className
      )}
      variants={enterVariants(reduced)}
      initial={animate ? "hidden" : false}
      animate={animate ? "visible" : undefined}
      transition={enterTransition(reduced)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

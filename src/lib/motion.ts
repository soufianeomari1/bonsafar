import type { Transition, Variants } from "motion/react";

/** Motion values of docs/parcours-et-interfaces.md section 3. */

export const EASE_DEFAULT = [0.23, 1, 0.32, 1] as const;
export const EASE_SHEET = [0.32, 0.72, 0, 1] as const;

export const SPRING_DEFAULT: Transition = {
  type: "spring",
  duration: 0.5,
  bounce: 0.15,
};

/** Sheets and drawers. */
export const SHEET_TRANSITION: Transition = {
  duration: 0.5,
  ease: EASE_SHEET,
};

/** One element appearing. */
export const ENTER_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

/** Same, but every motion replaced by a 200ms fade. */
export const REDUCED_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const STAGGER_SECONDS = 0.055;

export const PRESS_SCALE = 0.97;

export const PRESS_TRANSITION: Transition = { duration: 0.1, ease: "easeOut" };
export const RELEASE_TRANSITION: Transition = { duration: 0.2, ease: "easeOut" };

export function enterVariants(reduced: boolean | null): Variants {
  return reduced ? REDUCED_VARIANTS : ENTER_VARIANTS;
}

export function enterTransition(reduced: boolean | null): Transition {
  return reduced ? { duration: 0.2 } : SPRING_DEFAULT;
}

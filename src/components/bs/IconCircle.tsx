import type { Icon, IconWeight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/** Tinted circles of the mockups: a Phosphor "fill" icon on a soft background. */
export const ICON_CIRCLE_TONES = {
  blue: "bg-blue-soft text-blue",
  green: "bg-green-soft text-green",
  orange: "bg-orange-soft text-orange",
  red: "bg-red-soft text-red",
  neutral: "bg-fill text-ink",
  ink: "bg-ink text-card",
  violet: "bg-violet/15 text-violet",
} as const;

export type IconCircleTone = keyof typeof ICON_CIRCLE_TONES;

export type IconCircleProps = {
  icon: Icon;
  tone?: IconCircleTone;
  /** 36 to 48 in the design system. */
  size?: 36 | 40 | 44 | 48;
  weight?: IconWeight;
  className?: string;
};

export function IconCircle({
  icon: IconComponent,
  tone = "blue",
  size = 40,
  weight = "light",
  className,
}: IconCircleProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill",
        ICON_CIRCLE_TONES[tone],
        className
      )}
      style={{ width: size, height: size }}
    >
      <IconComponent size={Math.round(size * 0.54)} weight={weight} />
    </span>
  );
}

import { AirplaneTilt, Play } from "@phosphor-icons/react/dist/ssr";
import type React from "react";
import { JuryOnly } from "@/components/jury/JuryOnly";
import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  sm: { box: 32, radius: 10, icon: 18 },
  md: { box: 34, radius: 10, icon: 20 },
  lg: { box: 64, radius: 18, icon: 36 },
} as const;

const WING =
  "M54,84 C42,78 24,76 12,82 C9,88 12,94 18,95 C14,100 17,106 25,106 C23,111 28,115 35,114 C42,113 49,108 54,104 Z";

/** Safar with his wings, at rest. The logo never floats or flaps. */
export function SafarLogo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn("block shrink-0", className)}
    >
      <g className="fill-card stroke-ink" strokeWidth={7} strokeLinejoin="round">
        <path d={WING} />
        <g transform="translate(200,-10) scale(-1,1)">
          <path d={WING} />
        </g>
      </g>
      <path
        d="M80,45 H120 A30,30 0 0 1 150,75 V105 A30,30 0 0 1 130,131 L140,160 Q118,156 108,135 H80 A30,30 0 0 1 50,105 V75 A30,30 0 0 1 80,45 Z"
        className="fill-blue stroke-ink"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M74,89 Q82,78 90,89 M108,89 Q116,78 124,89 M88,104 Q99,116 110,104"
        className="fill-none stroke-ink"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** "BonSafar": Geist 800, tight, "Bon" in ink and "Safar" in Safar blue. */
export function Wordmark({
  size = 20,
  mark = 28,
  children,
  className,
}: {
  /** Font size of the word, px. */
  size?: number;
  /** Size of the static Safar, px. */
  mark?: number;
  /** Optional tagline after the word. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <SafarLogo size={mark} />
      <span
        dir="ltr"
        className="shrink-0 font-sans font-extrabold leading-none tracking-[-0.04em] text-ink"
        style={{ fontSize: size }}
      >
        Bon<span className="text-blue">Safar</span>
      </span>
      {children}
    </span>
  );
}

/** Black rounded square with the white plane, the BonSafar mark. */
export function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof LOGO_SIZES;
  className?: string;
}) {
  const s = LOGO_SIZES[size];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-ink text-card",
        size === "lg" && "shadow-[0_12px_30px_rgba(11,11,15,0.25)]",
        className
      )}
      style={{ width: s.box, height: s.box, borderRadius: s.radius }}
    >
      <AirplaneTilt size={s.icon} weight="fill" />
    </span>
  );
}

/**
 * "Mode jury" pill, shown only to a browser that opened /jury with its key.
 * A plain link on purpose: the judges' board needs a full navigation.
 */
export function JuryPill({
  label,
  withIcon = false,
  dot = false,
  className,
}: {
  label: string;
  withIcon?: boolean;
  /** Small blue dot, as on the home header. */
  dot?: boolean;
  className?: string;
}) {
  return (
    <JuryOnly>
      <a
        href="/jury"
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-pill bg-card font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.06)]",
          withIcon ? "h-9 px-3.5 text-sm" : "h-[34px] px-3 text-[13px]",
          className
        )}
      >
        {dot && <span aria-hidden className="size-[7px] rounded-pill bg-blue" />}
        {withIcon && <Play size={14} weight="fill" className="text-blue" aria-hidden />}
        {label}
      </a>
    </JuryOnly>
  );
}

/** Renders `**bold**` runs of a dictionary string. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-bold">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

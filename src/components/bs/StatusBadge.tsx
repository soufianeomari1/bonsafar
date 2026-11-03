import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em]",
  {
    variants: {
      tone: {
        done: "bg-green-soft text-green",
        running: "bg-blue-soft text-blue",
        todo: "bg-fill text-muted",
        gate: "bg-yellow text-ink",
        warn: "bg-orange-soft text-orange",
        blocked: "bg-red-soft text-red",
      },
    },
    defaultVariants: { tone: "todo" },
  }
);

export type StatusBadgeProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badge> & {
    /** Small coloured dot before the label, as on the flight plan. */
    dot?: boolean;
  };

/** Departure-board style status word, always in Geist Mono. */
export function StatusBadge({
  tone,
  dot = false,
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)} {...props}>
      {dot && (
        <span
          aria-hidden
          className="size-1.5 rounded-pill bg-current opacity-80"
        />
      )}
      {children}
    </span>
  );
}

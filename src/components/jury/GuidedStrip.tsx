import { Check } from "@phosphor-icons/react";
import { JURY_COPY } from "@/lib/jury/copy";
import { cn } from "@/lib/utils";

/** The five steps of the judges' path. `current` is 1 to 5, or 0 before a run. */
export function GuidedStrip({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label={JURY_COPY.stepsLabel} className={className}>
      <ol className="flex items-stretch gap-1.5">
        {JURY_COPY.steps.map((label, index) => {
          const step = index + 1;
          const done = current > step;
          const now = current === step;
          return (
            <li
              key={label}
              aria-current={now ? "step" : undefined}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-2 rounded-[14px] px-2 py-1.5 transition-colors duration-300",
                now ? "bg-card shadow-soft" : "bg-card/55",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-[7px] font-mono text-[13px] font-bold transition-colors duration-300",
                  done && "bg-ink text-card",
                  now && "bg-yellow text-ink",
                  !done && !now && "bg-yellow/35 text-ink/70",
                )}
              >
                {done ? <Check size={14} weight="bold" /> : step}
              </span>
              <span
                className={cn(
                  "min-w-0 text-[12.5px] font-semibold leading-tight",
                  now ? "text-ink" : done ? "text-ink/80" : "text-muted",
                )}
              >
                <span className="sr-only">
                  {done ? "Done: " : now ? "Now: " : "Next: "}
                </span>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

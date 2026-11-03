import { cn } from "@/lib/utils";

export type JuryFrameProps = {
  /** The phone, 390px wide, on the left. */
  children: React.ReactNode;
  /** "Under the hood" content. Filled in block 3. */
  panel?: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
};

/**
 * J2, the 1440px desktop frame the judges see: phone on the left, live
 * "Under the hood" panel on the right. Always English.
 */
export function JuryFrame({
  children,
  panel,
  header,
  className,
}: JuryFrameProps) {
  return (
    <div className={cn("min-h-dvh bg-fill", className)}>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-8 py-8">
        {header}
        <div className="grid gap-8 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="relative flex h-[844px] w-[390px] flex-col overflow-hidden rounded-[44px] bg-bg shadow-soft">
            {children}
          </div>
          <section
            aria-label="Under the hood"
            className="flex min-h-[844px] flex-col gap-4 rounded-sheet bg-card p-6 shadow-soft"
          >
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-muted">
              Under the hood
            </h2>
            {panel ?? (
              <p className="text-sm text-muted">
                Live model calls, latency and measured cost appear here during a
                run.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

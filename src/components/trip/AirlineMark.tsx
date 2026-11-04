import { airlineMarks } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Yellow Flighty-style code, or the airline name when no code can be read. */
export function AirlineMarks({
  flights,
  carriers,
  className,
}: {
  flights: string[];
  carriers: string[];
  className?: string;
}) {
  const marks = airlineMarks(flights, carriers);
  if (!marks.length) return null;
  return (
    <span className={cn("inline-flex min-w-0 flex-nowrap items-center gap-1", className)}>
      {marks.map((mark, index) =>
        mark.code ? (
          <span
            key={`${mark.code}-${index}`}
            title={mark.name ?? undefined}
            aria-label={mark.name ? `${mark.code}, ${mark.name}` : undefined}
            className="rounded-[5px] bg-yellow px-1.5 py-0.5 font-mono text-[11px] font-semibold"
          >
            <bdi>{mark.code}</bdi>
          </span>
        ) : (
          <span key={`${mark.name}-${index}`} title={mark.name ?? undefined} className="truncate text-xs text-muted">
            {mark.name}
          </span>
        ),
      )}
    </span>
  );
}

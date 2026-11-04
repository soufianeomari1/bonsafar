import { cn } from "@/lib/utils";

/** Yellow boarding-gate sign: a tiny "GATE" over the number, in Geist Mono. */
export function GateBadge({
  number,
  size = "md",
  className,
}: {
  number: number;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-[8px] bg-yellow font-mono font-bold leading-none text-ink",
        size === "md" ? "h-10 w-11 gap-0.5" : "h-7 w-8 gap-px",
        className,
      )}
    >
      <span className={cn("tracking-[0.12em]", size === "md" ? "text-[8px]" : "text-[6px]")}>GATE</span>
      <span className={size === "md" ? "text-[17px]" : "text-[12px]"}>{number}</span>
    </span>
  );
}

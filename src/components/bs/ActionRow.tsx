import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Two actions sit side by side while each label fits on one line.
 * When they do not, they stack, full width, still one line each.
 */
export function ActionRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}

/** Put this on each button inside an ActionRow. */
export const actionButtonClass = "h-12 min-w-fit flex-auto whitespace-nowrap px-4";

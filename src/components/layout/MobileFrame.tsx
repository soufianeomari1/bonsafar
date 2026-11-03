import { cn } from "@/lib/utils";

export type MobileFrameProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Inner background when the screen is not on the default grey. */
  surfaceClassName?: string;
};

/**
 * The 390px phone. Full bleed on a phone, a centred frame on a desktop so the
 * judges see the real mobile layout.
 */
export function MobileFrame({
  children,
  className,
  surfaceClassName,
  ...props
}: MobileFrameProps) {
  return (
    <div
      className={cn(
        "flex min-h-dvh justify-center bg-fill sm:items-center sm:py-8",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "relative flex w-full max-w-[390px] flex-col overflow-hidden bg-bg sm:h-[844px] sm:rounded-[44px] sm:shadow-soft",
          surfaceClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

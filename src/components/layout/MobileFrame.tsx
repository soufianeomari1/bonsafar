import { cn } from "@/lib/utils";

export type MobileFrameProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Inner background when the screen is not on the default grey. */
  surfaceClassName?: string;
};

/**
 * The only place that sets the phone width. Below 768px it is the whole
 * screen with no frame; from 768px up it becomes a centred 390 x 844 phone
 * so the judges see the real mobile layout. Screens inside are fluid and
 * fill it: they never set their own width.
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
        "flex min-h-dvh justify-center bg-bg md:items-center md:bg-fill md:py-8",
        className
      )}
      {...props}
    >
      <div
        data-phone-root=""
        className={cn(
          "relative flex h-dvh w-full flex-col overflow-hidden bg-bg md:h-[844px] md:w-[390px] md:rounded-[44px] md:shadow-soft",
          surfaceClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}

import { AirplaneTilt, Play } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  sm: { box: 32, radius: 10, icon: 18 },
  md: { box: 34, radius: 10, icon: 20 },
  lg: { box: 64, radius: 18, icon: 36 },
} as const;

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
 * "Mode jury" pill. A plain link on purpose: `?jury=1` is read once per page
 * load, so the judges' mode needs a full navigation.
 */
export function JuryPill({
  label,
  withIcon = false,
  className,
}: {
  label: string;
  withIcon?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- needs a full page load
    <a
      href="/?jury=1"
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-pill bg-card font-semibold text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.06)]",
        withIcon ? "h-9 px-3.5 text-sm" : "h-[34px] px-3 text-[13px]",
        className
      )}
    >
      {withIcon && <Play size={14} weight="fill" className="text-blue" aria-hidden />}
      {label}
    </a>
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

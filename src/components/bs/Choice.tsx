"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { PRESS_SCALE, PRESS_TRANSITION } from "@/lib/motion";

type BaseProps = {
  selected: boolean;
  onSelect: () => void;
  className?: string;
  children: React.ReactNode;
  dir?: "ltr" | "rtl";
  lang?: string;
};

/** Compact radio button of a 2-column grid (passport, airport). 52px high. */
export function ChoiceButton({ selected, onSelect, className, children, ...rest }: BaseProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      whileTap={reduced ? undefined : { scale: PRESS_SCALE }}
      transition={PRESS_TRANSITION}
      onClick={() => {
        haptic("select");
        onSelect();
      }}
      className={cn(
        "flex min-h-[52px] items-center justify-center gap-2 rounded-button-sm bg-card px-3 text-base text-ink",
        selected ? "border-2 border-ink font-bold" : "border border-line font-semibold",
        className
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  if (!selected) {
    return <span aria-hidden className="size-[22px] shrink-0 rounded-pill border-2 border-line" />;
  }
  return (
    <svg aria-hidden width={24} height={24} viewBox="0 0 24 24" className="shrink-0">
      <circle cx="12" cy="12" r="11" className="fill-ink" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        fill="none"
        className="stroke-card"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Large radio card with a title, a sample line and a round check (01a). */
export function ChoiceCard({
  selected,
  onSelect,
  className,
  title,
  subtitle,
  dir,
  lang,
  compact = false,
  titleArabic = false,
  subtitleArabic = false,
  enterDelay = 0,
}: Omit<BaseProps, "children"> & {
  title: string;
  subtitle?: string;
  /** 64px language row of screens/01a-onboarding.html. */
  compact?: boolean;
  titleArabic?: boolean;
  subtitleArabic?: boolean;
  enterDelay?: number;
}) {
  const reduced = useReducedMotion();
  const arabic = dir === "rtl";
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      dir={dir}
      lang={lang}
      initial={reduced ? false : { opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileTap={reduced ? undefined : { scale: PRESS_SCALE }}
      transition={
        reduced
          ? { duration: 0.2 }
          : {
              opacity: { duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: enterDelay },
              y: { duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: enterDelay },
              scale: PRESS_TRANSITION,
            }
      }
      onClick={() => {
        haptic("select");
        onSelect();
      }}
      className={cn(
        "flex items-center justify-between gap-3 bg-card px-4 text-start text-ink",
        compact ? "h-16 rounded-[18px]" : "min-h-20 rounded-[20px] py-3.5",
        selected ? "border-2 border-ink" : "border border-line",
        arabic && "font-arabic",
        className
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            compact ? "text-base" : "text-lg",
            titleArabic || arabic ? "font-arabic font-semibold" : "font-bold"
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span
            dir={subtitleArabic ? "rtl" : undefined}
            lang={subtitleArabic ? "ar" : undefined}
            className={cn(
              "text-muted",
              compact ? "text-[13px]" : "text-base",
              (subtitleArabic || arabic) && "font-arabic leading-relaxed"
            )}
          >
            {subtitle}
          </span>
        )}
      </span>
      <RadioMark selected={selected} />
    </motion.button>
  );
}

/** Two-option pill switcher on a grey track (darija script). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; arabic?: boolean }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-button-sm bg-fill p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              haptic("select");
              onChange(option.value);
            }}
            className={cn(
              "h-11 rounded-[10px] text-[15px] font-semibold text-ink transition-colors",
              selected && "bg-card shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
              option.arabic && "font-arabic text-base"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** The thin step segments. `label` makes them an accessible progress name. */
export function ProgressSegments({
  total,
  done,
  label,
  pendingClassName = "bg-line",
  className,
}: {
  total: number;
  done: number;
  label?: string;
  pendingClassName?: string;
  className?: string;
}) {
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("grid gap-1.5", className)}
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 rounded-pill transition-colors duration-300",
            index < done ? "bg-ink" : pendingClassName
          )}
        />
      ))}
    </div>
  );
}

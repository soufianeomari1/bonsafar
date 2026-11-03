"use client";

import { CheckCircle } from "@phosphor-icons/react";
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

/** Large radio card with a title, a sample line and a round check (mockup 01a). */
export function ChoiceCard({
  selected,
  onSelect,
  className,
  title,
  subtitle,
  dir,
  lang,
}: Omit<BaseProps, "children"> & { title: string; subtitle?: string }) {
  const reduced = useReducedMotion();
  const arabic = dir === "rtl";
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      dir={dir}
      lang={lang}
      whileTap={reduced ? undefined : { scale: PRESS_SCALE }}
      transition={PRESS_TRANSITION}
      onClick={() => {
        haptic("select");
        onSelect();
      }}
      className={cn(
        "flex min-h-20 items-center justify-between gap-3 rounded-[20px] bg-card px-4 py-3.5 text-start text-ink",
        selected ? "border-2 border-ink" : "border border-line",
        arabic && "font-arabic",
        className
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className={cn("text-lg", arabic ? "font-semibold" : "font-bold")}>{title}</span>
        {subtitle && (
          <span className={cn("text-base text-muted", arabic && "leading-relaxed")}>
            {subtitle}
          </span>
        )}
      </span>
      {selected ? (
        <CheckCircle size={28} weight="fill" className="shrink-0 text-ink" aria-hidden />
      ) : (
        <span
          aria-hidden
          className="size-[26px] shrink-0 rounded-pill border-2 border-knob-off"
        />
      )}
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

/** The 4 (or 3) thin segments above the main button. */
export function ProgressSegments({ total, done }: { total: number; done: number }) {
  return (
    <div
      aria-hidden
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1 rounded-[4px] transition-colors duration-300",
            index < done ? "bg-ink" : "bg-line"
          )}
        />
      ))}
    </div>
  );
}

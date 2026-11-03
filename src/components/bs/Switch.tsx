"use client";

import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  className?: string;
};

/**
 * A labelled toggle row (mockup 01b). The real control is a native checkbox
 * with the iOS 18 `switch` attribute, so iPhones give their own haptic tick.
 */
export function Switch({ checked, onChange, label, hint, className }: SwitchProps) {
  return (
    <label
      className={cn(
        "relative grid cursor-pointer grid-cols-[minmax(0,1fr)_52px] items-center gap-3 py-3",
        className
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-base font-bold">{label}</span>
        {hint && <span className="text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative block h-8 w-[52px] rounded-pill transition-colors duration-200",
          checked ? "bg-green-bright" : "bg-line"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-7 rounded-pill bg-card shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[inset-inline-start] duration-200 ease-bs",
            checked ? "start-[22px]" : "start-0.5"
          )}
        />
      </span>
      <input
        type="checkbox"
        role="switch"
        {...{ switch: "" }}
        checked={checked}
        onChange={(event) => {
          haptic("select");
          onChange(event.target.checked);
        }}
        className="absolute inset-0 size-full cursor-pointer opacity-0"
      />
    </label>
  );
}

/** The bordered card that groups switches, rows split by hairlines. */
export function SwitchGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-line bg-card px-3.5 py-0.5 [&>*+*]:border-t [&>*+*]:border-line">
      {children}
    </div>
  );
}

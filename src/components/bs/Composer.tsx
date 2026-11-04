"use client";

import { useEffect, useId, useState, type FocusEvent, type ReactNode, type Ref } from "react";
import { ArrowUp, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { haptic } from "@/lib/haptics";
import { SPRING_DEFAULT } from "@/lib/motion";
import { cn } from "@/lib/utils";

const EXAMPLE_MS = 3500;
const SLIDE_EASE = [0.23, 1, 0.32, 1] as const;

export type ComposerChip = {
  /** Visible label and, unless `value` is set, the text written into the field. */
  label: string;
  value?: string;
};

export type ComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Empty-field examples. They roll; they are never copied in on focus. */
  examples: string[];
  /** Shown above the field while the composer is focused. */
  chips?: ComposerChip[];
  /** Fixed accessible name. It does not change with the rolling example. */
  label: string;
  sendLabel: string;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
  /**
   * 60px slot beside the field for the desktop home
   * (design/motion/desktop/d1-home.html). The phone home leaves it empty:
   * the large microphone stays in the voice zone.
   */
  mic?: ReactNode;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
};

/**
 * The home text bar (design/motion/screens/02-home-v2.html): a 56px white
 * card, rolling examples, and a send button that wakes up when there is text.
 */
export function Composer({
  value,
  onValueChange,
  onSubmit,
  examples,
  chips = [],
  label,
  sendLabel,
  id,
  inputRef,
  mic,
  className,
  onFocusChange,
}: ComposerProps) {
  const reduced = useReducedMotion();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [focused, setFocused] = useState(false);
  const [index, setIndex] = useState(0);
  const filled = value.trim().length > 0;
  const rolling = reduced === false && !focused && !filled && examples.length > 1;
  const example = examples[rolling ? index % examples.length : 0] ?? "";

  useEffect(() => {
    if (!rolling) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % examples.length);
    }, EXAMPLE_MS);
    return () => window.clearInterval(timer);
  }, [rolling, examples.length]);

  function focusIn() {
    setFocused(true);
    onFocusChange?.(true);
  }

  function focusOut(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget;
    const form = event.currentTarget.closest("form");
    if (next instanceof Node && form?.contains(next)) return;
    setFocused(false);
    onFocusChange?.(false);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!filled) return;
        onSubmit(value);
      }}
      className={cn("flex items-end gap-2", className)}
    >
      {mic ? (
        <div className="flex size-[60px] shrink-0 items-center justify-center">{mic}</div>
      ) : null}
      <div className="min-w-0 flex-1">
        <AnimatePresence initial={false}>
          {focused && chips.length > 0 && (
            <motion.div
              initial={reduced === false ? { opacity: 0, y: 8 } : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced === false ? { opacity: 0, y: 8 } : { opacity: 0 }}
              transition={reduced === false ? { duration: 0.28, ease: SLIDE_EASE } : { duration: 0.2 }}
              className="mb-2.5 flex gap-2 overflow-x-auto scroll-quiet"
            >
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onPointerDown={(event) => {
                    // Keep the field focused, and fill before a blur can unmount the row.
                    event.preventDefault();
                    haptic("select");
                    onValueChange(chip.value ?? chip.label);
                  }}
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line bg-card px-3 text-[13px] font-medium text-ink shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <Sparkle size={14} weight="light" className="text-blue" aria-hidden />
                  <bdi>{chip.label}</bdi>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            "flex h-14 items-center gap-2 rounded-[18px] border bg-card pe-1.5 ps-[18px] shadow-soft",
            focused
              ? "border-blue shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-blue)_12%,transparent),var(--shadow-soft)]"
              : "border-line"
          )}
        >
          <div className="relative min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              {label}
            </label>
            {!filled && !focused && example && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex items-center overflow-hidden"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={rolling ? example : "static"}
                    initial={rolling ? { y: 8, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.35, ease: SLIDE_EASE }}
                    className="block w-full truncate text-base text-muted"
                  >
                    {example}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <input
              id={inputId}
              ref={inputRef}
              type="text"
              dir="auto"
              value={value}
              enterKeyHint="send"
              autoComplete="off"
              aria-label={label}
              onFocus={focusIn}
              onBlur={focusOut}
              onChange={(event) => onValueChange(event.target.value)}
              className="relative w-full bg-transparent text-base text-ink outline-none"
            />
          </div>
          <motion.button
            key={filled ? "ready" : "idle"}
            type="submit"
            aria-label={sendLabel}
            disabled={!filled}
            initial={filled && reduced === false ? { scale: 0.9 } : false}
            animate={{ scale: 1 }}
            transition={filled && reduced === false ? SPRING_DEFAULT : { duration: 0.15 }}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-pill disabled:opacity-100",
              filled ? "bg-ink text-card" : "bg-fill text-ink/75"
            )}
          >
            <ArrowUp size={22} weight="light" />
          </motion.button>
        </div>
      </div>
    </form>
  );
}

/** Pins a composer to the bottom of the phone, with a fade so content can pass under it. */
export function ComposerDock({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const keyboard = useKeyboardInset();
  return (
    <div
      className={cn("pointer-events-none absolute inset-x-0 z-20 px-4 pt-7", className)}
      style={{
        bottom: keyboard,
        paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, transparent 0%, var(--color-bg) 34%)",
      }}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  );
}

/** How far the on-screen keyboard covers the layout viewport, or 0 when it does not. */
function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const covered = Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
      setInset(covered > 80 ? covered : 0);
    };
    viewport.addEventListener("resize", sync);
    viewport.addEventListener("scroll", sync);
    sync();
    return () => {
      viewport.removeEventListener("resize", sync);
      viewport.removeEventListener("scroll", sync);
    };
  }, []);
  return inset;
}

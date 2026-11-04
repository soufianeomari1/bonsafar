"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { SHEET_TRANSITION } from "@/lib/motion";
import { useT } from "@/lib/i18n/provider";

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog. */
  title: string;
  /** Hide the visible heading when the sheet draws its own. */
  hideTitle?: boolean;
  showClose?: boolean;
  /** Drag the sheet down to close it. */
  dragDismiss?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** White sheet rising from the bottom in 500ms, docs section 3. */
export function Sheet({
  open,
  onClose,
  title,
  hideTitle = false,
  showClose = true,
  dragDismiss = false,
  className,
  children,
}: SheetProps) {
  const reduced = useReducedMotion();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end overflow-hidden">
          <motion.button
            type="button"
            aria-label={t("common.close")}
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "relative max-h-[88%] scroll-quiet overflow-y-auto rounded-t-sheet bg-card px-5 pb-6 pt-4",
              className
            )}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={reduced ? { duration: 0.2 } : SHEET_TRANSITION}
            drag={dragDismiss && !reduced ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (dragDismiss && info.offset.y > 72) onClose();
            }}
          >
            {showClose && (
              <div className="flex justify-end">
                <button
                  type="button"
                  aria-label={t("common.close")}
                  onClick={onClose}
                  className="flex size-10 items-center justify-center rounded-pill bg-fill text-ink"
                >
                  <X size={20} weight="light" />
                </button>
              </div>
            )}
            {!hideTitle && (
              <h2 className="mt-1 text-[26px] font-extrabold tracking-tight">
                {title}
              </h2>
            )}
            {children}
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}

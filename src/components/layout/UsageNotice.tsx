"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Hourglass, X } from "@phosphor-icons/react";
import { readAgentRun, readServerAgentRun, subscribeAgentRun } from "@/lib/agent-client/store";
import { isRtl } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/** The traveller's message when a live search is refused (hourly limit or spend cap). */
export function UsageNotice() {
  const run = useSyncExternalStore(subscribeAgentRun, readAgentRun, readServerAgentRun);
  const { lang, t } = useLanguage();
  const reduced = useReducedMotion();
  /** The refused request the traveller closed the message for; a new search shows it again. */
  const [dismissed, setDismissed] = useState<unknown>(null);
  const code = run.error?.code === "rate_limited" || run.error?.code === "spend_limit" ? run.error.code : null;
  const arabic = isRtl(lang);

  return (
    <AnimatePresence>
      {code && run.request !== dismissed && (
        <motion.div
          role="alert"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.35, ease: [0.23, 1, 0.32, 1] }}
          dir={arabic ? "rtl" : "ltr"}
          className={cn(
            "absolute inset-x-3 top-3 z-50 flex items-start gap-3 rounded-card bg-card p-3.5 shadow-soft",
            arabic && "font-arabic",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-orange-soft text-orange">
            <Hourglass size={18} weight="fill" aria-hidden />
          </span>
          <p className="min-w-0 flex-1 text-[15px] leading-snug text-ink">
            {t(code === "rate_limited" ? "guard.rateLimited" : "guard.spendLimit")}
          </p>
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={() => setDismissed(run.request)}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
          >
            <X size={18} weight="bold" aria-hidden />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

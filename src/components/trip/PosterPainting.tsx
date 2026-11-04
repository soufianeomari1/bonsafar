"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PaintBrush } from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { EASE_DEFAULT } from "@/lib/motion";

const STEPS: { at: number; key: TranslationKey }[] = [
  { at: 0, key: "poster.paint.colors" },
  { at: 8000, key: "poster.paint.city" },
  { at: 20000, key: "poster.paint.light" },
];

/** Golden-hour strokes. Each one appears after a real delay, not a percent of the job. */
const STROKES: { delay: number; className: string }[] = [
  { delay: 0.4, className: "start-[14%] top-[16%] h-14 w-32 -rotate-12 bg-yellow" },
  { delay: 2.2, className: "end-[12%] top-[22%] h-16 w-28 rotate-6 bg-orange-soft" },
  { delay: 4, className: "start-[22%] top-[34%] h-10 w-36 rotate-3 bg-yellow-soft" },
  { delay: 6, className: "end-[18%] top-[40%] h-20 w-24 -rotate-6 bg-orange" },
  { delay: 8.2, className: "start-[10%] top-[48%] h-12 w-40 rotate-2 bg-sky" },
  { delay: 10.4, className: "end-[8%] top-[54%] h-14 w-32 -rotate-3 bg-yellow" },
  { delay: 12.6, className: "start-[28%] top-[62%] h-8 w-28 rotate-12 bg-orange-soft" },
];

/** Safar painting the 9:16 poster while Muse Image works. */
export function PosterPainting() {
  const reduced = useReducedMotion();
  const { t } = useLanguage();
  const started = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    started.current = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - started.current), 500);
    return () => clearInterval(timer);
  }, []);

  const step = [...STEPS].reverse().find((item) => elapsed >= item.at) ?? STEPS[0];

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky via-yellow-soft to-orange-soft" aria-busy="true">
      {STROKES.map((stroke) => (
        <motion.span
          key={stroke.className}
          aria-hidden
          className={`absolute rounded-pill ${stroke.className}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{
            duration: reduced ? 0.2 : 0.7,
            delay: reduced ? 0 : stroke.delay,
            ease: EASE_DEFAULT,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-16 flex items-end justify-center">
        <div className="relative">
          <Safar state="idle" still size={128} />
          <motion.span
            aria-hidden
            className="absolute bottom-10 end-0 text-orange"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 1, rotate: -20 } : { opacity: 1, rotate: [-18, 8, -18] }}
            transition={
              reduced
                ? { duration: 0.2, ease: EASE_DEFAULT }
                : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <PaintBrush size={42} weight="fill" />
          </motion.span>
        </div>
      </div>
      <p className="absolute inset-x-6 bottom-6 text-center text-sm font-semibold text-ink" aria-live="polite">
        {t(step.key)}
      </p>
    </div>
  );
}

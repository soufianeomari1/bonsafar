"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  HAPTIC_EVENT,
  type HapticEventDetail,
  type HapticPattern,
} from "@/lib/haptics";

type Pulse = { id: number; pattern: HapticPattern };

const PULSE_MS = 200;

/**
 * Visual twin of every vibration: a 24px ring that pulses for 200ms. It makes
 * haptics visible in the demo video, and it is the only feedback on devices
 * without a vibration motor.
 */
export function HapticRing() {
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function onHaptic(event: Event) {
      const { pattern } = (event as CustomEvent<HapticEventDetail>).detail;
      setPulse({ id: Date.now(), pattern });
      clearTimeout(timer);
      timer = setTimeout(() => setPulse(null), PULSE_MS);
    }

    window.addEventListener(HAPTIC_EVENT, onHaptic);
    return () => {
      window.removeEventListener(HAPTIC_EVENT, onHaptic);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center"
    >
      <AnimatePresence>
        {pulse && (
          <motion.span
            key={pulse.id}
            data-haptic={pulse.pattern}
            className="block size-6 rounded-pill border-2 border-blue"
            initial={{ opacity: 0.9, scale: 0.6 }}
            animate={{ opacity: 0, scale: reduced ? 1 : 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: PULSE_MS / 1000, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

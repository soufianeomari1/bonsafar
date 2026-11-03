"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import { Check, Coffee, Play, ShieldCheck, Users } from "@phosphor-icons/react";
import { Safar } from "@/components/bs/Safar";
import { EASE_DEFAULT } from "@/lib/motion";
import { useT } from "@/lib/i18n/provider";

/**
 * The 10s welcome loop. Timings are the @keyframes of design/motion/welcome-v2.html.
 * Keyword marks grow with background-size, the same move as A2.
 */

const LOOP = 10;

const BARS = [
  { h: 10, delay: 0 },
  { h: 20, delay: -0.1 },
  { h: 26, delay: -0.25 },
  { h: 14, delay: -0.4 },
  { h: 22, delay: -0.15 },
  { h: 12, delay: -0.55 },
  { h: 24, delay: -0.3 },
  { h: 16, delay: -0.6 },
  { h: 20, delay: -0.05 },
  { h: 10, delay: -0.45 },
  { h: 18, delay: -0.2 },
  { h: 8, delay: -0.35 },
] as const;

/**
 * One easing per segment, not one easing on the whole loop.
 * A single ease would be applied to the WAAPI effect and would
 * squash the 6%–90% hold into the first half of the 10s.
 */
function cycle(reduced: boolean | null, segments: number, delay = 0): Transition {
  if (reduced) return { duration: 0.2 };
  return {
    duration: LOOP,
    ease: Array.from({ length: segments }, () => [...EASE_DEFAULT]),
    repeat: Infinity,
    delay,
  };
}

export function WelcomeDemo() {
  const t = useT();
  const reduced = useReducedMotion();

  return (
    <section aria-label={t("welcome.demo.label")} className="relative mt-1 min-h-[340px]">
      <Sparkle reduced={!!reduced} />

      <div className="flex items-start ps-3.5 pe-5 pt-2.5">
        <Safar state="idle" size={112} className="shrink-0" />
        <VoiceNote reduced={!!reduced} className="ms-auto mt-6 w-[min(232px,calc(100%-120px))]" />
      </div>

      <UnderstoodCard reduced={!!reduced} />
    </section>
  );
}

function Sparkle({ reduced }: { reduced: boolean }) {
  return (
    <motion.svg
      aria-hidden
      viewBox="336 59 32 32"
      className="pointer-events-none absolute end-5 top-3 z-0 w-8"
      animate={reduced ? { scale: 1, rotate: 0 } : { scale: [1, 1.35, 1], rotate: [0, 20, 0] }}
      transition={reduced ? { duration: 0.2 } : { duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      style={{ transformOrigin: "50% 50%" }}
    >
      <path
        d="M352,62 C354,70 357,73 365,75 C357,77 354,80 352,88 C350,80 347,77 339,75 C347,73 350,70 352,62 Z"
        className="fill-yellow stroke-ink"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

function VoiceNote({ reduced, className }: { reduced: boolean; className?: string }) {
  const t = useT();

  return (
    <motion.div
      className={className}
      style={{
        borderStartStartRadius: 22,
        borderStartEndRadius: 22,
        borderEndStartRadius: 22,
        borderEndEndRadius: 6,
      }}
      initial={false}
      animate={
        reduced
          ? { opacity: 1, y: 0, scale: 1 }
          : {
              opacity: [0, 1, 1, 0, 0],
              y: [12, 0, 0, -6, -6],
              scale: [0.95, 1, 1, 1, 1],
            }
      }
      transition={{ ...cycle(reduced, 4), times: reduced ? undefined : [0, 0.06, 0.9, 0.97, 1] }}
    >
      <div className="bg-blue px-3.5 py-3 text-card shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_rgba(10,108,255,0.25)]" style={{
        borderStartStartRadius: 22,
        borderStartEndRadius: 22,
        borderEndStartRadius: 22,
        borderEndEndRadius: 6,
      }}>
        <div className="flex items-center gap-2.5" dir="ltr">
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-white/22">
            <Play size={12} weight="fill" className="text-card" aria-hidden />
          </span>
          <span aria-hidden className="flex h-[26px] min-w-0 flex-1 items-center gap-[3px]">
            {BARS.map((bar) => (
              <motion.span
                key={bar.delay}
                className="w-[3px] shrink-0 rounded-[2px] bg-card"
                style={{ height: bar.h, transformOrigin: "50% 50%" }}
                animate={reduced ? { scaleY: 1 } : { scaleY: [0.3, 1, 0.3] }}
                transition={
                  reduced
                    ? { duration: 0.2 }
                    : { duration: 0.8, ease: "easeInOut", repeat: Infinity, delay: bar.delay }
                }
              />
            ))}
          </span>
          <span className="font-mono text-xs font-semibold opacity-90">{t("welcome.demo.duration")}</span>
        </div>
        <motion.p
          dir="ltr"
          className="mx-0.5 mt-2.5 text-sm font-medium leading-[1.4]"
          initial={false}
          animate={
            reduced
              ? { opacity: 1, y: 0 }
              : { opacity: [0, 0, 1, 1, 0, 0], y: [4, 4, 0, 0, 0, 0] }
          }
          transition={{
            ...cycle(reduced, 5),
            times: reduced ? undefined : [0, 0.24, 0.31, 0.9, 0.97, 1],
          }}
        >
          <Marked text={t("welcome.demo.transcript")} reduced={reduced} />
        </motion.p>
      </div>
    </motion.div>
  );
}

function InkBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <b key={index} className="font-bold text-ink">
        {part}
      </b>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function Marked({ text, reduced }: { text: string; reduced: boolean }) {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Mark key={index} reduced={reduced}>
        {part}
      </Mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function Mark({ children, reduced }: { children: string; reduced: boolean }) {
  return (
    <motion.span
      className="rounded px-[3px] text-ink"
      style={{
        backgroundImage: "linear-gradient(var(--color-yellow), var(--color-yellow))",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 88%",
      }}
      initial={false}
      animate={{
        backgroundSize: reduced
          ? "100% 100%"
          : ["0% 100%", "0% 100%", "100% 100%", "100% 100%", "0% 100%", "0% 100%"],
      }}
      transition={{
        ...cycle(reduced, 5),
        times: reduced ? undefined : [0, 0.3, 0.38, 0.9, 0.97, 1],
      }}
    >
      {children}
    </motion.span>
  );
}

const CHIPS = [
  { key: "welcome.demo.adults", icon: Users, tone: "text-blue", chip: "bg-fill text-ink", delay: 0 },
  { key: "welcome.demo.breakfast", icon: Coffee, tone: "text-orange", chip: "bg-fill text-ink", delay: 0.15 },
  { key: "welcome.demo.visa", icon: Check, tone: "text-green", chip: "bg-green-soft font-bold text-green", delay: 0.3 },
] as const;

function UnderstoodCard({ reduced }: { reduced: boolean }) {
  const t = useT();

  return (
    <motion.div
      className="relative z-10 mx-5 mt-3 rounded-card bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_32px_rgba(11,11,15,0.10)]"
      initial={false}
      animate={
        reduced
          ? { opacity: 1, y: 0, scale: 1 }
          : {
              opacity: [0, 0, 1, 1, 0, 0],
              y: [22, 22, 0, 0, -8, -8],
              scale: [0.94, 0.94, 1, 1, 1, 1],
            }
      }
      transition={{ ...cycle(reduced, 5), times: reduced ? undefined : [0, 0.4, 0.48, 0.9, 0.97, 1] }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-semibold leading-none tracking-[0.08em] text-muted">
          {t("welcome.demo.understood")}
        </span>
        <span dir="ltr" className="rounded-md bg-yellow px-2 py-[3px] font-mono text-[11px] font-semibold leading-[14px] text-ink">
          {t("welcome.demo.route")}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[26px] font-extrabold leading-[1.3] tracking-[-0.02em]">{t("welcome.demo.city")}</span>
        <span dir="ltr" className="shrink-0 text-sm font-semibold text-green">
          {t("welcome.demo.dates")}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <motion.span
            key={chip.key}
            className={`inline-flex h-[30px] items-center gap-[5px] rounded-pill px-2.5 text-[13px] font-semibold ${chip.chip}`}
            initial={false}
            animate={
              reduced
                ? { opacity: 1, y: 0, scale: 1 }
                : {
                    opacity: [0, 0, 1, 1, 0, 0],
                    y: [6, 6, 0, 0, 0, 0],
                    scale: [0.9, 0.9, 1, 1, 1, 1],
                  }
            }
            transition={{
              ...cycle(reduced, 5, chip.delay),
              times: reduced ? undefined : [0, 0.46, 0.52, 0.9, 0.97, 1],
            }}
          >
            <chip.icon size={14} weight="bold" className={chip.tone} aria-hidden />
            <bdi>{t(chip.key)}</bdi>
          </motion.span>
        ))}
      </div>
      <div className="mt-3.5 flex items-center gap-2 border-t border-line pt-3">
        <ShieldCheck size={16} weight="bold" className="shrink-0 text-blue" aria-hidden />
        <span className="text-[13px] leading-[18px] text-muted">
          <InkBold text={t("welcome.demo.price")} />
        </span>
      </div>
    </motion.div>
  );
}

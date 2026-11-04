"use client";

import type { CSSProperties, ReactNode } from "react";
import { AirplaneTilt, Check, Coffee, Play, Users } from "@phosphor-icons/react";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import styles from "./welcome.module.css";

const BARS = [0.35, 0.7, 1, 0.55, 0.85, 0.4, 0.95, 0.6, 0.3, 0.7, 0.45, 0.8, 0.35, 0.55, 0.75, 0.4];

const WING =
  "M54,84 C42,78 24,76 12,82 C9,88 12,94 18,95 C14,100 17,106 25,106 C23,111 28,115 35,114 C42,113 49,108 54,104 Z";

function at(delay: string, extra?: Record<string, string>): CSSProperties {
  return { "--t": delay, ...extra } as CSSProperties;
}

/** Safar next to the voice note, where he tilts and floats. */
function SafarGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 200" className={cn(styles.glyph, className)}>
      <g className="fill-card stroke-ink" strokeWidth={7} strokeLinejoin="round">
        <path d={WING} />
        <g transform="translate(200,-10) scale(-1,1)">
          <path d={WING} />
        </g>
      </g>
      <path
        d="M80,45 H120 A30,30 0 0 1 150,75 V105 A30,30 0 0 1 130,131 L140,160 Q118,156 108,135 H80 A30,30 0 0 1 50,105 V75 A30,30 0 0 1 80,45 Z"
        className="fill-blue stroke-ink"
        strokeWidth={7}
        strokeLinejoin="round"
      />
      <path
        d="M74,89 Q82,78 90,89 M108,89 Q116,78 124,89"
        className="fill-none stroke-ink"
        strokeWidth={7}
        strokeLinecap="round"
      />
      <path
        d="M88,104 Q99,116 110,104"
        className="fill-none stroke-ink"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** `[[word]]` in a dictionary string. Latin highlights stay on one line. */
function marked(text: string, paint: (part: string, order: number) => ReactNode) {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  let order = 0;
  return parts.map((part, index) => {
    if (index % 2 === 0) return <span key={index}>{part}</span>;
    const node = paint(part, order);
    order += 1;
    return <span key={index}>{node}</span>;
  });
}

function StepTitle({ text, kind }: { text: string; kind: "mark" | "under" }) {
  return marked(text, (part) => <span className={styles[kind]}>{part}</span>);
}

function Transcript({ text }: { text: string }) {
  return marked(text, (part, order) => (
    <span className={styles.hl} style={at(order === 0 ? "1.2s" : "1.4s")}>
      {part}
    </span>
  ));
}

function CityName({ name, latin }: { name: string; latin: boolean }) {
  if (!latin) {
    return (
      <span className={styles.a} style={at("2.15s")}>
        {name}
      </span>
    );
  }
  return Array.from(name).map((letter, index) => (
    <span
      key={`${letter}-${index}`}
      className={cn(styles.a, styles.kFlip)}
      style={at((2.15 + index * 0.04).toFixed(2) + "s", { "--d": "0.38s" })}
    >
      {letter}
    </span>
  ));
}

function Gate({ delay, digits }: { delay: string; digits: string }) {
  return (
    <span className={styles.gate} style={at(delay)} aria-hidden>
      <span className={styles.digits}>
        {digits.split("").map((digit, index) => (
          <span key={index}>{digit}</span>
        ))}
      </span>
    </span>
  );
}

const CHIPS: {
  key: TranslationKey;
  delay: string;
  ok?: boolean;
  icon: "people" | "coffee" | "check";
}[] = [
  { key: "welcome.demo.adults", delay: "2.6s", icon: "people" },
  { key: "welcome.demo.breakfast", delay: "2.68s", icon: "coffee" },
  { key: "welcome.demo.visa", delay: "2.76s", icon: "check", ok: true },
];

function ChipIcon({ icon }: { icon: "people" | "coffee" | "check" }) {
  if (icon === "people") {
    return (
      <span className={styles.ico} style={{ background: "var(--color-blue-soft)" }}>
        <Users size={12} weight="fill" className="text-blue" aria-hidden />
      </span>
    );
  }
  if (icon === "coffee") {
    return (
      <span className={styles.ico} style={{ background: "var(--color-orange-soft)" }}>
        <Coffee size={12} weight="fill" className="text-orange" aria-hidden />
      </span>
    );
  }
  return (
    <span className={styles.ico} style={{ background: "var(--color-card)" }}>
      <Check size={12} weight="bold" className="text-green" aria-hidden />
    </span>
  );
}

/** The two beats of screen 0: say it, then the trip Safar understood. */
export function WelcomeDemo() {
  const { t, rtl } = useLanguage();

  return (
    <section aria-label={t("welcome.demo.label")} className={styles.demo}>
      <div className={cn(styles.sp, styles.spL)} aria-hidden />
      <div className={styles.step}>
        <Gate delay="0.1s" digits="371" />
        <h1 className={styles.title} data-title="">
          <StepTitle text={t("welcome.step1")} kind="mark" />
        </h1>
      </div>

      <div className={cn(styles.sp, styles.spS)} aria-hidden />
      <div className={styles.talk}>
        <div className={cn(styles.safarBox, styles.a, styles.kPop, styles.ePop)} style={at("0.35s")}>
          <div className={styles.safarFlip}>
            <svg aria-hidden className={styles.spark} width={16} height={16} viewBox="0 0 24 24">
              <path
                d="M12 1 14.2 9.8 23 12 14.2 14.2 12 23 9.8 14.2 1 12 9.8 9.8z"
                className="fill-yellow stroke-ink"
                strokeWidth={1.6}
                strokeLinejoin="round"
              />
            </svg>
            <SafarGlyph className={styles.safar} />
            <svg
              aria-hidden
              className={cn(styles.arcs, "fill-none stroke-blue")}
              width={16}
              height={26}
              viewBox="0 0 18 30"
              strokeWidth={2.6}
              strokeLinecap="round"
            >
              <path d="M3 9a8 8 0 0 1 0 12" opacity={0.9} />
              <path d="M8 4a15 15 0 0 1 0 22" opacity={0.45} />
            </svg>
          </div>
        </div>
        <div className={cn(styles.voice, styles.a, styles.ePop)} style={at("0.45s", { "--d": "0.55s" })}>
          <div className={styles.vrow}>
            <span className={styles.noteBtn} aria-hidden>
              <Play size={11} weight="fill" />
            </span>
            <span className={styles.wave} aria-hidden>
              {BARS.map((height, index) => (
                <span
                  key={index}
                  style={
                    {
                      "--h": height,
                      "--i": index,
                      opacity: index > 8 ? 0.45 : 1,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
            <span className={styles.dur}>{t("welcome.demo.duration")}</span>
          </div>
          <p className={styles.tr}>
            <Transcript text={t("welcome.demo.transcript")} />
          </p>
        </div>
      </div>

      <div className={cn(styles.sp, styles.spL)} aria-hidden />
      <div className={styles.step}>
        <Gate delay="1.6s" digits="842" />
        <h2 className={styles.title} data-title="">
          <StepTitle text={t("welcome.step2")} kind="under" />
        </h2>
      </div>
      <p className={cn(styles.sub, styles.a)} style={at("1.75s")}>
        {t("welcome.sub")}
      </p>

      <div className={cn(styles.sp, styles.spS)} aria-hidden />
      <div className={cn(styles.passWrap, styles.a)} style={at("1.95s", { "--d": "0.55s" })}>
        <div className={styles.pass}>
          <div className={styles.pTop}>
            <div className={styles.pRow}>
              <span className={styles.lbl}>
                <i className={styles.dot} />
                <span>{t("welcome.demo.understood")}</span>
              </span>
              <span className={cn(styles.route, styles.a, styles.kPop, styles.ePop)} style={at("2.2s")}>
                CMN
                <AirplaneTilt size={13} weight="fill" className={styles.plane} aria-hidden />
                IST
              </span>
            </div>
            <div className={styles.dest}>
              <div>
                <div className={styles.city}>
                  <CityName name={t("welcome.demo.city")} latin={!rtl} />
                </div>
                <div className={styles.country}>{t("welcome.demo.country")}</div>
              </div>
              <div className={cn(styles.dates, styles.a)} style={at("2.35s")}>
                <b>{t("welcome.demo.dates")}</b>
                <span>{t("welcome.demo.when")}</span>
              </div>
            </div>
          </div>
          <div className={styles.perf} />
          <div className={styles.pBot}>
            <div className={styles.chips}>
              {CHIPS.map((chip) => (
                <span
                  key={chip.key}
                  className={cn(styles.chip, chip.ok && styles.chipOk, styles.a, styles.kDrop, styles.ePop)}
                  style={at(chip.delay)}
                >
                  <ChipIcon icon={chip.icon} />
                  <bdi>{t(chip.key)}</bdi>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

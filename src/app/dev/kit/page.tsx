"use client";

import { useState, useSyncExternalStore } from "react";
import {
  CalendarBlank,
  CheckCircle,
  Coffee,
  MapPin,
  ShieldCheck,
  Users,
  Wallet,
} from "@phosphor-icons/react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/bs/Button";
import { Card } from "@/components/bs/Card";
import { Chip } from "@/components/bs/Chip";
import { Safar, SafarBubble, SAFAR_STATES } from "@/components/bs/Safar";
import { Clouds } from "@/components/bs/Clouds";
import { IconCircle, ICON_CIRCLE_TONES } from "@/components/bs/IconCircle";
import { LanguagePicker } from "@/components/bs/LanguagePicker";
import { PlaneRoute } from "@/components/bs/PlaneRoute";
import { Sheet } from "@/components/bs/Sheet";
import { SplitFlap } from "@/components/bs/SplitFlap";
import { StatusBadge } from "@/components/bs/StatusBadge";
import { MobileFrame } from "@/components/layout/MobileFrame";
import {
  HAPTIC_PATTERNS,
  areHapticsEnabled,
  canVibrate,
  haptic,
  setHapticsEnabled,
  subscribeToHapticsSetting,
  type HapticPattern,
} from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";

const PATTERN_NAMES = Object.keys(HAPTIC_PATTERNS) as HapticPattern[];

const PRICES = ["14 085", "15 889", "13 707"];

/** Browser-only facts have to be read after hydration, never during render. */
const noopSubscribe = () => () => {};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignKitPage() {
  const { lang, jury, rtl, t } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [priceIndex, setPriceIndex] = useState(0);
  const [level, setLevel] = useState(0.7);

  const hapticsOn = useSyncExternalStore(
    subscribeToHapticsSetting,
    areHapticsEnabled,
    () => true
  );
  const vibrateAvailable = useSyncExternalStore(
    noopSubscribe,
    canVibrate,
    () => false
  );

  return (
    <MobileFrame>
      <main className="flex flex-1 flex-col gap-8 overflow-y-auto px-5 py-8">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px] font-extrabold tracking-tight">
            Design kit
          </h1>
          <p className="text-[15px] text-muted">
            Every BonSafar primitive, one place. Not shipped to users.
          </p>
        </header>

        <Section title="Language">
          <LanguagePicker />
          <p className="font-mono text-xs text-muted">
            lang={lang} · dir={rtl ? "rtl" : "ltr"} · jury={String(jury)}
          </p>
          <Card animate={false} className="flex flex-col gap-1 text-[15px]">
            <strong className="text-[17px]">{t("home.title")}</strong>
            <span className="text-muted">{t("home.subtitle")}</span>
            <span className="text-muted">
              {t("onboarding.step", { current: 2, total: 4 })}
            </span>
          </Card>
        </Section>

        <Section title="Safar">
          <label className="flex items-center gap-3 text-[15px] font-semibold">
            <span className="shrink-0">Voice level {level.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(level * 100)}
              aria-label="Voice level"
              onChange={(event) => setLevel(Number(event.target.value) / 100)}
              className="h-2 flex-1 accent-blue"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SAFAR_STATES.map((name) => (
              <Card key={name} animate={false} className="flex flex-col items-center gap-2 overflow-visible">
                <div className="flex h-[168px] items-center justify-center">
                  <Safar state={name} size={112} level={level} />
                </div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-blue">
                  {name}
                </span>
              </Card>
            ))}
          </div>
          <SafarBubble size={72}>
            <p className="text-[15px] font-bold leading-snug">Brek w hder</p>
          </SafarBubble>
        </Section>

        <Section title="Buttons">
          <Button full>{t("common.next")}</Button>
          <Button variant="secondary" full>
            {t("common.signIn")}
          </Button>
          <Button variant="quiet" full>
            {t("common.retry")}
          </Button>
          <Button variant="link">{t("common.skip")}</Button>
        </Section>

        <Section title="Chips">
          <div className="flex flex-wrap gap-2">
            <Chip icon={<MapPin size={18} weight="fill" className="text-blue" />}>
              Istanbul
            </Chip>
            <Chip
              icon={
                <CalendarBlank size={18} weight="fill" className="text-orange" />
              }
            >
              15 → 22 Dec
            </Chip>
            <Chip icon={<Users size={18} weight="fill" className="text-green" />}>
              2 adults
            </Chip>
            <Chip
              selected
              icon={<Wallet size={18} weight="fill" className="text-violet" />}
            >
              15 000 DH
            </Chip>
            <Chip
              interactive={false}
              icon={<Coffee size={18} weight="fill" className="text-orange" />}
            >
              Breakfast
            </Chip>
          </div>
        </Section>

        <Section title="Cards">
          <Card className="flex items-center gap-3">
            <IconCircle icon={ShieldCheck} tone="green" />
            <span className="text-[15px]">A plain card on the grey canvas.</span>
          </Card>
          <Card halo className="flex items-center gap-3">
            <IconCircle icon={CheckCircle} tone="violet" />
            <span className="text-[15px]">
              The one AI card of a screen carries the halo.
            </span>
          </Card>
        </Section>

        <Section title="Icon circles">
          <div className="flex flex-wrap items-center gap-3">
            {(
              Object.keys(ICON_CIRCLE_TONES) as (keyof typeof ICON_CIRCLE_TONES)[]
            ).map((tone) => (
              <IconCircle key={tone} icon={ShieldCheck} tone={tone} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {([36, 40, 44, 48] as const).map((size) => (
              <IconCircle key={size} icon={MapPin} size={size} />
            ))}
          </div>
        </Section>

        <Section title="Status badges">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="done">Done</StatusBadge>
            <StatusBadge tone="running" dot>
              Running
            </StatusBadge>
            <StatusBadge tone="todo">To come</StatusBadge>
            <StatusBadge tone="gate">1 question</StatusBadge>
            <StatusBadge tone="warn">To do</StatusBadge>
            <StatusBadge tone="blocked">Blocked</StatusBadge>
          </div>
        </Section>

        <Section title="Split flap (A4)">
          <div className="flex items-center justify-between gap-4">
            <SplitFlap
              value={`${PRICES[priceIndex]} DH`}
              className="text-[36px] font-bold"
            />
            <Button
              variant="quiet"
              className="h-11 px-4 text-[15px]"
              onClick={() => setPriceIndex((i) => (i + 1) % PRICES.length)}
            >
              Flip
            </Button>
          </div>
        </Section>

        <Section title="Flight plan (A3)">
          <Card animate={false}>
            <PlaneRoute
              activeStep={step}
              stops={[
                { id: "flights", title: "Searching flights", subtitle: "Kanqelleb 3la tiyarat", status: "Done" },
                { id: "hotels", title: "Comparing hotels", subtitle: "Kanqarn l'otelat", status: "Running" },
                { id: "prices", title: "Checking month prices", subtitle: "Kanchouf l'as3ar", status: "To come" },
                { id: "papers", title: "Checking papers", subtitle: "Kanverifi l'wraq", status: "To come" },
                { id: "package", title: "Building your package", subtitle: "Kanwjjed lik l'forfait", status: "To come" },
              ]}
            />
            <div className="mt-3 flex gap-2">
              <Button
                variant="quiet"
                className="h-11 flex-1 px-4 text-[15px]"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              <Button
                variant="quiet"
                className="h-11 flex-1 px-4 text-[15px]"
                onClick={() => setStep((s) => Math.min(5, s + 1))}
              >
                Next stop
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="Clouds (A9)">
          <div className="relative h-56 overflow-hidden rounded-card bg-sky-gradient">
            <Clouds />
          </div>
        </Section>

        <Section title="Sheet">
          <Button variant="secondary" full onClick={() => setSheetOpen(true)}>
            Open the sheet
          </Button>
        </Section>

        <Section title="Haptics">
          <label className="flex items-center justify-between gap-3 rounded-card bg-card px-4 py-3 shadow-soft">
            <span className="text-[15px] font-semibold">Vibrations</span>
            <input
              type="checkbox"
              checked={hapticsOn}
              onChange={(event) => setHapticsEnabled(event.target.checked)}
              className="size-6 accent-green-bright"
            />
          </label>
          <p className="font-mono text-xs text-muted">
            navigator.vibrate:{" "}
            {vibrateAvailable ? "available" : "not available, ring only"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PATTERN_NAMES.map((pattern) => (
              <Button
                key={pattern}
                variant="quiet"
                feedback={null}
                className="h-12 text-[15px]"
                onClick={() => haptic(pattern)}
              >
                {pattern}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted">
            Outside the flight plan, one vibration per second at most: tapping two
            patterns quickly only fires the first.
          </p>
        </Section>

        <Section title="Session">
          <AuthPanel next="/dev/kit" />
        </Section>
      </main>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("trust.title")}
      >
        <p className="mt-2 text-[17px] leading-relaxed text-muted">
          {t("trust.subtitle")}
        </p>
        <ul className="mt-5 flex flex-col gap-4">
          <li className="flex items-center gap-3">
            <IconCircle icon={MapPin} tone="blue" />
            <span className="text-[15px]">{t("trust.point.live")}</span>
          </li>
          <li className="flex items-center gap-3">
            <IconCircle icon={Wallet} tone="orange" />
            <span className="text-[15px]">{t("trust.point.total")}</span>
          </li>
          <li className="flex items-center gap-3">
            <IconCircle icon={ShieldCheck} tone="green" />
            <span className="text-[15px]">{t("trust.point.partner")}</span>
          </li>
        </ul>
        <Button full className="mt-6" onClick={() => setSheetOpen(false)}>
          {t("common.understood")}
        </Button>
      </Sheet>
    </MobileFrame>
  );
}

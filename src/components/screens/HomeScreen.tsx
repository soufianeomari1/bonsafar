"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Microphone, PaperPlaneRight, User, WarningCircle } from "@phosphor-icons/react";
import { JuryPill, SafarMark } from "@/components/bs/Brand";
import { Clouds } from "@/components/bs/Clouds";
import { Safar, type SafarState } from "@/components/bs/Safar";
import { PulseRings } from "@/components/bs/VoiceRadar";
import { TrustSheet } from "@/components/screens/TrustSheet";
import { VocalScreen } from "@/components/screens/VocalScreen";
import { micHoldStyle, useVoiceCapture, type CaptureError } from "@/components/voice/useVoiceCapture";
import { haptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { ideasFor } from "@/lib/ideas";
import { useProfile } from "@/lib/profile/useProfile";
import { startTextTrip, startVoiceTrip } from "@/lib/trip/store";
import { useLocalFlag } from "@/lib/useLocalFlag";

const TRUST_KEY = "bonsafar.trustSeen";

const ERROR_KEYS: Record<CaptureError, TranslationKey> = {
  denied: "home.micDenied",
  unsupported: "home.micUnsupported",
  failed: "home.micUnsupported",
  short: "home.tooShort",
};

/** Screen 2. Look: design/motion/screens/02-home.html. */
export function HomeScreen() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { ready, profile } = useProfile();
  const [trustSeen, setTrustSeen] = useLocalFlag(TRUST_KEY);
  const [text, setText] = useState("");
  const [error, setError] = useState<CaptureError | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const needsProfile = ready && !profile.prefs.onboarded;
  useEffect(() => {
    if (needsProfile) router.replace("/");
  }, [needsProfile, router]);

  const { capture, micHandlers, micRef, getLevel, send, cancel, pause, resume } = useVoiceCapture({
    onTake: (take, durationMs, levels) => {
      void startVoiceTrip(take, durationMs, levels);
      router.push("/trip/understood");
    },
    onError: (kind) => {
      setError(kind);
      if (kind !== "short") input.current?.focus();
    },
  });

  function submitText(value: string) {
    const request = value.trim();
    if (!request) return;
    haptic("tap");
    setText("");
    void startTextTrip(request);
    router.push("/trip/understood");
  }

  const ideas = ideasFor(profile);
  const visaFree = ideas.every(({ idea, sub }) => !idea.schengen || sub === idea.subFree);
  const name = profile.first_name?.trim() ?? "";
  const initial = name ? name.charAt(0).toLocaleUpperCase(lang === "ar" ? "ar" : "fr") : "";
  const oops = error === "denied" || error === "unsupported" || error === "failed";
  const safarState: SafarState = oops ? "oops" : capture.status === "recording" ? "listening" : "idle";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-home-gradient">
      <Clouds
        layers={[
          { top: 150, width: 90, opacity: 1, duration: 40, delay: 0 },
          { top: 270, width: 60, opacity: 0.8, duration: 58, delay: -24 },
        ]}
      />
      <div className="relative flex min-h-0 flex-1 flex-col scroll-quiet overflow-y-auto pb-[22px]">
        <header className="flex items-center justify-between gap-2 px-5 pt-[18px]">
          <div className="flex min-w-0 items-center gap-2" dir="ltr">
            <SafarMark />
            <span className="text-lg font-extrabold tracking-[-0.02em]">BonSafar</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <JuryPill label={t("common.juryMode")} className="h-8 px-2.5 text-xs" />
            <Link
              href="/profile"
              aria-label={t("profile.open")}
              className="flex size-10 items-center justify-center rounded-pill border-2 border-card bg-blue text-base font-bold text-card"
            >
              {initial || <User size={18} weight="bold" aria-hidden />}
            </Link>
          </div>
        </header>

        <section className="px-6 pt-[22px]">
          <h1 className="whitespace-pre-line text-[32px] font-extrabold leading-[1.08] tracking-[-0.03em]">
            {name ? t("home.titleNamed", { name }) : t("home.title")}
          </h1>
          <p className="mt-2 text-base text-muted">{t("home.subtitle")}</p>
        </section>

        <section aria-label={t("home.micLabel")} className="relative h-[300px] shrink-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <PulseRings core={96} sweep />
            <button
              type="button"
              ref={micRef}
              aria-label={t("home.micLabel")}
              {...micHandlers}
              style={micHoldStyle}
              className="bs-mic-hold relative flex size-24 items-center justify-center rounded-pill bg-ink text-card shadow-[0_12px_32px_rgba(11,11,15,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
            >
              <Microphone size={34} weight="fill" aria-hidden />
            </button>
          </div>
          <div className="pointer-events-none absolute start-6 top-4 z-10">
            <Safar state={safarState} size={84} />
          </div>
          <div
            className="pointer-events-none absolute end-5 top-8 z-10 whitespace-nowrap bg-card px-3 py-2 shadow-soft"
            style={{
              borderStartStartRadius: 14,
              borderStartEndRadius: 14,
              borderEndEndRadius: 14,
              borderEndStartRadius: 4,
            }}
          >
            <p className="text-sm leading-snug">
              <span className="font-bold">{t("home.bubble")}</span>
              <span className="text-[13px] text-muted"> · {t("home.bubbleHint")}</span>
            </p>
          </div>
        </section>

        <section aria-label={t("home.ideasLabel")}>
          <p className="mb-2.5 px-6 font-mono text-[11px] font-semibold tracking-[0.08em] text-muted">
            {visaFree ? t("home.ideasVisa") : t("home.ideasLabel")}
          </p>
          <div className="flex gap-3 overflow-x-auto scroll-quiet px-6">
            {ideas.map(({ idea, sub }) => {
              const free = !idea.schengen || sub === idea.subFree;
              return (
                <motion.button
                  key={idea.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => submitText(t(idea.title))}
                  className="w-[150px] shrink-0 overflow-hidden rounded-card bg-card text-start text-ink shadow-soft"
                >
                  <span className={`flex h-[92px] items-end p-2 ${idea.wash}`}>
                    <span className="rounded-md bg-card/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                      {t("home.muse")}
                    </span>
                  </span>
                  <span className="flex flex-col px-3 pb-3 pt-2.5">
                    <span className="text-[15px] font-bold">{t(idea.title)}</span>
                    <span className={`mt-0.5 text-xs font-semibold ${free ? "text-green" : "text-muted"}`}>
                      {t(sub)}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </section>

        <div className="min-h-4 flex-1" />

        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-5 mt-3 flex items-start gap-2 rounded-button bg-red-soft px-3.5 py-3 text-sm leading-[1.45] text-ink"
            >
              <WarningCircle size={20} weight="fill" className="shrink-0 text-red" aria-hidden />
              {t(ERROR_KEYS[error])}
            </motion.p>
          )}
        </AnimatePresence>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitText(text);
          }}
          className="mx-5 mt-3 flex h-[52px] items-center gap-2.5 rounded-button border border-line bg-card pe-2 ps-4"
        >
          <label htmlFor="home-request" className="sr-only">
            {t("home.writeLabel")}
          </label>
          <input
            id="home-request"
            ref={input}
            type="text"
            dir="auto"
            value={text}
            enterKeyHint="send"
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            placeholder={t("home.writePlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label={t("home.send")}
            disabled={!text.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-fill text-ink disabled:opacity-40"
          >
            <PaperPlaneRight size={16} weight="bold" className="rtl:-scale-x-100" />
          </button>
        </form>
      </div>

      <AnimatePresence>
        {capture.status === "recording" && (
          <VocalScreen
            capture={capture}
            getLevel={getLevel}
            onCancel={cancel}
            onSend={() => void send()}
            onPause={pause}
            onResume={resume}
          />
        )}
      </AnimatePresence>

      <TrustSheet
        open={ready && profile.prefs.onboarded && trustSeen === false}
        onClose={() => setTrustSeen(true)}
      />
    </div>
  );
}

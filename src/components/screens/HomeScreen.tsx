"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Microphone, UserCircle, WarningCircle } from "@phosphor-icons/react";
import { Clouds } from "@/components/bs/Clouds";
import { JuryPill, Logo } from "@/components/bs/Brand";
import { VoiceRadar } from "@/components/bs/VoiceRadar";
import { TrustSheet } from "@/components/screens/TrustSheet";
import { VocalScreen } from "@/components/screens/VocalScreen";
import { micHoldStyle, useVoiceCapture, type CaptureError } from "@/components/voice/useVoiceCapture";
import { haptic } from "@/lib/haptics";
import type { TranslationKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
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

/** Screen 2, mockup 02-Main, with the vocal screen (3) as an overlay. */
export function HomeScreen() {
  const t = useT();
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-home-gradient">
      <Clouds />
      <div className="relative flex min-h-0 flex-1 flex-col gap-4 scroll-quiet overflow-y-auto px-5 pb-[22px] pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap" dir="ltr">
            <Logo size="md" />
            <span className="text-xl font-extrabold tracking-[-0.02em]">BonSafar</span>
            <span lang="ar" className="font-arabic text-[15px] whitespace-nowrap text-muted max-[409px]:hidden">
              بون سفر
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/profile"
              aria-label={t("profile.open")}
              className="flex size-9 items-center justify-center rounded-pill bg-card text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.06)]"
            >
              <UserCircle size={22} weight="fill" />
            </Link>
            <JuryPill label={t("common.juryMode")} withIcon />
          </div>
        </div>

        <div className="mt-2.5 flex flex-col gap-1.5">
          <h1 className="whitespace-pre-line text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em]">
            {t("home.title")}
          </h1>
          <p className="text-[17px] leading-[1.45] text-muted">{t("home.subtitle")}</p>
        </div>

        <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-4">
          <VoiceRadar size={250} core={84}>
            <button
              type="button"
              ref={micRef}
              aria-label={t("home.micLabel")}
              {...micHandlers}
              style={micHoldStyle}
              className="bs-mic-hold flex size-[84px] items-center justify-center rounded-pill bg-ink text-card shadow-[0_12px_30px_rgba(11,11,15,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue"
            >
              <Microphone size={34} weight="fill" aria-hidden />
            </button>
          </VoiceRadar>
          <div className="flex flex-col gap-0.5 text-center">
            <span className="text-[17px] font-bold">{t("home.micTitle")}</span>
            <span className="text-[15px] text-muted">{t("home.micHint")}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            {t("home.ideasLabel")}
          </span>
          <div className="-mx-5 flex gap-2.5 scroll-quiet overflow-x-auto px-5">
            {ideas.map(({ idea, sub }) => (
              <motion.button
                key={idea.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => submitText(t(idea.title))}
                className="flex w-[150px] shrink-0 flex-col gap-1.5 text-start text-ink"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- provisional static SVG */}
                <img
                  src={idea.image}
                  alt=""
                  width={150}
                  height={96}
                  className="h-24 w-[150px] rounded-[18px] object-cover"
                />
                <span className="text-[15px] font-semibold">{t(idea.title)}</span>
                <span className="text-[13px] text-muted">{t(sub)}</span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2 rounded-button bg-red-soft px-3.5 py-3 text-sm leading-[1.45] text-ink"
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
            className="mt-1 flex h-[52px] items-center gap-2 rounded-button bg-bg pe-2 ps-4"
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
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink text-card disabled:opacity-40"
            >
              <ArrowRight size={16} weight="bold" className="rtl:-scale-x-100" />
            </button>
          </form>
        </div>
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

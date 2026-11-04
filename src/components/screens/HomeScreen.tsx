"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Microphone, UserCircle, WarningCircle } from "@phosphor-icons/react";
import { JuryPill, Wordmark } from "@/components/bs/Brand";
import { Composer, ComposerDock } from "@/components/bs/Composer";
import { Clouds } from "@/components/bs/Clouds";
import { Safar, type SafarState } from "@/components/bs/Safar";
import { Avatar } from "@/components/profile/GoogleAvatar";
import { TrustSheet } from "@/components/screens/TrustSheet";
import { VocalScreen } from "@/components/screens/VocalScreen";
import { micHoldStyle, useVoiceCapture, type CaptureError } from "@/components/voice/useVoiceCapture";
import { haptic } from "@/lib/haptics";
import { translate, type TranslationKey } from "@/lib/i18n";
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

/** Screen 2. Look: design/motion/screens/02-home-v2.html. */
export function HomeScreen() {
  const { t, lang, jury } = useLanguage();
  const router = useRouter();
  const { ready, profile, user } = useProfile();
  const juryArabic = profile.darija_script === "arab";
  const [trustSeen, setTrustSeen] = useLocalFlag(TRUST_KEY);
  const [text, setText] = useState("");
  const [writing, setWriting] = useState(false);
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
          { top: 168, width: 86, opacity: 0.9, duration: 46, delay: 0, pin: "end", inset: -40, drift: -26 },
          { top: 292, width: 58, opacity: 0.7, duration: 56, delay: 0, pin: "end", inset: -28, drift: -14 },
        ]}
      />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col scroll-quiet overflow-y-auto pb-44">
        <header className="flex items-center justify-between gap-2 px-5 pt-5">
          <Wordmark size={20} mark={30} />
          <div className="flex shrink-0 items-center gap-2">
            <JuryPill dot label={t("common.juryMode")} className="h-9 border border-line px-3.5 text-[13px]" />
            <Link
              href="/account"
              aria-label={t("account.open")}
              className="flex size-10 items-center justify-center overflow-hidden rounded-pill border border-line bg-card text-[15px] font-bold text-ink"
            >
              {user?.avatar ? (
                <Avatar size={40} />
              ) : (
                initial || <UserCircle size={22} weight="light" aria-hidden />
              )}
            </Link>
          </div>
        </header>

        <section className="px-5 pt-4">
          <h1 className="whitespace-pre-line text-[32px] font-extrabold leading-[1.08] tracking-[-0.025em]">
            {name ? t("home.titleNamed", { name }) : t("home.title")}
          </h1>
          <p className="mt-2 max-w-[260px] text-base text-muted">{t("home.subtitle")}</p>
        </section>

        <section aria-label={t("home.micLabel")} className="relative mt-2 h-[214px] shrink-0">
          <div className="pointer-events-none absolute inset-x-1 top-7 z-10 flex items-start gap-1.5">
            <Safar state={safarState} size={84} className="shrink-0" />
            <div
              className="mt-1 w-max max-w-[calc(100%-96px)] bg-card px-3.5 py-2.5 shadow-soft"
              style={{
                borderStartStartRadius: 18,
                borderStartEndRadius: 18,
                borderEndEndRadius: 18,
                borderEndStartRadius: 6,
              }}
            >
              <p className="text-sm font-bold leading-tight">
                {writing ? t("home.bubbleWrite") : t("home.bubble")}
              </p>
              {jury ? (
                <p
                  className={juryArabic ? "font-arabic text-[13px] italic leading-tight text-muted" : "text-[13px] italic leading-tight text-muted"}
                  dir={juryArabic ? "rtl" : undefined}
                  lang={juryArabic ? "ar" : undefined}
                >
                  {translate(juryArabic ? "darija-arab" : "darija-latn", writing ? "home.bubbleWrite" : "home.bubble")}
                </p>
              ) : (
                <p className="text-[13px] leading-tight text-muted">
                  {writing ? t("home.bubbleWriteHint") : t("home.bubbleHint")}
                </p>
              )}
            </div>
          </div>
          <div className="absolute left-1/2 top-[150px] z-20 size-[88px] -translate-x-1/2 -translate-y-1/2">
            <span
              aria-hidden
              className="bs-motion pointer-events-none absolute inset-0 rounded-pill bg-blue opacity-[0.32]"
              style={{ animation: "bs-breathe 2.6s var(--ease-bs) infinite" }}
            />
            <button
              type="button"
              ref={micRef}
              aria-label={t("home.micLabel")}
              {...micHandlers}
              style={micHoldStyle}
              className="bs-mic-hold relative flex size-full items-center justify-center rounded-pill bg-mic text-card transition-transform duration-100 ease-out focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue active:scale-[0.96]"
            >
              <Microphone size={34} weight="light" aria-hidden />
            </button>
          </div>
        </section>

        <section aria-label={t("home.ideasLabel")} className="mt-1.5">
          <p className="mb-3 px-5 font-mono text-xs font-semibold tracking-[0.1em] text-muted">
            {visaFree ? t("home.ideasVisa") : t("home.ideasLabel")}
          </p>
          <div className="flex snap-x snap-mandatory items-stretch gap-3 overflow-x-auto scroll-quiet ps-5 pe-5 scroll-px-5 pb-6">
            {ideas.map(({ idea, sub }) => {
              const free = !idea.schengen || sub === idea.subFree;
              return (
                <motion.button
                  key={idea.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => submitText(t(idea.title))}
                  className="flex w-[156px] shrink-0 snap-start flex-col overflow-hidden rounded-card bg-card text-start text-ink shadow-soft"
                >
                  <span className="relative block h-24 overflow-hidden">
                    {idea.generated ? (
                      <Image
                        src={idea.image}
                        alt={t(idea.title)}
                        fill
                        sizes="156px"
                        className="object-cover"
                      />
                    ) : (
                      <span className={`absolute inset-0 ${idea.wash}`} aria-hidden />
                    )}
                    {idea.generated && (
                      <span className="absolute bottom-2 start-2 rounded-md bg-card/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                        {t("home.muse")}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col px-3 pb-3.5 pt-3">
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

      </div>

      <ComposerDock>
        <AnimatePresence>
          {error && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-2.5 flex items-start gap-2 rounded-button bg-red-soft px-3.5 py-3 text-sm leading-[1.45] text-ink"
            >
              <WarningCircle size={20} weight="light" className="shrink-0 text-red" aria-hidden />
              {t(ERROR_KEYS[error])}
            </motion.p>
          )}
        </AnimatePresence>
        <Composer
          id="home-request"
          inputRef={input}
          value={text}
          onValueChange={(value) => {
            setText(value);
            if (error) setError(null);
          }}
          onSubmit={submitText}
          examples={[
            t("home.example.istanbul"),
            t("home.example.marrakech"),
            t("home.example.visa"),
            t("home.example.family"),
          ]}
          chips={[
            { label: t("home.chip.istanbul") },
            { label: t("home.chip.visa") },
            { label: t("home.chip.marrakech") },
          ]}
          label={t("home.writeLabel")}
          sendLabel={t("home.send")}
          onFocusChange={setWriting}
        />
      </ComposerDock>

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

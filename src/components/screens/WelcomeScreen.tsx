"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { LanguagePicker } from "@/components/bs/LanguagePicker";
import { Safar } from "@/components/bs/Safar";
import { WelcomeDemo } from "@/components/screens/WelcomeDemo";
import { haptic } from "@/lib/haptics";
import { useT } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

const CLOUDS = [
  { top: 96, width: 92, opacity: 1, duration: 38, delay: 0 },
  { top: 214, width: 64, opacity: 0.8, duration: 56, delay: -20 },
  { top: 330, width: 120, opacity: 0.9, duration: 46, delay: -34 },
] as const;

/** Screen 0, design/motion/welcome-v2.html. */
export function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { ready, profile, signInWithGoogle } = useProfile();
  const [signInError, setSignInError] = useState(false);
  const [pending, setPending] = useState(false);

  const onboarded = ready && profile.prefs.onboarded;
  useEffect(() => {
    if (onboarded) router.replace("/home");
  }, [onboarded, router]);

  async function google() {
    setPending(true);
    setSignInError(false);
    const error = await signInWithGoogle("/onboarding");
    if (error) {
      setSignInError(true);
      setPending(false);
    }
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-bg text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[linear-gradient(180deg,var(--color-sky)_0%,var(--color-blue-soft)_55%,var(--color-bg)_100%)]"
      />
      <WelcomeClouds reduced={!!reduced} />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between gap-2 px-5 pt-[18px]">
          <div className="flex min-w-0 items-center gap-2">
            <Safar state="idle" size={34} />
            <span className="flex min-w-0 items-baseline gap-1.5">
              <span className="text-[19px] font-extrabold tracking-[-0.02em]" dir="ltr">
                BonSafar
              </span>
              <span className="text-[13px] italic text-muted" dir="ltr">
                {t("welcome.tagline")}
              </span>
            </span>
          </div>
          <LanguagePicker className="shrink-0" />
        </header>

        <WelcomeDemo />

        <section className="px-6 pt-1">
          <h1 className="whitespace-pre-line text-[34px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            {t("welcome.title")}
          </h1>
          <p className="mt-3 text-[17px] leading-[1.45] text-muted">{t("welcome.subtitle")}</p>
        </section>

        <div className="min-h-4 flex-1" />

        <section aria-label={t("welcome.start")} className="flex flex-col gap-3 px-5 pb-[22px]">
          <motion.div
            className="rounded-button"
            animate={
              reduced
                ? { boxShadow: "0 0 0 0 rgba(10,108,255,0)" }
                : {
                    boxShadow: [
                      "0 0 0 0 rgba(10,108,255,0)",
                      "0 0 0 6px rgba(10,108,255,0.12)",
                      "0 0 0 0 rgba(10,108,255,0)",
                    ],
                  }
            }
            transition={
              reduced ? { duration: 0.2 } : { duration: 2.6, ease: "easeInOut", repeat: Infinity }
            }
          >
            <Button full className="font-bold" onClick={() => router.push("/onboarding")}>
              {t("welcome.start")}
              <ArrowRight size={18} weight="bold" aria-hidden className="rtl:-scale-x-100" />
            </Button>
          </motion.div>

          <GoogleButton disabled={pending} reduced={!!reduced} onClick={google}>
            {t("common.signIn")}
          </GoogleButton>

          {signInError && (
            <p role="alert" className="text-center text-sm text-red">
              {t("welcome.signInError")}
            </p>
          )}

          <LegalLine />
        </section>
      </div>
    </div>
  );
}

function WelcomeClouds({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {CLOUDS.map((cloud) => (
        <motion.svg
          key={cloud.top}
          viewBox="0 0 90 34"
          width={cloud.width}
          height={(cloud.width * 34) / 90}
          className="absolute left-0 text-card"
          style={{ top: cloud.top, opacity: cloud.opacity }}
          animate={reduced ? { x: 40 } : { x: [-120, 470] }}
          transition={
            reduced
              ? { duration: 0.2 }
              : { duration: cloud.duration, delay: cloud.delay, ease: "linear", repeat: Infinity }
          }
        >
          <path
            d="M20 30h52a12 12 0 0 0 0-24 16 16 0 0 0-30-4A14 14 0 0 0 20 30z"
            fill="currentColor"
          />
        </motion.svg>
      ))}
    </div>
  );
}

/**
 * Google's sign-in button. These colours are Google's brand colours:
 * they must not be remapped onto BonSafar tokens, and the G is never recolored.
 */
function GoogleButton({
  children,
  disabled,
  reduced,
  onClick,
}: {
  children: string;
  disabled: boolean;
  reduced: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => {
        haptic("tap");
        onClick();
      }}
      whileTap={reduced || disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-button border bg-card text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:opacity-40"
      style={{ borderColor: "#747775", color: "#1F1F1F" }}
    >
      <GoogleMark />
      {children}
    </motion.button>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden width={20} height={20} viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function LegalLine() {
  const t = useT();
  const parts = t("welcome.legal").split(/\[\[(terms|privacy)\]\]/g);

  return (
    <p className="mx-2 mt-1 text-center text-[12.5px] leading-[1.45] text-muted">
      {parts.map((part, index) => {
        if (part === "terms" || part === "privacy") {
          return (
            <Link
              key={index}
              href={part === "terms" ? "/terms" : "/privacy"}
              className="font-semibold text-ink underline hover:text-blue"
            >
              {t(part === "terms" ? "welcome.legal.terms" : "welcome.legal.privacy")}
            </Link>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
}

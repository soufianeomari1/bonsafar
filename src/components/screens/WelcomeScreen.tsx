"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/bs/Brand";
import { LanguagePicker } from "@/components/bs/LanguagePicker";
import { WelcomeDemo } from "@/components/screens/WelcomeDemo";
import { haptic } from "@/lib/haptics";
import { htmlLang } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";
import styles from "./welcome.module.css";

/** Last chip delay (2.76s) plus its drop, or the reduced-motion fade. */
const CHIP_AT_MS = 2760;
const CHIP_FALL_MS = 500;
const CHIP_FADE_MS = 250;

/**
 * Adds `bs-js` on `<html>`, then `seen` on the next frame, so the CSS
 * sequence plays once. With JavaScript off neither class exists and the
 * server HTML stays the finished page.
 */
function WelcomeMotion({ play }: { play: () => void }) {
  useLayoutEffect(() => {
    document.documentElement.classList.add("bs-js");
    // The next frame starts the sequence. A short timeout covers the case
    // where the browser never paints a frame (background tab, battery saver).
    const frame = requestAnimationFrame(play);
    const backup = window.setTimeout(play, 80);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(
      () => haptic("tick"),
      CHIP_AT_MS + (reduced ? CHIP_FADE_MS : CHIP_FALL_MS)
    );
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(backup);
      window.clearTimeout(timer);
    };
  }, [play]);

  return null;
}

function at(delay: string): CSSProperties {
  return { "--t": delay } as CSSProperties;
}

/**
 * Google's G. These four colours are Google's, not BonSafar tokens,
 * and the mark is never recolored.
 */
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

/** Screen 0, design/motion/screens/00-welcome-v12.html. */
export function WelcomeScreen() {
  const { t, lang, rtl } = useLanguage();
  const router = useRouter();
  const { ready, profile, signInWithGoogle } = useProfile();
  const [seen, setSeen] = useState(false);
  const [signInError, setSignInError] = useState(false);
  const [pending, setPending] = useState(false);
  const play = useCallback(() => setSeen(true), []);

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
    <div
      className={cn(styles.scene, seen && styles.seen)}
      dir={rtl ? "rtl" : "ltr"}
      lang={htmlLang(lang)}
      data-welcome=""
    >
      <WelcomeMotion play={play} />
      <div className={styles.sky} aria-hidden />
      <div className={styles.wrap} data-wrap="">
        <header className={styles.head}>
          <Wordmark size={21} mark={28} className={styles.brand}>
            <em>{t("welcome.tagline")}</em>
          </Wordmark>
          <LanguagePicker legal />
        </header>

        <WelcomeDemo />

        <div className={cn(styles.sp, styles.spL)} aria-hidden />
        <p className={cn(styles.pitch, styles.a)} style={at("2.95s")}>
          {t("welcome.pitch")}
        </p>
        <div className={cn(styles.googleWrap, styles.a)} style={at("3.05s")}>
          <button
            type="button"
            className={styles.google}
            disabled={pending}
            onClick={() => {
              haptic("tap");
              void google();
            }}
          >
            <GoogleMark />
            {t("welcome.google")}
          </button>
        </div>
        {signInError ? (
          <p role="alert" className={styles.error}>
            {t("welcome.signInError")}
          </p>
        ) : (
          <div className={cn(styles.micro, styles.a)} style={at("3.15s")}>
            <b>{t("welcome.free")}</b>
            <span aria-hidden>·</span>
            <Link href="/onboarding" className={styles.guest} onClick={() => haptic("tap")}>
              {t("welcome.guest")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

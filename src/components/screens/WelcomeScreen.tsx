"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Microphone, ShieldCheck, Wallet } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Clouds } from "@/components/bs/Clouds";
import { IconCircle } from "@/components/bs/IconCircle";
import { JuryPill, Logo } from "@/components/bs/Brand";
import { LanguagePicker } from "@/components/bs/LanguagePicker";
import { useT } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

const PERKS = [
  { key: "welcome.perk.language", icon: Microphone, tone: "blue" },
  { key: "welcome.perk.live", icon: Wallet, tone: "orange" },
  { key: "welcome.perk.checks", icon: ShieldCheck, tone: "green" },
] as const;

/** Screen 0, mockup 00-Connexion. */
export function WelcomeScreen() {
  const t = useT();
  const router = useRouter();
  const { ready, profile, user, signInWithGoogle } = useProfile();
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
    <div className="relative flex min-h-0 flex-1 flex-col bg-sky-gradient">
      <Clouds />
      <div className="relative flex min-h-0 flex-1 flex-col gap-[18px] scroll-quiet overflow-y-auto px-5 pb-[22px] pt-[22px]">
        <div className="flex items-center justify-between gap-2">
          <LanguagePicker />
          <JuryPill label={t("common.juryMode")} />
        </div>

        <div className="mt-[34px] flex flex-col items-start gap-3">
          <Logo size="lg" />
          <span className="flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold tracking-[-0.02em]" dir="ltr">
              BonSafar
            </span>
            <span className="text-[15px] italic text-muted">{t("welcome.tagline")}</span>
          </span>
          <h1 className="whitespace-pre-line text-[36px] font-extrabold leading-[1.06] tracking-[-0.03em]">
            {t("welcome.title")}
          </h1>
          <p className="text-[17px] leading-[1.45] text-muted">{t("welcome.subtitle")}</p>
        </div>

        <ul className="mt-1 flex flex-col gap-3">
          {PERKS.map((perk) => (
            <li key={perk.key} className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-3">
              <IconCircle icon={perk.icon} tone={perk.tone} size={36} />
              <span className="text-base leading-[1.35]">{t(perk.key)}</span>
            </li>
          ))}
        </ul>

        <div className="flex-1" />

        <div className="flex flex-col gap-2.5">
          {user ? (
            <Button full onClick={() => router.push("/onboarding")}>
              {t("common.next")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              full
              disabled={pending}
              onClick={google}
              className="border-line-strong"
            >
              <span
                aria-hidden
                className="flex size-[22px] items-center justify-center rounded-pill border border-line-strong text-[13px] font-bold"
              >
                G
              </span>
              {t("common.signIn")}
            </Button>
          )}
          {signInError && (
            <p role="alert" className="text-center text-sm text-red">
              {t("welcome.signInError")}
            </p>
          )}
          {!user && (
            <Button variant="link" onClick={() => router.push("/onboarding")}>
              {t("welcome.noAccount")}
            </Button>
          )}
          <span className="text-center text-[13px] leading-[1.4] text-muted">
            {t("welcome.footnote")}
          </span>
          <span className="flex justify-center gap-4 text-xs text-muted">
            <Link href="/privacy" className="underline underline-offset-2">
              {t("common.privacy")}
            </Link>
            <Link href="/terms" className="underline underline-offset-2">
              {t("common.terms")}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

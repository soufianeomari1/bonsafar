"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft, CloudCheck, DeviceMobile } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { IconCircle } from "@/components/bs/IconCircle";
import {
  LanguageFields,
  PapersFields,
  StyleFields,
  TripFields,
} from "@/components/profile/ProfileFields";
import type { TranslationKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";

const SECTIONS: { title: TranslationKey; Fields: typeof LanguageFields }[] = [
  { title: "profile.sectionLanguage", Fields: LanguageFields },
  { title: "profile.sectionTrip", Fields: TripFields },
  { title: "profile.sectionPapers", Fields: PapersFields },
  { title: "profile.sectionStyle", Fields: StyleFields },
];

/** "Ton profil": the 4 onboarding answers, editable, saved on each change. */
export function ProfileScreen() {
  const t = useT();
  const router = useRouter();
  const { profile, user, update, signInWithGoogle, signOut } = useProfile();
  const [signInError, setSignInError] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <header className="flex h-[60px] shrink-0 items-center gap-1 border-b border-line pe-4 ps-1.5">
        <button
          type="button"
          aria-label={t("common.back")}
          onClick={() => router.push("/home")}
          className="flex size-11 items-center justify-center text-ink"
        >
          <CaretLeft size={20} weight="light" className="rtl:-scale-x-100" />
        </button>
        <h1 className="text-[17px] font-bold">{t("profile.title")}</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-7 scroll-quiet overflow-y-auto px-5 pb-8 pt-5">
        <section className="flex flex-col gap-3 rounded-[20px] bg-bg p-4">
          <div className="flex items-center gap-3">
            <IconCircle icon={user ? CloudCheck : DeviceMobile} tone={user ? "green" : "neutral"} size={40} />
            <div className="flex min-w-0 flex-col">
              <span className="text-[15px] font-bold">{t("profile.account")}</span>
              <span className="truncate text-sm text-muted">
                {user
                  ? t("common.signedInAs", { name: profile.first_name ?? user.email ?? "" })
                  : t("profile.anonymous")}
              </span>
            </div>
          </div>
          {user ? (
            <Button variant="secondary" full onClick={async () => {
                await signOut();
                router.replace("/");
              }}
              className="h-12"
            >
              {t("common.signOut")}
            </Button>
          ) : (
            <Button
              variant="secondary"
              full
              className="h-12 border-line-strong"
              onClick={async () => {
                setSignInError(false);
                if (await signInWithGoogle("/profile")) setSignInError(true);
              }}
            >
              {t("profile.keepWithGoogle")}
            </Button>
          )}
          {signInError && (
            <p role="alert" className="text-sm text-red">
              {t("welcome.signInError")}
            </p>
          )}
        </section>

        {SECTIONS.map(({ title, Fields }) => (
          <section key={title} className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">{t(title)}</h2>
            <Fields profile={profile} update={update} />
          </section>
        ))}

        <Button
          variant="link"
          onClick={() => {
            void update({ prefs: { onboarded: false } });
            router.push("/onboarding");
          }}
        >
          {t("profile.restart")}
        </Button>
      </div>
    </div>
  );
}

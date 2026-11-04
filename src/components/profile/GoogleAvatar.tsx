"use client";

import { useState } from "react";
import { UserCircle } from "@phosphor-icons/react";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import { cn } from "@/lib/utils";

/** Google's G. These four colours are Google's, not BonSafar tokens. */
function GoogleG() {
  return (
    <svg aria-hidden width={13} height={13} viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

/** Photo or initial, in the blue circle. */
export function Avatar({ size = 56, badge = false, className }: { size?: number; badge?: boolean; className?: string }) {
  const { profile, user } = useProfile();
  const { lang } = useLanguage();
  const [failed, setFailed] = useState(false);
  const name = profile.first_name?.trim() || user?.email || "";
  const initial = name ? name.charAt(0).toLocaleUpperCase(lang === "ar" ? "ar" : "fr") : "";
  return (
    <span
      className={cn("relative flex shrink-0 items-center justify-center rounded-pill bg-blue font-bold text-card", className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {user?.avatar && !failed ? (
        // The Google profile photo, as Google serves it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt=""
          referrerPolicy="no-referrer"
          className="size-full rounded-pill object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial || <UserCircle size={Math.round(size * 0.55)} aria-hidden />
      )}
      {badge && (
        <span className="absolute -bottom-1 -end-1 flex size-[22px] items-center justify-center rounded-pill bg-card shadow-soft">
          <GoogleG />
        </span>
      )}
    </span>
  );
}

/** "Signed in with Google" and the address, at the top of the express profile. */
export function GoogleAvatar({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { user } = useProfile();
  if (!user) return null;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar badge className="shadow-[0_0_0_3px_var(--color-card),0_6px_16px_rgb(10_108_255/0.25)]" />
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{t("express.google")}</p>
        <p className="truncate text-[15px] font-bold" dir="ltr">
          {user.email}
        </p>
      </div>
    </div>
  );
}

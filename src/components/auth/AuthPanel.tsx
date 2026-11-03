"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { GoogleLogo, SignOut, UserCircle } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { IconCircle } from "@/components/bs/IconCircle";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";

/** Google sign-in, sign-out and the current session, in one small panel. */
export function AuthPanel({ next = "/dev/kit" }: { next?: string }) {
  const t = useT();
  const [user, setUser] = useState<User | null>(null);

  // The env vars may be missing on a fresh clone: show that instead of crashing.
  const [{ supabase, setupError }] = useState<{
    supabase: SupabaseClient | null;
    setupError: string | null;
  }>(() => {
    try {
      return { supabase: createClient(), setupError: null };
    } catch (cause) {
      return {
        supabase: null,
        setupError: cause instanceof Error ? cause.message : String(cause),
      };
    }
  });
  const [error, setError] = useState<string | null>(setupError);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  const signIn = useCallback(async () => {
    if (!supabase) return;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (oauthError) setError(oauthError.message);
  }, [supabase, next]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  if (error) {
    return (
      <p className="rounded-card bg-red-soft px-4 py-3 text-sm text-red">
        {error}
      </p>
    );
  }

  const name =
    (user?.user_metadata?.given_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <IconCircle icon={UserCircle} tone={user ? "green" : "neutral"} />
        <span className="text-[15px] text-muted">
          {loading
            ? "…"
            : user
              ? t("common.signedInAs", { name })
              : t("common.signedOut")}
        </span>
      </div>

      {user ? (
        <Button variant="secondary" full onClick={signOut}>
          <SignOut size={20} weight="bold" />
          {t("common.signOut")}
        </Button>
      ) : (
        <Button variant="secondary" full onClick={signIn} disabled={!supabase}>
          <GoogleLogo size={20} weight="bold" />
          {t("common.signIn")}
        </Button>
      )}
    </div>
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth landing route: swap the code for a session, then go where we came from. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const requested = searchParams.get("next");
  // Only same-origin paths, so the callback cannot be turned into an open redirect.
  const next =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dev/kit";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  // Behind Vercel's proxy the request origin is the internal host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost
      ? origin
      : `https://${forwardedHost}`;

  return NextResponse.redirect(`${base}${next}`);
}

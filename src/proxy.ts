import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import {
  JURY_COOKIE_OPTIONS,
  JURY_UI_COOKIE_OPTIONS,
  isJuryKey,
  signJuryToken,
  verifyJuryToken,
} from "@/lib/jury/access";
import { LANG_HEADER, langFromQuery } from "@/lib/i18n/query";
import { JURY_COOKIE, JURY_UI_COOKIE } from "@/lib/jury/flags";

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/**
 * Next.js 16 renamed middleware to proxy. This keeps the Supabase session
 * fresh (`getUser()` rotates the auth cookies, so it must stay) and guards
 * the hidden jury mode: /jury and, in production, /dev/*.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // /jury?k=<key>: exchange the key for a signed cookie, then drop it from the URL.
  if (pathname === "/jury" && searchParams.has("k")) {
    const token = (await isJuryKey(searchParams.get("k") ?? "")) ? await signJuryToken() : null;
    const response = redirectTo(request, token ? "/jury" : "/");
    if (token) {
      response.cookies.set(JURY_COOKIE, token, JURY_COOKIE_OPTIONS);
      response.cookies.set(JURY_UI_COOKIE, "1", JURY_UI_COOKIE_OPTIONS);
    }
    return response;
  }

  const jury = await verifyJuryToken(request.cookies.get(JURY_COOKIE)?.value);

  if (pathname === "/jury" && !jury) return redirectTo(request, "/");
  if (pathname === "/" && searchParams.get("jury") === "1" && jury) return redirectTo(request, "/jury");
  if (
    (pathname === "/dev" || pathname.startsWith("/dev/")) &&
    process.env.NODE_ENV === "production" &&
    !jury
  ) {
    // No such route: Next renders its not-found page with a 404 status.
    return NextResponse.rewrite(new URL("/__not-found", request.url));
  }

  // Same priority as detectLang: jury mode, then ?lang=. The header is what
  // the server renders, so the first HTML is already in that language.
  request.headers.delete(LANG_HEADER);
  if (jury && searchParams.get("jury") === "1") {
    request.headers.set(LANG_HEADER, "en");
  } else {
    const requested = langFromQuery(searchParams.get("lang"));
    if (requested) request.headers.set(LANG_HEADER, requested);
  }

  let supabaseResponse = NextResponse.next({ request });

  const env = publicEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Do not add code between createServerClient and getUser.
  await supabase.auth.getUser();

  const uiFlag = request.cookies.get(JURY_UI_COOKIE)?.value === "1";
  if (jury && !uiFlag) supabaseResponse.cookies.set(JURY_UI_COOKIE, "1", JURY_UI_COOKIE_OPTIONS);
  if (!jury && request.cookies.has(JURY_UI_COOKIE)) {
    supabaseResponse.cookies.set(JURY_UI_COOKIE, "", { ...JURY_UI_COOKIE_OPTIONS, maxAge: 0 });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, images and audio: those never need a session.
     */
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|wav|mp3)$).*)",
  ],
};

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { DEFAULT_LANG, htmlLang, isRtl, type Lang } from "@/lib/i18n";
import { LANG_HEADER, langFromHeader } from "@/lib/i18n/query";
import { LanguageProvider } from "@/lib/i18n/provider";
import { HapticRing } from "@/components/bs/HapticRing";
import { IconDefaults } from "@/components/bs/IconDefaults";
import { JuryBridge } from "@/components/jury/JuryBridge";
import { InstallRegistrar } from "@/components/pwa/InstallRegistrar";
import { PartnerReturn } from "@/components/trip/PartnerReturn";
import { TOKENS } from "@/lib/tokens";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bonsafar.com"
  ),
  title: "BonSafar",
  description:
    "A travel agency in your pocket, that understands Moroccan darija.",
};

export const viewport: Viewport = {
  themeColor: TOKENS.bg,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Impact's crawler reads `value`, not the usual `content` attribute. */
const impactSiteVerification = {
  name: "impact-site-verification",
  value: "5bae12fb-1556-4355-85ca-7df3f691132b",
};

/**
 * The first HTML depends on `?lang=` (or jury mode). Waiting for that request
 * is what keeps the shared link from painting in French first.
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang: Lang = langFromHeader((await headers()).get(LANG_HEADER)) ?? DEFAULT_LANG;

  return (
    <html
      lang={htmlLang(lang)}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      className={`${geist.variable} ${geistMono.variable} ${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <meta {...impactSiteVerification} />
      <body className="flex min-h-full flex-col">
        <LanguageProvider initialLang={lang}>
          <IconDefaults>
            {children}
            <HapticRing />
            <InstallRegistrar />
            <PartnerReturn />
            <JuryBridge />
          </IconDefaults>
        </LanguageProvider>
      </body>
    </html>
  );
}

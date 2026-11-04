import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { LanguageProvider } from "@/lib/i18n/provider";
import { HapticRing } from "@/components/bs/HapticRing";
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
  themeColor: "#f2f2f7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Impact's crawler reads `value`, not the usual `content` attribute. */
const impactSiteVerification = {
  name: "impact-site-verification",
  value: "74d5ceba-669e-4c4b-bab5-06bba0d99842",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={`${geist.variable} ${geistMono.variable} ${ibmPlexSansArabic.variable} h-full antialiased`}
    >
      <meta {...impactSiteVerification} />
      <body className="flex min-h-full flex-col">
        <LanguageProvider>
          {children}
          <HapticRing />
        </LanguageProvider>
      </body>
    </html>
  );
}

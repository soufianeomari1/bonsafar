import type { Metadata } from "next";
import { MobileFrame } from "@/components/layout/MobileFrame";
import { WelcomeScreen } from "@/components/screens/WelcomeScreen";

const TITLE = "BonSafar, your travel agent that understands Moroccan darija";
const DESCRIPTION =
  "Send a voice note in darija, get a real trip back: live flights and hotels, one price in dirhams, visa checked before you go.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: "/",
    siteName: "BonSafar",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** Screen 0. The judges' board lives on /jury, behind its key. */
export default function Page() {
  return (
    <MobileFrame>
      <WelcomeScreen />
    </MobileFrame>
  );
}

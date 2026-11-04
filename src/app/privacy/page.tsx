import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { LiveCreditsSection } from "@/components/layout/LiveCreditsSection";

export const metadata: Metadata = {
  title: "Privacy · BonSafar",
  description: "What BonSafar stores, and what it never stores.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" updated="3 November 2026">
      <h2>Voice notes</h2>
      <p>
        Your voice note is transcribed and then thrown away. BonSafar never
        stores audio, anywhere. Only the text transcript is kept, so you can see
        what we understood and so your trip can be rebuilt.
      </p>

      <h2>Payment data</h2>
      <p>
        BonSafar never handles payment data. There is no checkout here: you pay
        on the partner&apos;s own site, Kiwi.com for flights and the hotel site
        for the stay. We never see your card.
      </p>

      <h2>What we store</h2>
      <ul>
        <li>
          Your profile: first name, language, home airport, who you travel with,
          what papers you hold, your travel style.
        </li>
        <li>
          Your trips: the transcript, what we understood, and the offers we
          found with their prices and the time they were fetched.
        </li>
        <li>
          Anonymous usage counters, used to cap how much the demo can spend.
        </li>
      </ul>

      <h2>Where it lives</h2>
      <p>
        Data is hosted by Supabase in the European Union. You can use BonSafar
        without an account: in that case the profile stays in your browser and
        nothing is sent to our database.
      </p>

      <h2>AI models</h2>
      <p>
        All understanding, planning and writing runs on Meta models through the
        Meta Model API. We do not use any other AI provider.
      </p>

      <LiveCreditsSection />

      <h2>Deleting your data</h2>
      <p>
        Sign out at any time, or ask for your account to be deleted by opening
        an issue on the{" "}
        <Link href="https://github.com/soufianeomari1/bonsafar">
          BonSafar GitHub repository
        </Link>
        . That repository is also the way to reach us.
      </p>
    </LegalPage>
  );
}

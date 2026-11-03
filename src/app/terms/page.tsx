import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";

export const metadata: Metadata = {
  title: "Terms · BonSafar",
  description: "What BonSafar does, and what it does not do.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated="3 November 2026">
      <h2>What BonSafar is</h2>
      <p>
        BonSafar is a voice travel assistant built for the Meta Global AI
        Developer Hackathon. It listens to your trip in Moroccan darija, finds
        real flights and hotels, and puts them together as one total price.
      </p>

      <h2>We are not the seller</h2>
      <p>
        BonSafar does not sell flights or hotel nights and never takes payment.
        You book and pay on the partner&apos;s own site: Kiwi.com for flights,
        the hotel or trivago partner for the stay. Their terms, their
        cancellation rules and their prices apply.
      </p>

      <h2>Prices</h2>
      <p>
        Every price comes from a live Kiwi.com or trivago result, and is shown
        with the moment it was fetched. Prices move: the amount you see here is
        the amount we were given at that moment, not a guaranteed offer. Totals
        and euro to dirham conversions are computed by our code, with the Bank
        Al-Maghrib reference rate and its date on screen.
      </p>

      <h2>Travel requirements</h2>
      <p>
        Visa, passport and baggage checks are a help, not a legal source. Always
        confirm with the embassy, the consulate and the airline before you
        travel.
      </p>

      <h2>Demo status</h2>
      <p>
        This is a hackathon project. It can be offline, rate-limited, or switch
        to a recorded run, which is always labelled &quot;replay&quot; with the
        time its prices were captured.
      </p>

      <h2>Contact</h2>
      <p>
        Questions and problems go to the{" "}
        <Link href="https://github.com/soufianeomari1/bonsafar">
          BonSafar GitHub repository
        </Link>
        .
      </p>
    </LegalPage>
  );
}

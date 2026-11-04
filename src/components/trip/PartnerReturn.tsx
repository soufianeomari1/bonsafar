"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AirplaneTilt, Bed, CheckCircle } from "@phosphor-icons/react";
import { SafarLogo } from "@/components/bs/Brand";
import { Sheet } from "@/components/bs/Sheet";
import { haptic } from "@/lib/haptics";
import { useLanguage } from "@/lib/i18n/provider";
import { useProfile } from "@/lib/profile/useProfile";
import { clearDeparture, readDeparture, recordDeparture, type Departure } from "@/lib/trip/partner";
import {
  readSavedTrips,
  readServerSavedTrips,
  setAlert,
  setBooking,
  subscribeSavedTrips,
  type BookingIssue,
} from "@/lib/trip/saved";

const ISSUES: BookingIssue[] = ["price_changed", "sold_out", "payment", "site_error", "other"];
const PARTNER_NAME = { "kiwi.com": "Kiwi.com", trivago: "trivago" } as const;

type Step = "ask" | "booked" | "kept" | "issue" | "thanks";

/**
 * "Re-bonjour Soufiane! You're back from Kiwi.com. So, is it booked?"
 * ("Retour du partenaire" of postfetch-compte-v2.html). Shown when the tab
 * comes back into view, or at the next app opening.
 */
export function PartnerReturn() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const saved = useSyncExternalStore(subscribeSavedTrips, readSavedTrips, readServerSavedTrips);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [step, setStep] = useState<Step>("ask");
  const [root, setRoot] = useState<HTMLElement | null>(null);

  const check = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const pending = readDeparture();
    if (!pending) return;
    setRoot(document.querySelector<HTMLElement>("[data-phone-root]"));
    setStep("ask");
    setDeparture(pending);
  }, []);

  useEffect(() => {
    const timer = setTimeout(check, 600);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [check]);

  const trip = departure ? saved.trips.find((item) => item.run_id === departure.run_id) : null;
  const open = !!departure && !!trip && !!root;

  const close = () => {
    clearDeparture();
    setDeparture(null);
  };

  if (!open || !departure || !trip || !root) return null;
  const name = profile.first_name?.trim();
  const partner = PARTNER_NAME[departure.partner];
  const flightFirst = departure.partner === "kiwi.com";
  const nextLink = flightFirst ? trip.package.hotel.deeplink : trip.package.flight.deeplink;

  const answer = async (choice: "booked" | "to_confirm") => {
    haptic(choice === "booked" ? "success" : "tap");
    clearDeparture();
    await setBooking(trip.run_id, { booking_status: choice, booking_partner: departure.partner });
    if (choice === "to_confirm") await setAlert(trip.run_id, true);
    setStep(choice === "booked" ? "booked" : "kept");
  };

  const sheet = (
    <Sheet open onClose={close} title={name ? t("partner.hello", { name }) : t("partner.helloNoName")} hideTitle showClose={false}>
      <span aria-hidden className="mx-auto block h-[5px] w-10 rounded-pill bg-track" />
      <div className="mt-[18px] flex justify-center">
        <SafarLogo size={76} className="-rotate-[8deg]" />
      </div>

      {step === "ask" && (
        <>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-[-0.02em]">
            {name ? t("partner.hello", { name }) : t("partner.helloNoName")}
          </h2>
          <p className="mt-1.5 text-center text-[15px] leading-[1.45] text-muted">
            {t("partner.back", { partner })}
            <br />
            {t("partner.ask")}
          </p>
          <div className="mt-5 grid gap-2">
            <SheetButton primary onClick={() => void answer("booked")}>
              <CheckCircle size={20} aria-hidden />
              {flightFirst ? t("partner.yesFlight") : t("partner.yesHotel")}
            </SheetButton>
            <SheetButton onClick={() => void answer("to_confirm")}>{t("partner.notYet")}</SheetButton>
            <SheetButton muted onClick={() => setStep("issue")}>
              {t("partner.problem")}
            </SheetButton>
          </div>
          {nextLink && (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[12.5px] text-muted">
              {flightFirst ? <Bed size={16} aria-hidden /> : <AirplaneTilt size={16} aria-hidden />}
              {flightFirst ? t("partner.nextHotel") : t("partner.nextFlight")}
            </p>
          )}
        </>
      )}

      {step === "booked" && (
        <>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-[-0.02em]">{t("partner.bookedTitle")}</h2>
          <p className="mt-1.5 text-center text-[15px] text-muted">{t("partner.bookedBody")}</p>
          <div className="mt-5 grid gap-2">
            {nextLink && (
              <a
                href={nextLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  recordDeparture(flightFirst ? "trivago" : "kiwi.com", trip.run_id);
                  setDeparture(null);
                }}
                className="flex h-[54px] items-center justify-center gap-2.5 rounded-button bg-ink text-base font-semibold text-card"
              >
                {flightFirst ? <Bed size={20} aria-hidden /> : <AirplaneTilt size={20} aria-hidden />}
                {flightFirst ? t("partner.openHotel") : t("partner.openFlight")}
              </a>
            )}
            <SheetButton primary={!nextLink} onClick={close}>
              {t("partner.done")}
            </SheetButton>
          </div>
        </>
      )}

      {step === "kept" && (
        <>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-[-0.02em]">{t("partner.keptTitle")}</h2>
          <p className="mt-1.5 text-center text-[15px] text-muted">{t("partner.keptBody")}</p>
          <div className="mt-5 grid">
            <SheetButton primary onClick={close}>
              {t("partner.done")}
            </SheetButton>
          </div>
        </>
      )}

      {step === "issue" && (
        <>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-[-0.02em]">{t("partner.issueTitle")}</h2>
          <div className="mt-5 grid gap-2">
            {ISSUES.map((issue) => (
              <SheetButton
                key={issue}
                onClick={async () => {
                  haptic("select");
                  clearDeparture();
                  await setBooking(trip.run_id, {
                    booking_status: "issue",
                    booking_partner: departure.partner,
                    booking_issue: issue,
                  });
                  setStep("thanks");
                }}
              >
                {t(`issue.${issue}`)}
              </SheetButton>
            ))}
          </div>
        </>
      )}

      {step === "thanks" && (
        <>
          <p className="mt-3 text-center text-[15px] text-muted">{t("partner.issueThanks")}</p>
          <div className="mt-5 grid">
            <SheetButton primary onClick={close}>
              {t("partner.done")}
            </SheetButton>
          </div>
        </>
      )}
    </Sheet>
  );

  return createPortal(sheet, root);
}

function SheetButton({
  primary = false,
  muted = false,
  onClick,
  children,
}: {
  primary?: boolean;
  muted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        primary
          ? "flex h-[54px] items-center justify-center gap-2.5 rounded-button bg-ink text-base font-semibold text-card active:scale-[0.97]"
          : `flex h-[54px] items-center justify-center rounded-button border border-line bg-card text-base font-semibold active:scale-[0.97] ${muted ? "text-muted" : "text-ink"}`
      }
    >
      {children}
    </button>
  );
}

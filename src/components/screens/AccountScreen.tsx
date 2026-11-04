"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AirplaneTilt,
  ArrowLeft,
  Bed,
  Bell,
  CaretRight,
  ChatCircle,
  IdentificationCard,
  Sparkle,
  ShieldCheck,
  Translate,
  UsersThree,
  Wallet,
  type Icon,
} from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Sheet } from "@/components/bs/Sheet";
import { Switch } from "@/components/bs/Switch";
import { QUESTION_FIELDS, QUESTION_TEXT } from "@/components/profile/ExpressQuestions";
import { Avatar } from "@/components/profile/GoogleAvatar";
import { LanguageFields } from "@/components/profile/ProfileFields";
import { InstallButton } from "@/components/pwa/InstallButton";
import { BookingPill } from "@/components/trip/BookingPill";
import { HotelPhoto, SectionTitle } from "@/components/trip/TripBits";
import { placeName } from "@/lib/airports";
import { dateRangeParts, formatMonthName, formatMonthYear } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { translate, type TranslationKey } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n/provider";
import { QUESTIONS, completion, isAnswered, type Question } from "@/lib/profile/schema";
import { deleteEverything, exportData } from "@/lib/profile/store";
import { useProfile } from "@/lib/profile/useProfile";
import { travellersText } from "@/lib/trip/describe";
import { forgetTrips, readSavedTrips, readServerSavedTrips, setAlert, subscribeSavedTrips, type FrozenTrip } from "@/lib/trip/saved";
import { cn } from "@/lib/utils";

type Editing = Question | "language" | "whatsapp" | "delete" | null;

const PASSPORT_KEY = { ma: "moroccan", fr: "french", both: "both", other: "other" } as const;

/** "Mon espace", postfetch-compte-v2.html. */
export function AccountScreen() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const { profile, user, update, signInWithGoogle, signOut } = useProfile();
  const saved = useSyncExternalStore(subscribeSavedTrips, readSavedTrips, readServerSavedTrips);
  const [editing, setEditing] = useState<Editing>(null);
  const percent = completion(profile);
  const nextQuestion = QUESTIONS.find((question) => !isAnswered(profile, question)) ?? null;
  const name = profile.first_name?.trim() || null;
  const since = user?.created_at
    ? formatMonthYear(new Date(user.created_at), lang)
    : null;

  const prefRows: { id: Exclude<Editing, null | "whatsapp" | "delete">; icon: Icon; label: TranslationKey; value: string | null }[] = [
    {
      id: "airport",
      icon: AirplaneTilt,
      label: "account.pref.airport",
      value: profile.home_airport ? placeName(profile.home_airport, lang) : null,
    },
    {
      id: "who",
      icon: UsersThree,
      label: "account.pref.who",
      value: profile.companions ? t(`companions.${profile.companions}`) : null,
    },
    {
      id: "style",
      icon: Bed,
      label: "account.pref.hotel",
      value: profile.travel_style
        ? `${t(`style.${profile.travel_style}`)}${profile.prefs.breakfast ? `, ${t("account.pref.breakfast")}` : ""}`
        : null,
    },
    {
      id: "style",
      icon: Wallet,
      label: "account.pref.budget",
      value: profile.budget_band ? t(`budget.${profile.budget_band}`) : null,
    },
    {
      id: "papers",
      icon: IdentificationCard,
      label: "account.pref.papers",
      value: profile.passport_country
        ? `${t(`passport.${PASSPORT_KEY[profile.passport_country]}`)}${profile.has_schengen ? ", Schengen" : ""}`
        : null,
    },
    {
      id: "language",
      icon: Translate,
      label: "account.pref.language",
      value: translate("en", `lang.${profile.ui_lang}`),
    },
  ];

  async function download() {
    haptic("tap");
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bonsafar-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto scroll-quiet bg-[linear-gradient(180deg,var(--color-sky)_0,var(--color-blue-soft)_180px,var(--color-bg)_300px)] px-5 pb-10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={t("common.back")}
              onClick={() => router.push("/home")}
              className="-ms-1 flex size-11 items-center justify-center rounded-pill"
            >
              <ArrowLeft size={22} className="rtl:-scale-x-100" aria-hidden />
            </button>
            <h1 className="text-[27px] font-extrabold tracking-[-0.03em] rtl:tracking-normal">{t("account.title")}</h1>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3.5 rounded-card bg-card p-4 shadow-soft">
          <Avatar size={56} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{name ?? user?.email ?? t("account.guest")}</p>
            <p className="text-[12.5px] text-muted">{since ? t("account.since", { date: since }) : user ? null : t("profile.anonymous")}</p>
          </div>
          <Ring percent={percent} />
        </div>

        {!user && (
          <Button full variant="secondary" className="mt-2.5" onClick={() => void signInWithGoogle("/account")}>
            {t("profile.keepWithGoogle")}
          </Button>
        )}

        {nextQuestion && (
          <button
            type="button"
            onClick={() => setEditing(nextQuestion)}
            className="mt-2.5 flex w-full items-center gap-2.5 rounded-card bg-yellow-soft px-3.5 py-3 text-start"
          >
            <Sparkle size={20} className="shrink-0 text-orange" aria-hidden />
            <span className="min-w-0 flex-1 text-[13px] leading-[1.4]">
              <b>{t("account.oneMore")}</b> · {t(QUESTION_TEXT[nextQuestion].why)}
            </span>
            <CaretRight size={16} className="shrink-0 rtl:-scale-x-100" aria-hidden />
          </button>
        )}

        <SectionTitle className="mt-[26px]">{t("account.trips")}</SectionTitle>
        {saved.trips.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("account.tripsEmpty")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {saved.trips.slice(0, 6).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </ul>
        )}

        <SectionTitle className="mt-[26px]">{t("account.alerts")}</SectionTitle>
        <div className="mt-3 rounded-card bg-card px-4 py-0.5 shadow-soft">
          {saved.trips.length === 0 && <p className="py-3.5 text-sm text-muted">{t("account.alertsEmpty")}</p>}
          {saved.trips.slice(0, 4).map((trip) => (
            <div key={trip.id} className="flex items-center gap-3.5 border-b border-line">
              <Bell size={22} className="shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <Switch
                  checked={!!trip.alert}
                  onChange={(on) => void setAlert(trip.run_id, on)}
                  label={t("account.alertTrip", { city: tripCity(trip, lang), month: tripMonth(trip, lang) })}
                  hint={t("account.alertHint")}
                />
              </div>
            </div>
          ))}
          <Row
            icon={ChatCircle}
            label={t("account.whatsapp")}
            hint={profile.whatsapp_number ? t("account.whatsappOn", { number: profile.whatsapp_number }) : t("account.whatsappHint")}
            last
            onClick={() => setEditing("whatsapp")}
          />
        </div>

        <SectionTitle className="mt-[26px]">{t("account.prefs")}</SectionTitle>
        <div className="mt-3 rounded-card bg-card px-4 py-0.5 shadow-soft">
          {prefRows.map((row, index) => (
            <Row
              key={row.label}
              icon={row.icon}
              label={t(row.label)}
              value={row.value ?? t("account.pref.unset")}
              last={index === prefRows.length - 1}
              onClick={() => setEditing(row.id)}
            />
          ))}
        </div>

        <SectionTitle className="mt-[26px]">{t("account.data")}</SectionTitle>
        <div className="mt-3 rounded-card bg-card px-4 py-3.5 shadow-soft">
          <p className="flex items-start gap-2.5 text-[13px] leading-normal text-body">
            <ShieldCheck size={22} className="shrink-0 text-green" aria-hidden />
            {t("account.dataTrust")}
          </p>
          <div className="mt-2 flex gap-[18px] ps-8">
            <button type="button" onClick={() => void download()} className="min-h-11 text-[13px] font-semibold text-muted underline decoration-line-strong underline-offset-[3px]">
              {t("account.export")}
            </button>
            <button type="button" onClick={() => setEditing("delete")} className="min-h-11 text-[13px] font-semibold text-muted underline decoration-line-strong underline-offset-[3px]">
              {t("account.delete")}
            </button>
          </div>
        </div>

        <InstallButton className="mt-5" />
        {user && (
          <button type="button" onClick={() => void signOut()} className="mt-3 min-h-11 w-full text-sm font-semibold text-muted">
            {t("common.signOut")}
          </button>
        )}
      </div>

      <EditSheet editing={editing} onClose={() => setEditing(null)} profile={profile} update={update} />
      <WhatsAppSheet open={editing === "whatsapp"} onClose={() => setEditing(null)} />
      <DeleteSheet
        open={editing === "delete"}
        onClose={() => setEditing(null)}
        onDeleted={() => {
          forgetTrips();
          router.replace("/");
        }}
      />
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 22;
  const length = 2 * Math.PI * r;
  return (
    <span className="relative size-[52px] shrink-0">
      <svg width={52} height={52} viewBox="0 0 52 52" aria-hidden>
        <circle cx={26} cy={26} r={r} className="fill-none stroke-fill" strokeWidth={5} />
        <circle
          cx={26}
          cy={26}
          r={r}
          className="fill-none stroke-blue"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={length.toFixed(1)}
          strokeDashoffset={(length * (1 - percent / 100)).toFixed(1)}
          transform="rotate(-90 26 26)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" dir="ltr">
        {percent} %
      </span>
    </span>
  );
}

function Row({
  icon: RowIcon,
  label,
  hint,
  value,
  last,
  onClick,
}: {
  icon: Icon;
  label: string;
  hint?: string;
  value?: string;
  last?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full items-center gap-3.5 py-3.5 text-start", !last && "border-b border-line")}>
      <RowIcon size={22} className="shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold">{label}</span>
        {hint && <span className="block text-[12.5px] text-muted">{hint}</span>}
      </span>
      {value && <span className="max-w-[140px] truncate text-end text-[13.5px] text-muted">{value}</span>}
      <CaretRight size={16} className="shrink-0 text-muted rtl:-scale-x-100" aria-hidden />
    </button>
  );
}

function tripCity(trip: FrozenTrip, lang: Parameters<typeof placeName>[1]): string {
  return placeName(trip.package.destination.iata, lang, trip.package.destination.city);
}

function tripMonth(trip: FrozenTrip, lang: Parameters<typeof formatMonthName>[1]): string {
  const [, m] = trip.package.hotel.attrs.arrival.split("-").map(Number);
  return m ? formatMonthName(m, lang, "long") : "";
}

function TripCard({ trip }: { trip: FrozenTrip }) {
  const { t, lang } = useLanguage();
  const range = dateRangeParts(trip.package.hotel.attrs.arrival, trip.package.hotel.attrs.departure, lang);
  return (
    <li className="flex overflow-hidden rounded-card bg-card shadow-soft">
      <HotelPhoto src={trip.package.hotel.attrs.main_image} alt={trip.package.hotel.attrs.name} className="w-24 shrink-0 self-stretch" />
      <div className="min-w-0 flex-1 px-3.5 py-3">
        <p className="text-[15px] font-bold">{tripCity(trip, lang)}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          <bdi>
            {range.from} → {range.to}
          </bdi>{" "}
          · {travellersText(trip.package.flight.attrs.passengers, t)}
        </p>
        <BookingPill status={trip.booking_status} className="mt-2" />
      </div>
    </li>
  );
}

function EditSheet({
  editing,
  onClose,
  profile,
  update,
}: {
  editing: Editing;
  onClose: () => void;
  profile: ReturnType<typeof useProfile>["profile"];
  update: ReturnType<typeof useProfile>["update"];
}) {
  const { t } = useLanguage();
  const question = editing && editing !== "whatsapp" && editing !== "delete" ? editing : null;
  const title = question === "language" ? t("account.pref.language") : question ? t(QUESTION_TEXT[question].title) : "";
  const Fields = question && question !== "language" ? QUESTION_FIELDS[question] : null;
  return (
    <Sheet open={!!question} onClose={onClose} title={title}>
      {question && question !== "language" && <p className="mt-1 text-sm text-muted">{t(QUESTION_TEXT[question].why)}</p>}
      <div className="mt-4">
        {question === "language" ? <LanguageFields profile={profile} update={update} /> : Fields ? <Fields profile={profile} update={update} /> : null}
      </div>
      <Button full className="mt-5" onClick={onClose}>
        {t("common.save")}
      </Button>
    </Sheet>
  );
}

function WhatsAppSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { profile, update } = useProfile();
  const [number, setNumber] = useState(profile.whatsapp_number ?? "");
  const [consent, setConsent] = useState(!!profile.whatsapp_consent_at);
  const clean = number.replace(/[\s.-]/g, "");
  const valid = /^\+\d{8,15}$/.test(clean);
  return (
    <Sheet open={open} onClose={onClose} title={t("account.whatsapp")}>
      <label className="mt-4 block">
        <span className="text-sm font-semibold">{t("account.whatsappNumber")}</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          placeholder="+212 6…"
          className="mt-1.5 h-12 w-full rounded-[14px] border border-line bg-bg px-3.5 text-base outline-none focus:border-ink"
        />
      </label>
      {number && !valid && <p className="mt-1.5 text-[13px] text-orange">{t("account.whatsappInvalid")}</p>}
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-button bg-bg p-3.5">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-ink"
        />
        <span className="text-[13.5px] leading-snug">{t("account.whatsappConsent")}</span>
      </label>
      <p className="mt-3 text-[12.5px] text-muted">{t("account.whatsappSoon")}</p>
      <Button
        full
        className="mt-4"
        disabled={!valid || !consent}
        onClick={() => {
          void update({ whatsapp_number: clean, whatsapp_consent_at: new Date().toISOString() });
          onClose();
        }}
      >
        {t("common.save")}
      </Button>
      {profile.whatsapp_number && (
        <button
          type="button"
          onClick={() => {
            void update({ whatsapp_number: null, whatsapp_consent_at: null });
            setNumber("");
            setConsent(false);
            onClose();
          }}
          className="mt-2 min-h-11 w-full text-sm font-semibold text-muted"
        >
          {t("account.whatsappRemove")}
        </button>
      )}
    </Sheet>
  );
}

function DeleteSheet({ open, onClose, onDeleted }: { open: boolean; onClose: () => void; onDeleted: () => void }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={t("account.deleteTitle")}>
      <p className="mt-2 text-[15px] leading-snug text-muted">{t("account.deleteBody")}</p>
      {failed && (
        <p role="alert" className="mt-3 text-sm font-semibold text-red">
          {t("account.deleteError")}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed(false);
          const ok = await deleteEverything();
          setBusy(false);
          if (ok) {
            haptic("warn");
            onDeleted();
          } else setFailed(true);
        }}
        className="mt-5 flex h-14 w-full items-center justify-center rounded-button bg-red text-base font-semibold text-card disabled:opacity-50"
      >
        {t("account.deleteConfirm")}
      </button>
      <button type="button" onClick={onClose} className="mt-2 min-h-11 w-full text-sm font-semibold text-muted">
        {t("common.cancel")}
      </button>
    </Sheet>
  );
}

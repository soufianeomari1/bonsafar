"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/bs/Button";
import { Sheet } from "@/components/bs/Sheet";
import { Stepper } from "@/components/profile/ProfileFields";
import { AIRPORTS, placeName } from "@/lib/airports";
import { addDays } from "@/lib/format";
import { haptic } from "@/lib/haptics";
import { useLanguage, useT } from "@/lib/i18n/provider";
import type { Intent } from "@/lib/intent/schema";
import { answerTrip, patchIntent } from "@/lib/trip/store";
import type { IntentChipModel } from "./chips";

const INPUT =
  "h-[52px] w-full rounded-button-sm border border-line bg-card px-4 text-base text-ink outline-none focus:border-ink";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tap on a chip: edit that one value by hand. */
export function ChipEditor({
  chip,
  intent,
  onClose,
}: {
  chip: IntentChipModel | null;
  intent: Intent | null;
  onClose: () => void;
}) {
  const t = useT();
  const titles = {
    origin: t("edit.origin"),
    destination: t("edit.destination"),
    dates: t("edit.dates"),
    travellers: t("edit.travellers"),
    budget: t("edit.budget"),
    wish: t("edit.wish"),
  } as const;

  return (
    <Sheet open={!!chip && !!intent} onClose={onClose} title={chip ? titles[chip.kind] : ""}>
      {chip && intent && (
        <EditorBody key={chip.id} chip={chip} intent={intent} onClose={onClose} />
      )}
    </Sheet>
  );
}

function EditorBody({
  chip,
  intent,
  onClose,
}: {
  chip: IntentChipModel;
  intent: Intent;
  onClose: () => void;
}) {
  const t = useT();
  const [city, setCity] = useState(intent.destination?.city ?? "");
  const [depart, setDepart] = useState(intent.depart_date ?? "");
  const [ret, setRet] = useState(intent.return_date ?? "");
  const [adults, setAdults] = useState(intent.adults);
  const [children, setChildren] = useState(intent.children);
  const [budget, setBudget] = useState(intent.budget_mad ? String(intent.budget_mad) : "");

  function save() {
    switch (chip.kind) {
      case "origin":
        return;
      case "destination":
        if (city.trim() && city.trim() !== intent.destination?.city) {
          // The city name needs an airport code: the model resolves it.
          void answerTrip(t("edit.destination"), city.trim(), "destination");
        }
        break;
      case "dates":
        if (depart) {
          patchIntent({
            depart_date: depart,
            return_date: ret && ret > depart ? ret : addDays(depart, 7),
          });
        }
        break;
      case "travellers":
        patchIntent({ adults, children });
        break;
      case "budget": {
        const amount = Number(budget.replace(/[^\d]/g, ""));
        patchIntent({ budget_mad: amount > 0 ? amount : null });
        break;
      }
      case "wish":
        break;
    }
    onClose();
  }

  if (chip.kind === "wish") {
    return (
      <div className="mt-4 flex flex-col gap-4">
        <p className="text-lg font-semibold">{chip.label}</p>
        <Button
          variant="secondary"
          full
          onClick={() => {
            patchIntent({ wishes: intent.wishes.filter((_, index) => index !== chip.wishIndex) });
            onClose();
          }}
        >
          {t("common.remove")}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="mt-4 flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {chip.kind === "origin" && <OriginSearch intent={intent} onClose={onClose} />}

      {chip.kind === "destination" && (
        <input
          aria-label={t("edit.cityPlaceholder")}
          placeholder={t("edit.cityPlaceholder")}
          value={city}
          dir="auto"
          autoFocus
          onChange={(event) => setCity(event.target.value)}
          className={INPUT}
        />
      )}

      {chip.kind === "dates" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[15px] font-semibold">
            {t("edit.depart")}
            <input
              type="date"
              min={todayIso()}
              value={depart}
              onChange={(event) => setDepart(event.target.value)}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[15px] font-semibold">
            {t("edit.return")}
            <input
              type="date"
              min={depart || todayIso()}
              value={ret}
              onChange={(event) => setRet(event.target.value)}
              className={INPUT}
            />
          </label>
        </div>
      )}

      {chip.kind === "travellers" && (
        <div className="flex flex-col gap-2.5">
          <Stepper
            label={t("edit.adults")}
            value={adults}
            min={1}
            max={9}
            lessLabel={t("edit.less")}
            moreLabel={t("edit.more")}
            onChange={setAdults}
          />
          <Stepper
            label={t("edit.children")}
            value={children}
            min={0}
            max={9}
            lessLabel={t("edit.less")}
            moreLabel={t("edit.more")}
            onChange={setChildren}
          />
        </div>
      )}

      {chip.kind === "budget" && (
        <input
          aria-label={t("edit.budget")}
          inputMode="numeric"
          autoFocus
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          className={`${INPUT} tabular`}
        />
      )}

      {chip.kind !== "origin" && (
        <Button type="submit" full>
          {t("common.save")}
        </Button>
      )}
    </form>
  );
}

function OriginSearch({ intent, onClose }: { intent: Intent; onClose: () => void }) {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? Object.values(AIRPORTS)
        .filter(
          (airport) =>
            airport.city &&
            (airport.iata.toLowerCase().startsWith(q) ||
              airport.city.toLowerCase().includes(q) ||
              placeName(airport.iata, lang).toLowerCase().includes(q)),
        )
        .slice(0, 6)
    : [];

  return (
    <div className="flex flex-col gap-2">
      <label className="flex h-12 items-center gap-2 rounded-[14px] border border-line bg-card px-3.5">
        <MagnifyingGlass size={20} className="shrink-0 text-muted" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("express.airport.search")}
          aria-label={t("express.airport.search")}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
      </label>
      {intent.origin_iata && (
        <p className="px-1 text-sm text-muted">
          <bdi dir="ltr">
            {placeName(intent.origin_iata, lang)} · {intent.origin_iata}
          </bdi>
        </p>
      )}
      {q && results.length === 0 && <p className="px-1 text-sm text-muted">{t("express.airport.none")}</p>}
      {results.map((airport) => (
        <button
          key={airport.iata}
          type="button"
          onClick={() => {
            haptic("select");
            patchIntent({ origin_iata: airport.iata });
            onClose();
          }}
          className="flex min-h-11 items-center justify-between rounded-[14px] bg-card px-3.5 text-start text-[15px]"
        >
          <span>{placeName(airport.iata, lang)}</span>
          <bdi dir="ltr" className="font-mono text-[13px] text-muted">
            {airport.iata}
          </bdi>
        </button>
      ))}
    </div>
  );
}

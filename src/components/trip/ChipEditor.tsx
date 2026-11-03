"use client";

import { useState } from "react";
import { Button } from "@/components/bs/Button";
import { Sheet } from "@/components/bs/Sheet";
import { Stepper } from "@/components/profile/ProfileFields";
import { addDays } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
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
      case "destination":
        if (city.trim() && city.trim() !== intent.destination?.city) {
          // The city name needs an airport code: the model resolves it.
          void answerTrip(t("edit.destination"), city.trim());
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

      <Button type="submit" full>
        {t("common.save")}
      </Button>
    </form>
  );
}

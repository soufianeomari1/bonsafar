// The typed Prague request must parse. No model, no network.
import assert from "node:assert/strict";
import test from "node:test";
import { coerceModelIntent } from "../src/lib/intent/coerce.ts";
import { IntentSchema } from "../src/lib/intent/schema.ts";
import { travellerNamedMoney } from "../src/lib/intent/spoken-budget.ts";
import { containsMoney } from "../src/lib/prices/guardrail.ts";

const PHRASE =
  "Paris à prague, du 14 au 21 décembre, hôtel 4 étoiles à côté de l'horloge connue de Prague";

test("stars, dates, durations and traveller counts are not amounts", () => {
  for (const text of [
    PHRASE,
    "4 étoiles",
    "hôtel 4 étoiles",
    "14",
    "21",
    "14 décembre",
    "21 décembre",
    "2 adultes",
    "3 personnes",
    "7 nuits",
    "4h",
    "4 heures",
  ]) {
    assert.equal(containsMoney(text), false, text);
    assert.equal(travellerNamedMoney(text), false, text);
  }
  for (const text of ["1500 dh", "4 euros", "4€", "800 DH", "prix 400", "400 prix", "quinze mille dirhams"]) {
    assert.equal(travellerNamedMoney(text), true, text);
  }
});

test("the Prague sentence keeps the city, the dates, the stars and the clock", () => {
  const raw = {
    destination: { city: "Prague", country: "Czech Republic", iata: "prg" },
    origin_iata: "cdg",
    depart_date: "2026-12-14",
    return_date: "2026-12-21",
    nights: 7,
    adults: 1,
    children: 0,
    budget_mad: 4,
    budget_per_night_mad: 14,
    wishes: [
      { kind: "other", label: "hôtel 4 étoiles" },
      { kind: "location", label: "hôtel 4 étoiles à côté de l'horloge connue de Prague" },
    ],
    keywords: [
      { text: PHRASE, slot: "wish" },
      { text: "Paris", slot: "origin" },
      { text: "prague", slot: "destination" },
      { text: "14 au 21 décembre", slot: "dates" },
    ],
    question: { topic: "other", field: "dates", darija: "", fr: "", en: "", options: [] },
  };

  assert.equal(IntentSchema.safeParse({ ...raw, translation_en: "" }).success, false);

  const parsed = IntentSchema.safeParse({ ...coerceModelIntent(raw), translation_en: "" });
  assert.equal(parsed.success, true, parsed.success ? "" : parsed.error.message);
  if (!parsed.success) return;
  const intent = parsed.data;
  assert.equal(intent.destination?.city, "Prague");
  assert.equal(intent.destination?.iata, "PRG");
  assert.equal(intent.origin_iata, "CDG");
  assert.equal(intent.depart_date, "2026-12-14");
  assert.equal(intent.return_date, "2026-12-21");
  assert.equal(intent.nights, 7);
  assert.deepEqual(
    intent.wishes.map((wish) => wish.kind),
    ["other", "near_landmark"],
  );
  assert.match(intent.wishes[0].label, /4 étoiles/);
  assert.match(intent.wishes[1].label, /horloge/);
  assert.equal(intent.question, null);
});

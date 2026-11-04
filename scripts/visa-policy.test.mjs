// Unit checks for the visa-free chip. No model, no network.
// A Schengen city on a profile without a Schengen visa never shows "Visa-free",
// and the check runs in the same call as the destination change.
import assert from "node:assert/strict";
import test from "node:test";
import { FATIMA, SCENARIOS } from "../src/lib/agent/scenarios.ts";
import { applyVisaPolicy, askedVisaFree, assessVisa } from "../src/lib/visa/policy.ts";
import { countryCodeOf } from "../src/lib/visa/schengen.ts";

const NO_VISA = "Where can I go with no visa this summer?";

function trip(overrides) {
  return {
    ...SCENARIOS.istanbul,
    depart_date: null,
    return_date: null,
    nights: null,
    wishes: [{ kind: "other", label: "Visa-free" }],
    keywords: [],
    question: {
      topic: "destination",
      field: "destination",
      darija: "Fin?",
      fr: "Où ?",
      en: "Where to?",
      options: [
        { darija: "Santorini", fr: "Santorin", en: "Santorini" },
        { darija: "Maldives", fr: "Maldives", en: "Maldives" },
      ],
    },
    translation_en: NO_VISA,
    ...overrides,
  };
}

test("an invented city is dropped until the traveller names one", () => {
  const invented = trip({
    destination: { city: "Santorini", country: "Greece", iata: "JTR" },
  });
  const cleaned = applyVisaPolicy(invented, FATIMA, NO_VISA);
  assert.equal(cleaned.destination, null);
  const view = assessVisa({ intent: cleaned, profile: FATIMA, corpus: NO_VISA });
  assert.equal(view.showVisaFreeChip, false);
  assert.equal(view.warning, null);
  assert.deepEqual(view.ideaIds, ["istanbul", "omra"]);
});

test("a no-visa request is not treated as a fact before a destination exists", () => {
  const intent = trip({ destination: null });
  const view = assessVisa({ intent, profile: FATIMA, corpus: NO_VISA });
  assert.equal(view.showVisaFreeChip, false);
  assert.equal(view.warning, null);
  assert.deepEqual(view.ideaIds, ["istanbul", "omra"]);
  assert.equal(view.wishes.some((wish) => /visa/i.test(wish.label)), false);
  assert.ok(!view.ideaIds.includes("paris"));
});

test("Santorini for a Moroccan passport without Schengen never shows Visa-free", () => {
  const intent = trip({
    destination: { city: "Santorini", country: "Greece", iata: "JTR" },
  });
  const view = assessVisa({
    intent,
    profile: FATIMA,
    corpus: `${NO_VISA}\nSantorini`,
  });
  assert.equal(view.showVisaFreeChip, false);
  assert.equal(view.ideaIds, null);
  assert.equal(view.conflictOpen, true);
  assert.deepEqual(view.warning, { city: "Santorini", countryCode: "GR" });
  assert.equal(view.wishes.some((wish) => /visa/i.test(wish.label)), false);
});

test("a destination change is checked in the same call", () => {
  const open = trip({ destination: null });
  const before = assessVisa({ intent: open, profile: FATIMA, corpus: NO_VISA });
  assert.equal(before.warning, null);
  assert.deepEqual(before.ideaIds, ["istanbul", "omra"]);

  const named = {
    ...open,
    destination: { city: "Santorini", country: "Island", iata: "JTR" },
  };
  const after = assessVisa({
    intent: named,
    profile: FATIMA,
    corpus: `${NO_VISA}\nSantorini`,
  });
  assert.equal(after.showVisaFreeChip, false);
  assert.equal(after.conflictOpen, true);
  assert.equal(after.warning?.countryCode, "GR");
  assert.equal(countryCodeOf(named.destination), "GR");
  assert.equal(applyVisaPolicy(named, FATIMA, NO_VISA).wishes.length, 0);
});

test("keeping the city closes the choice and still withholds Visa-free", () => {
  const intent = trip({
    destination: { city: "Santorini", country: "Greece", iata: "JTR" },
  });
  const view = assessVisa({
    intent,
    profile: FATIMA,
    corpus: `${NO_VISA}\nSantorini`,
    keptCity: "Santorini",
  });
  assert.equal(view.conflictOpen, false);
  assert.equal(view.showVisaFreeChip, false);
  assert.equal(view.warning?.city, "Santorini");
});

test("a verified idea can show Visa-free, and a Schengen visa makes Greece verified", () => {
  const istanbul = trip({
    destination: { city: "Istanbul", country: "Turkey", iata: "IST" },
  });
  const free = assessVisa({ intent: istanbul, profile: FATIMA, corpus: `${NO_VISA}\nIstanbul` });
  assert.equal(free.showVisaFreeChip, true);
  assert.equal(free.warning, null);

  const greece = trip({
    destination: { city: "Santorini", country: "Greece", iata: "JTR" },
  });
  const holder = assessVisa({
    intent: greece,
    profile: { ...FATIMA, has_schengen: true },
    corpus: `${NO_VISA}\nSantorini`,
  });
  assert.equal(holder.showVisaFreeChip, true);
  assert.equal(holder.conflictOpen, false);
});

test("the three jury scenarios are unchanged when nobody asked for no visa", () => {
  for (const intent of [SCENARIOS.istanbul, SCENARIOS.paris]) {
    const view = assessVisa({
      intent,
      profile: FATIMA,
      corpus: intent.translation_en,
    });
    assert.equal(applyVisaPolicy(intent, FATIMA, intent.translation_en), intent);
    assert.deepEqual(view.wishes, intent.wishes);
    assert.equal(view.showVisaFreeChip, false);
    assert.equal(view.warning, null);
    assert.equal(view.conflictOpen, false);
    assert.equal(view.ideaIds, null);
  }

  const sea = trip({
    destination: null,
    wishes: [{ kind: "sea", label: "Sea" }],
    translation_en: "Somewhere by the sea this summer, me and my husband.",
    question: {
      topic: "dates",
      field: "dates",
      darija: "Imta?",
      fr: "Quand ?",
      en: "When?",
      options: [
        { darija: "Agadir", fr: "Agadir", en: "Agadir · 1 week in early July" },
        { darija: "Tanger", fr: "Tanger", en: "Tangier · 1 week in mid-July" },
        { darija: "Hammamet", fr: "Hammamet", en: "Hammamet · 1 week in August" },
      ],
    },
  });
  const view = assessVisa({ intent: sea, profile: FATIMA, corpus: sea.translation_en });
  assert.equal(applyVisaPolicy(sea, FATIMA, sea.translation_en), sea);
  assert.deepEqual(view.wishes, sea.wishes);
  assert.equal(view.ideaIds, null);
  assert.deepEqual(view.wishes.map((wish) => wish.label), ["Sea"]);
});

test("visa wording is detected only as a no-visa request", () => {
  assert.equal(askedVisaFree("Where can I go with no visa this summer?"), true);
  assert.equal(askedVisaFree("Où partir sans visa cet été ?"), true);
  assert.equal(askedVisaFree("Fin nmchi bla visa had sif"), true);
  assert.equal(askedVisaFree("فين نمشي بلا فيزا هاد الصيف"), true);
  assert.equal(askedVisaFree("بدون تأشيرة هذا الصيف"), true);
  assert.equal(askedVisaFree("Visa-free"), true);
  assert.equal(askedVisaFree("Paris needs a Schengen visa"), false);
  assert.equal(askedVisaFree(SCENARIOS.paris.translation_en), false);
  assert.equal(askedVisaFree(SCENARIOS.istanbul.translation_en), false);
});

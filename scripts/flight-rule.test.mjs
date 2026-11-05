// The direct-flight cap is 800 DH per paying traveller, and still 20%.
import assert from "node:assert/strict";
import test from "node:test";
import { applyFlightRule } from "../src/lib/prices/flight-rule.ts";

function flight(id, priceMad, stops, adults, children = 0, infants = 0) {
  return {
    id,
    kind: "flight",
    price_mad: priceMad,
    attrs: {
      outbound: { stops },
      inbound: { stops: 0 },
      passengers: { adults, children, infants },
    },
  };
}

test("two adults keep a direct flight when the gap is about 700 DH each", () => {
  const direct = flight("F1", 5400, 0, 2);
  const stop = flight("F2", 4000, 1, 2);
  const decision = applyFlightRule("F2", [direct, stop]);
  assert.equal(decision.flightId, "F1");
  assert.equal(decision.changed, true);
});

test("two adults drop the direct flight when the gap exceeds 800 DH each and 20%", () => {
  const direct = flight("F1", 5800, 0, 2);
  const stop = flight("F2", 4000, 1, 2);
  const decision = applyFlightRule("F1", [direct, stop]);
  assert.equal(decision.flightId, "F2");
  assert.equal(decision.changed, true);
});

test("an infant does not raise the cap", () => {
  const direct = flight("F1", 5700, 0, 2, 0, 1);
  const stop = flight("F2", 4000, 1, 2, 0, 1);
  const decision = applyFlightRule("F1", [direct, stop]);
  assert.equal(decision.flightId, "F2");
});

test("a child does raise the cap", () => {
  const direct = flight("F1", 5700, 0, 2, 1, 0);
  const stop = flight("F2", 4000, 1, 2, 1, 0);
  const decision = applyFlightRule("F2", [direct, stop]);
  assert.equal(decision.flightId, "F1");
});

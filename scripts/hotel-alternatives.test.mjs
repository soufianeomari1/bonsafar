// Code-built cards change only the hotel, on the same flight and the same stay.
import assert from "node:assert/strict";
import test from "node:test";
import { pickHotelAlternatives } from "../src/lib/agent/hotel-alternatives.ts";

const base = {
  flightId: "F1",
  hotelId: "H1",
  city: "Prague",
  nights: 7,
  rating: 8.4,
  totalMad: 2000,
  payingTravellers: 2,
  taken: [],
};

function hotel(id, rating, reviews, totalMad, extra = {}) {
  return { id, city: "Prague", nights: 7, rating, reviews, totalMad, ...extra };
}

test("adds a cheaper hotel then a better-rated one, up to 3 cards", () => {
  const picked = pickHotelAlternatives({
    ...base,
    hotels: [
      hotel("H1", 8.4, 200, 2000),
      hotel("H2", 8.1, 180, 1500),
      hotel("H3", 9.1, 400, 2400),
      hotel("H4", 8.6, 50, 1200),
      hotel("H5", 9.4, 300, 3000),
    ],
  });
  assert.deepEqual(
    picked.map((item) => item.label),
    ["cheaper_hotel", "better_hotel"],
  );
  assert.equal(picked[0].hotelId, "H2");
  assert.equal(picked[1].hotelId, "H3");
});

test("a tiny saving and a too-expensive top hotel are left out", () => {
  const picked = pickHotelAlternatives({
    ...base,
    hotels: [
      hotel("H2", 8.2, 200, 1900),
      hotel("H3", 9.2, 200, 2900),
    ],
  });
  assert.deepEqual(picked, []);
});

test("model alternatives already filling the row leave no room", () => {
  const picked = pickHotelAlternatives({
    ...base,
    taken: [
      { flightId: "F2", hotelId: "H9", label: "direct" },
      { flightId: "F3", hotelId: "H8", label: "cheapest" },
    ],
    hotels: [hotel("H2", 8.2, 200, 1000), hotel("H3", 9.2, 200, 2100)],
  });
  assert.deepEqual(picked, []);
});

test("one free card takes the cheaper hotel only", () => {
  const picked = pickHotelAlternatives({
    ...base,
    taken: [{ flightId: "F2", hotelId: "H9", label: "direct" }],
    hotels: [hotel("H2", 8.2, null, 1000), hotel("H3", 9.2, 200, 2100)],
  });
  assert.deepEqual(picked, [{ label: "cheaper_hotel", hotelId: "H2" }]);
});

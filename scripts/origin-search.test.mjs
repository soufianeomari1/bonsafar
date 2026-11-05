// A named city searches every airport. A named airport, or silence, stays one code.
import assert from "node:assert/strict";
import test from "node:test";
import { resolveDeparture } from "../src/lib/intent/origin.ts";

test("Paris searches the city, Orly and CDG stay one airport, silence keeps CMN", () => {
  const paris = resolveDeparture({
    originIata: "CDG",
    homeAirport: "CMN",
    originKeywords: ["Paris"],
  });
  assert.equal(paris.city, "Paris");
  assert.equal(paris.iata, "CDG");

  const orly = resolveDeparture({
    originIata: "CDG",
    homeAirport: "CMN",
    originKeywords: ["depuis Orly"],
  });
  assert.equal(orly.city, null);
  assert.equal(orly.iata, "ORY");

  const cdg = resolveDeparture({
    originIata: "PAR",
    homeAirport: "CMN",
    originKeywords: ["from CDG"],
  });
  assert.equal(cdg.city, null);
  assert.equal(cdg.iata, "CDG");

  const home = resolveDeparture({ originIata: null, homeAirport: "CMN", originKeywords: [] });
  assert.equal(home.city, null);
  assert.equal(home.iata, "CMN");
});

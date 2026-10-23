import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkoutPackageLabel, coachingMeetingPrice } from "./coachingCheckoutStep";

const label = (query: string) => checkoutPackageLabel(new URLSearchParams(query));

describe("the package label on the coaching step", () => {
  it("names the weekly count and the term the schedule step put in the link", () => {
    assert.equal(label("per_week=3&duration=90"), "Haftada 3 ders · 3 ay");
    assert.equal(label("per_week=2&duration=30"), "Haftada 2 ders · 1 ay");
    assert.equal(label("per_week=6&duration=180"), "Haftada 6 ders · 6 ay");
  });

  it("writes a term under a month in weeks", () => {
    assert.equal(label("per_week=2&duration=14"), "Haftada 2 ders · 2 hafta");
  });

  it("says what it knows when one half is missing", () => {
    assert.equal(label("per_week=4"), "Haftada 4 ders");
    assert.equal(label("duration=90"), "3 ay");
  });

  it("ignores values the catalog does not sell, and says nothing without any", () => {
    assert.equal(label("per_week=9&duration=45"), null);
    assert.equal(label("per_week=abc&duration="), null);
    assert.equal(label(""), null);
    assert.equal(label("per_week=3&duration=45"), "Haftada 3 ders");
  });
});

describe("the price of one coaching meeting", () => {
  it("is whole lira without ,00 and the symbol follows the number", () => {
    assert.equal(coachingMeetingPrice(40000), "400\u00a0₺");
    assert.equal(coachingMeetingPrice(240000), "2.400\u00a0₺");
  });

  it("keeps the kuruş when there are some", () => {
    assert.equal(coachingMeetingPrice(45050), "450,50\u00a0₺");
  });
});

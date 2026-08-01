import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TutorPackageOffer } from "@/types";
import { computeChangedOffers, draftsFromOffers } from "./tutorPackageOffers";

function offer(overrides: Partial<TutorPackageOffer>): TutorPackageOffer {
  return {
    plan_id: "plan-1",
    plan_name: "Haftada 1 · 14 Gün",
    plan_code: "weekly_1_14d",
    lesson_count: 2,
    lesson_duration_minutes: 40,
    lessons_per_week: 1,
    duration_days: 14,
    catalog_discount_percent: 0,
    is_offered: true,
    discount_percent: null,
    effective_discount_percent: 0,
    max_discount_percent: 20,
    ...overrides,
  };
}

describe("computeChangedOffers", () => {
  it("returns nothing when the draft exactly mirrors the fetched offers", () => {
    const offers = [offer({}), offer({ plan_id: "plan-2", is_offered: false })];
    const drafts = draftsFromOffers(offers);
    assert.deepEqual(computeChangedOffers(offers, drafts), []);
  });

  it("includes only the plan whose is_offered was toggled", () => {
    const offers = [
      offer({ plan_id: "plan-1" }),
      offer({ plan_id: "plan-2", is_offered: false }),
      offer({ plan_id: "plan-3" }),
    ];
    const drafts = draftsFromOffers(offers);
    drafts["plan-2"] = { ...drafts["plan-2"], is_offered: true };

    const changed = computeChangedOffers(offers, drafts);
    assert.equal(changed.length, 1);
    assert.deepEqual(changed[0], {
      plan_id: "plan-2",
      is_offered: true,
      discount_percent: null,
    });
  });

  it("includes only the plan whose discount_percent was set", () => {
    const offers = [offer({ plan_id: "plan-1" }), offer({ plan_id: "plan-2" })];
    const drafts = draftsFromOffers(offers);
    drafts["plan-1"] = { ...drafts["plan-1"], discount_percent: 15 };

    const changed = computeChangedOffers(offers, drafts);
    assert.equal(changed.length, 1);
    assert.equal(changed[0].plan_id, "plan-1");
    assert.equal(changed[0].discount_percent, 15);
  });

  it("nets out to nothing when a plan is toggled off then back on within the same session", () => {
    const offers = [offer({ plan_id: "plan-1" })];
    const drafts = draftsFromOffers(offers);
    drafts["plan-1"] = { ...drafts["plan-1"], is_offered: false };
    drafts["plan-1"] = { ...drafts["plan-1"], is_offered: true };

    assert.deepEqual(computeChangedOffers(offers, drafts), []);
  });

  it("never emits all 20 catalog plans just because the page rendered all of them", () => {
    const offers = Array.from({ length: 20 }, (_, i) =>
      offer({ plan_id: `plan-${i}`, lessons_per_week: (i % 5) + 1 })
    );
    const drafts = draftsFromOffers(offers);
    // The tutor only actually changes one plan.
    drafts["plan-7"] = { ...drafts["plan-7"], discount_percent: 10 };

    const changed = computeChangedOffers(offers, drafts);
    assert.equal(changed.length, 1);
    assert.equal(changed[0].plan_id, "plan-7");
  });

  it("ignores a plan with no matching draft entry instead of crashing", () => {
    const offers = [offer({ plan_id: "plan-1" }), offer({ plan_id: "plan-2" })];
    const drafts = draftsFromOffers([offers[0]]); // plan-2 missing on purpose

    assert.deepEqual(computeChangedOffers(offers, drafts), []);
  });
});

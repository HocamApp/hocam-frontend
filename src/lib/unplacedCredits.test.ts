import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { paidPurchase } from "@/test/refundFixtures";
import { hasUnplacedCredits } from "./unplacedCredits";

describe("a package with credits that are not on the calendar", () => {
  it("is a paid weekly package with credits left", () => {
    assert.equal(hasUnplacedCredits(paidPurchase({ remaining_credits: 4 })), true);
  });

  it("is not a package with every credit placed", () => {
    assert.equal(hasUnplacedCredits(paidPurchase({ remaining_credits: 0 })), false);
  });

  it("is not a package that is not paid", () => {
    for (const status of ["pending", "cancelled", "refunded"] as const) {
      assert.equal(hasUnplacedCredits(paidPurchase({ status, remaining_credits: 4 })), false, status);
    }
  });

  it("is not a package with no weekly plan to pick hours from", () => {
    const base = paidPurchase({ remaining_credits: 4 });
    assert.equal(
      hasUnplacedCredits({ ...base, plan: { ...base.plan, lessons_per_week: null } }),
      false
    );
    assert.equal(
      hasUnplacedCredits({ ...base, plan: { ...base.plan, duration_days: null } }),
      false
    );
  });
});

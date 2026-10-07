import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { monthlyEarnings } from "./earnings";

describe("monthlyEarnings", () => {
  it("matches the plan's worked example", () => {
    assert.deepEqual(monthlyEarnings(6, 1000, 20), {
      lessons: 26,
      gross: 26000,
      commission: 5200,
      net: 20800,
    });
  });

  it("rounds lessons per month to whole lessons", () => {
    assert.equal(monthlyEarnings(1, 1000, 0).lessons, 4);
    assert.equal(monthlyEarnings(20, 1000, 0).lessons, 87);
  });
});

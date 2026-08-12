import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMetricShare, COACHING_TIME_OPTIONS } from "./coachingVisuals";

describe("coaching visuals", () => {
  it("derives display shares from known current counts without inventing unavailable values", () => {
    assert.deepEqual(buildMetricShare([2, 1, 1, 0]), [50, 25, 25, 0]);
    assert.deepEqual(buildMetricShare([0, 0, 0, 0]), [0, 0, 0, 0]);
    assert.deepEqual(buildMetricShare([2, null, 2, 0]), [50, null, 50, 0]);
  });

  it("provides a complete locale-independent 24-hour half-hour sequence", () => {
    assert.equal(COACHING_TIME_OPTIONS[0], "00:00");
    assert.equal(COACHING_TIME_OPTIONS.at(-1), "23:30");
    assert.equal(COACHING_TIME_OPTIONS.length, 48);
    assert.equal(COACHING_TIME_OPTIONS.includes("18:00"), true);
  });
});

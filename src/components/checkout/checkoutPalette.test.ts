import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeCheckoutPalette } from "./checkoutPalette";

test("normalizes the five temporary checkout palette options", () => {
  for (const value of ["a", "b", "c", "d", "e"] as const) {
    assert.equal(normalizeCheckoutPalette(value), value);
  }

  assert.equal(normalizeCheckoutPalette(null), "a");
  assert.equal(normalizeCheckoutPalette("unknown"), "a");
});

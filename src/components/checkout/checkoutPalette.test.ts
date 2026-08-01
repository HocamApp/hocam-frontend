import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CHECKOUT_PALETTE_NAMES,
  CHECKOUT_PALETTES,
  normalizeCheckoutPalette,
} from "./checkoutPalette";

test("normalizes the ten temporary macro-composition options", () => {
  const expected = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
  assert.deepEqual([...CHECKOUT_PALETTES], expected);
  assert.equal(Object.keys(CHECKOUT_PALETTE_NAMES).length, 10);

  for (const value of expected) {
    assert.equal(normalizeCheckoutPalette(value), value);
  }

  assert.equal(normalizeCheckoutPalette(null), "01");
  assert.equal(normalizeCheckoutPalette("a"), "01");
  assert.equal(normalizeCheckoutPalette("unknown"), "01");
});

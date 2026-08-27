import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

test("maps the default checkout palette to the locked Hocam design roles", () => {
  const css = readFileSync(
    new URL("../../app/(checkout)/checkout.css", import.meta.url),
    "utf8"
  );
  const gardenSplit = css.match(
    /\[data-checkout-palette="01"\]\s*\{([\s\S]*?)\n\}/
  )?.[1];

  assert.ok(gardenSplit, "default checkout token block should exist");
  assert.match(gardenSplit, /--checkout-left-surface: #fbf6f6/);
  assert.match(gardenSplit, /--checkout-right-surface: #fce5f1/);
  assert.match(gardenSplit, /--checkout-private: #ffd100/);
  assert.match(gardenSplit, /--checkout-private-ink: #4a3b00/);
  assert.match(gardenSplit, /--checkout-feature-surface: #ffffff/);
  assert.match(gardenSplit, /--checkout-pro: #02171a/);
  assert.match(gardenSplit, /--checkout-pro-ink: #ffffff/);
  assert.match(gardenSplit, /--checkout-duration-surface: #ffffff/);
  assert.match(gardenSplit, /--checkout-selected-duration: #ffffff/);
  assert.match(gardenSplit, /--checkout-duration-control: #02171a/);
  assert.match(gardenSplit, /--checkout-advantage: #ffd100/);
  assert.match(gardenSplit, /--checkout-cta: #fa0050/);
  assert.match(gardenSplit, /--checkout-cta-hover: #d70f64/);
  assert.match(gardenSplit, /--checkout-compare-private: #ffd100/);
  assert.match(gardenSplit, /--checkout-compare-private-ink: #4a3b00/);
});

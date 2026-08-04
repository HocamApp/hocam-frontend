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

test("keeps the approved Garden Split roles explicit and checkout-scoped", () => {
  const css = readFileSync(
    new URL("../../app/(checkout)/checkout.css", import.meta.url),
    "utf8"
  );
  const gardenSplit = css.match(
    /\[data-checkout-palette="01"\]\s*\{([\s\S]*?)\n\}/
  )?.[1];

  assert.ok(gardenSplit, "Garden Split token block should exist");
  assert.match(gardenSplit, /--checkout-private: color-mix\(in srgb, #efcc5e 82%, #ffffff\)/);
  assert.match(gardenSplit, /--checkout-feature-surface: #ffffff/);
  assert.match(gardenSplit, /--checkout-pro: #c2ecad/);
  assert.match(gardenSplit, /--checkout-pro-ink: #343633/);
  assert.match(gardenSplit, /--checkout-duration-surface: #f5f4ec/);
  assert.match(gardenSplit, /--checkout-selected-duration: #ffffff/);
  assert.match(gardenSplit, /--checkout-duration-control: #343633/);
  assert.match(gardenSplit, /--checkout-advantage: #efcc5e/);
  assert.match(gardenSplit, /--checkout-cta: #343633/);
  assert.match(gardenSplit, /--checkout-compare-private: color-mix\(in srgb, #efcc5e 82%, #ffffff\)/);
  assert.match(gardenSplit, /--checkout-compare-private-ink: #343633/);
});

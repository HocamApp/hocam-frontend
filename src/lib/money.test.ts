import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatTryMinor, isFreeMinor } from "./money";

describe("formatTryMinor", () => {
  it("formats whole lira with two decimals", () => {
    // Intl uses a narrow no-break space before/around the symbol depending
    // on the runtime, so assert on the digits rather than exact spacing.
    const formatted = formatTryMinor(123456);
    assert.match(formatted, /1\.234,56/);
  });

  it("formats zero", () => {
    assert.match(formatTryMinor(0), /0,00/);
  });

  it("formats a sub-lira amount", () => {
    assert.match(formatTryMinor(94), /0,94/);
  });

  it("does not lose kuruş precision", () => {
    assert.match(formatTryMinor(45001), /450,01/);
  });
});

describe("isFreeMinor", () => {
  it("is true only for exactly zero", () => {
    assert.equal(isFreeMinor(0), true);
    assert.equal(isFreeMinor(1), false);
    assert.equal(isFreeMinor(45000), false);
  });
});

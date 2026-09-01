import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dativeName } from "./turkishSuffix";

describe("dativeName", () => {
  it("adds a buffer consonant after a vowel", () => {
    assert.equal(dativeName("Ayşe"), "Ayşe'ye");
    assert.equal(dativeName("Su"), "Su'ya");
    assert.equal(dativeName("Ali"), "Ali'ye");
  });

  it("harmonises with the last vowel, not the first", () => {
    assert.equal(dativeName("Mehmet"), "Mehmet'e");
    assert.equal(dativeName("Burak"), "Burak'a");
    assert.equal(dativeName("Zeynep"), "Zeynep'e");
    assert.equal(dativeName("Yağmur"), "Yağmur'a");
  });

  it("reads the Turkish dotted and dotless i correctly", () => {
    // A locale-blind lowercase turns "I" into "i" and picks the front vowel.
    assert.equal(dativeName("Işıl"), "Işıl'a");
    assert.equal(dativeName("İrem"), "İrem'e");
  });

  it("falls back to the front form when there is no vowel", () => {
    assert.equal(dativeName("MT"), "MT'e");
  });

  it("returns nothing for an empty name", () => {
    assert.equal(dativeName("   "), "");
  });
});

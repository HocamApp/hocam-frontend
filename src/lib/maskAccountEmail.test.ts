import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { maskAccountEmail } from "./maskAccountEmail";

describe("maskAccountEmail", () => {
  it("keeps the first three characters of the local part and the whole domain", () => {
    assert.equal(
      maskAccountEmail("officialardaguner@gmail.com"),
      "off***@gmail.com"
    );
    assert.equal(maskAccountEmail("hoca@example.com"), "hoc***@example.com");
  });

  it("keeps subdomains and multi-label domains intact", () => {
    assert.equal(
      maskAccountEmail("kullanici@mail.hocam.com.tr"),
      "kul***@mail.hocam.com.tr"
    );
  });

  it("shows what it has when the local part is shorter than three characters", () => {
    assert.equal(maskAccountEmail("ab@gmail.com"), "ab***@gmail.com");
    assert.equal(maskAccountEmail("a@gmail.com"), "a***@gmail.com");
  });

  it("masks the same way regardless of surrounding whitespace", () => {
    assert.equal(maskAccountEmail("  hoca@example.com  "), "hoc***@example.com");
  });

  it("never leaks the tail of the local part", () => {
    const masked = maskAccountEmail("officialardaguner@gmail.com");
    assert.ok(masked);
    assert.equal(masked.includes("ardaguner"), false);
    assert.equal(masked.includes("officialardaguner"), false);
  });

  it("falls back to null for missing addresses", () => {
    assert.equal(maskAccountEmail(null), null);
    assert.equal(maskAccountEmail(undefined), null);
    assert.equal(maskAccountEmail(""), null);
    assert.equal(maskAccountEmail("   "), null);
  });

  it("falls back to null for malformed addresses", () => {
    assert.equal(maskAccountEmail("not-an-email"), null);
    assert.equal(maskAccountEmail("@gmail.com"), null);
    assert.equal(maskAccountEmail("hoca@"), null);
    assert.equal(maskAccountEmail("@"), null);
    assert.equal(maskAccountEmail("ho@ca@example.com"), null);
  });
});

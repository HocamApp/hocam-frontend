import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loginUrlWithReturn, safeReturnUrl } from "./utils";

/** What LoginForm does with the address loginUrlWithReturn built. */
function readBack(loginUrl: string): string | null {
  const query = loginUrl.split("?")[1] ?? "";
  return safeReturnUrl(new URLSearchParams(query).get("returnUrl"));
}

/** Where a browser would actually go for a given returnUrl. */
function resolvedOrigin(path: string): string {
  return new URL(path, "https://hocam.app/login").origin;
}

describe("safeReturnUrl", () => {
  it("keeps same-origin paths, with their query", () => {
    assert.equal(safeReturnUrl("/package-purchases/p-1/pay"), "/package-purchases/p-1/pay");
    assert.equal(safeReturnUrl("/odeme/basarili"), "/odeme/basarili");
    assert.equal(
      safeReturnUrl("/tutors/t-1/checkout?plan=w3-d30&context=yks"),
      "/tutors/t-1/checkout?plan=w3-d30&context=yks"
    );
  });

  it("rejects empty and missing values", () => {
    assert.equal(safeReturnUrl(""), null);
    assert.equal(safeReturnUrl(null), null);
    assert.equal(safeReturnUrl(undefined), null);
  });

  it("rejects absolute and scheme-relative URLs", () => {
    assert.equal(safeReturnUrl("https://evil.com"), null);
    assert.equal(safeReturnUrl("//evil.com"), null);
    assert.equal(safeReturnUrl("///evil.com"), null);
    assert.equal(safeReturnUrl("/\\evil.com"), null);
  });

  it("rejects schemes such as javascript:", () => {
    assert.equal(safeReturnUrl("javascript:alert(1)"), null);
    assert.equal(safeReturnUrl("/javascript:alert(1)"), null);
    assert.equal(safeReturnUrl("data:text/html,x"), null);
  });

  // The browser strips tab and newline from a URL and reads "\" as "/"
  // before resolving it, so these are "//evil.com" by the time they navigate.
  it("rejects paths the browser would turn into another origin", () => {
    for (const raw of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/\t\\evil.com",
      "/foo\\..\\\\evil.com",
    ]) {
      assert.equal(safeReturnUrl(raw), null, JSON.stringify(raw));
    }
  });

  it("never returns a path that resolves off-site", () => {
    for (const raw of [
      "/a",
      "/%2F%2Fevil.com",
      "/%5Cevil.com",
      "/%09/evil.com",
      "/ /evil.com",
    ]) {
      const safe = safeReturnUrl(raw);
      if (safe !== null) assert.equal(resolvedOrigin(safe), "https://hocam.app", raw);
    }
  });

  // searchParams.get decodes once. A double-encoded "//evil.com" arrives as
  // "%2F%2Fevil.com": not a path at all, so it is refused rather than decoded
  // again; an encoded slash after a real leading "/" stays an on-site path.
  it("does not decode a second time", () => {
    const once = new URLSearchParams("returnUrl=%252F%252Fevil.com").get("returnUrl");
    assert.equal(once, "%2F%2Fevil.com");
    assert.equal(safeReturnUrl(once), null);
    assert.equal(safeReturnUrl("/%2F%2Fevil.com"), "/%2F%2Fevil.com");
  });
});

describe("loginUrlWithReturn", () => {
  it("encodes the return path for the login page", () => {
    assert.equal(
      loginUrlWithReturn("/package-purchases/p-1/pay"),
      "/login?returnUrl=%2Fpackage-purchases%2Fp-1%2Fpay"
    );
  });

  it("falls back to plain /login for anything unsafe or empty", () => {
    for (const raw of ["", null, undefined, "https://evil.com", "//evil.com", "/\t/evil.com", "javascript:alert(1)"]) {
      assert.equal(loginUrlWithReturn(raw), "/login", JSON.stringify(raw));
    }
  });

  it("round-trips through the login page unchanged", () => {
    for (const path of [
      "/package-purchases/p-1/pay",
      "/odeme/basarili",
      "/odeme/basarisiz",
      "/tutors/t-1/checkout?plan=w3-d30&context=yks&note=a%26b",
      "/messages/c-1",
    ]) {
      assert.equal(readBack(loginUrlWithReturn(path)), path);
    }
  });
});

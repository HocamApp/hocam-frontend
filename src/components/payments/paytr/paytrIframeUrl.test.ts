import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readPayTRIframeUrl } from "./paytrIframeUrl";

const VALID = "https://www.paytr.com/odeme/guvenli/abc123token";

describe("readPayTRIframeUrl", () => {
  it("accepts the hosted payment form the backend returns", () => {
    assert.equal(readPayTRIframeUrl(VALID), VALID);
  });

  it("does not care how the host was capitalised", () => {
    assert.equal(
      readPayTRIframeUrl("https://WWW.PAYTR.COM/odeme/guvenli/abc123token"),
      VALID
    );
  });

  it("refuses anything that is not that exact origin", () => {
    for (const url of [
      "http://www.paytr.com/odeme/guvenli/abc123token",
      "https://paytr.com/odeme/guvenli/abc123token",
      "https://www.paytr.com.attacker.example/odeme/guvenli/abc123token",
      "https://attacker.example/www.paytr.com/odeme/guvenli/abc123token",
      "https://www.paytr.com:8443/odeme/guvenli/abc123token",
      "javascript:alert(1)",
      "//www.paytr.com/odeme/guvenli/abc123token",
    ]) {
      assert.equal(readPayTRIframeUrl(url), null, url);
    }
  });

  it("refuses a URL carrying credentials", () => {
    assert.equal(
      readPayTRIframeUrl("https://user:pass@www.paytr.com/odeme/guvenli/abc123token"),
      null
    );
  });

  it("insists on the secure payment path with a token on it", () => {
    for (const url of [
      "https://www.paytr.com/",
      "https://www.paytr.com/odeme/guvenli/",
      "https://www.paytr.com/odeme/abc123token",
      "https://www.paytr.com/odeme/guvenli",
    ]) {
      assert.equal(readPayTRIframeUrl(url), null, url);
    }
  });

  it("refuses a value that is not a usable string", () => {
    assert.equal(readPayTRIframeUrl(""), null);
    assert.equal(readPayTRIframeUrl(undefined), null);
    assert.equal(readPayTRIframeUrl(null), null);
    assert.equal(readPayTRIframeUrl(42), null);
    assert.equal(readPayTRIframeUrl("not a url"), null);
  });
});

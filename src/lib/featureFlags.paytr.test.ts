import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PAYTR_ENABLED, paytrEnabledFromEnv } from "./featureFlags";

describe("paytrEnabledFromEnv", () => {
  it("opens only on the exact string \"true\"", () => {
    assert.equal(paytrEnabledFromEnv("true"), true);
  });

  it("stays closed when the variable is missing or empty", () => {
    assert.equal(paytrEnabledFromEnv(undefined), false);
    assert.equal(paytrEnabledFromEnv(""), false);
  });

  it("stays closed for near-miss values instead of guessing intent", () => {
    assert.equal(paytrEnabledFromEnv("TRUE"), false);
    assert.equal(paytrEnabledFromEnv("True"), false);
    assert.equal(paytrEnabledFromEnv("1"), false);
    assert.equal(paytrEnabledFromEnv("yes"), false);
    assert.equal(paytrEnabledFromEnv("false"), false);
  });
});

describe("PAYTR_ENABLED", () => {
  it("is off in a build that did not set NEXT_PUBLIC_PAYTR_ENABLED", () => {
    assert.equal(process.env.NEXT_PUBLIC_PAYTR_ENABLED, undefined);
    assert.equal(PAYTR_ENABLED, false);
  });
});

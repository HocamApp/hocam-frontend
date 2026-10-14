import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BRAND_V3_ENABLED, brandV3EnabledFromEnv } from "./featureFlags";

describe("brandV3EnabledFromEnv", () => {
  it("opens only on the exact string \"true\"", () => {
    assert.equal(brandV3EnabledFromEnv("true"), true);
  });

  it("stays closed when the variable is missing, empty or a near miss", () => {
    for (const value of [undefined, "", "TRUE", "True", "1", "yes", "false"]) {
      assert.equal(brandV3EnabledFromEnv(value), false, String(value));
    }
  });
});

describe("BRAND_V3_ENABLED", () => {
  it("is off in a build that did not set NEXT_PUBLIC_BRAND_V3", () => {
    assert.equal(process.env.NEXT_PUBLIC_BRAND_V3, undefined);
    assert.equal(BRAND_V3_ENABLED, false);
  });
});

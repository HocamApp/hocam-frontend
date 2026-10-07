import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HOME_V2_ENABLED, homeV2EnabledFromEnv } from "./featureFlags";

describe("homeV2EnabledFromEnv", () => {
  it("opens only on the exact string \"true\"", () => {
    assert.equal(homeV2EnabledFromEnv("true"), true);
  });

  it("stays closed when the variable is missing, empty or a near miss", () => {
    for (const value of [undefined, "", "TRUE", "True", "1", "yes", "false"]) {
      assert.equal(homeV2EnabledFromEnv(value), false, String(value));
    }
  });
});

describe("HOME_V2_ENABLED", () => {
  it("is off in a build that did not set NEXT_PUBLIC_HOME_V2", () => {
    assert.equal(process.env.NEXT_PUBLIC_HOME_V2, undefined);
    assert.equal(HOME_V2_ENABLED, false);
  });
});

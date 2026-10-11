import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { TOOLS_ENABLED, toolsEnabledFromEnv } from "./featureFlags";

describe("toolsEnabledFromEnv", () => {
  it("opens only on the exact string \"true\"", () => {
    assert.equal(toolsEnabledFromEnv("true"), true);
    for (const value of [undefined, "", "TRUE", "True", "1", "yes", "false"]) {
      assert.equal(toolsEnabledFromEnv(value), false, String(value));
    }
  });
});

describe("TOOLS_ENABLED", () => {
  it("is off in a build that did not set NEXT_PUBLIC_TOOLS_ENABLED", () => {
    assert.equal(process.env.NEXT_PUBLIC_TOOLS_ENABLED, undefined);
    assert.equal(TOOLS_ENABLED, false);
  });
});

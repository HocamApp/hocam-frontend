import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HOME_V2_ENABLED,
  homeV2EnabledFromEnv,
  TUTOR_EARNINGS_PREVIEW_ENABLED,
  tutorEarningsPreviewFromEnv,
} from "./featureFlags";

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

describe("tutorEarningsPreviewFromEnv", () => {
  it("opens only on the exact string \"true\"", () => {
    assert.equal(tutorEarningsPreviewFromEnv("true"), true);
    for (const value of [undefined, "", "TRUE", "1", "false"]) {
      assert.equal(tutorEarningsPreviewFromEnv(value), false, String(value));
    }
  });

  it("is off in a build that did not set NEXT_PUBLIC_TUTOR_EARNINGS_PREVIEW", () => {
    assert.equal(TUTOR_EARNINGS_PREVIEW_ENABLED, false);
  });
});

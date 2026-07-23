import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAllowedPath } from "./TutorActivationGate";

describe("TutorActivationGate.isAllowedPath", () => {
  it("allows exact allowed-prefix routes", () => {
    assert.equal(isAllowedPath("/tutor"), true);
    assert.equal(isAllowedPath("/support"), true);
    assert.equal(isAllowedPath("/profile"), true);
  });

  it("allows nested routes under an allowed prefix", () => {
    assert.equal(isAllowedPath("/tutor/onboarding"), true);
    assert.equal(isAllowedPath("/tutor/tutorial"), true);
    assert.equal(isAllowedPath("/tutor/setup"), true);
    assert.equal(isAllowedPath("/profile/security"), true);
    assert.equal(isAllowedPath("/support/ticket/123"), true);
  });

  it("does NOT allow a route that merely starts with the prefix string", () => {
    // Regression: pathname.startsWith("/tutor") previously let the public
    // marketplace listing through the gate.
    assert.equal(isAllowedPath("/tutors"), false);
    assert.equal(isAllowedPath("/tutors/some-tutor-id"), false);
    assert.equal(isAllowedPath("/tutorabc"), false);
    assert.equal(isAllowedPath("/supportive"), false);
    assert.equal(isAllowedPath("/profiles"), false);
  });

  it("blocks unrelated routes", () => {
    assert.equal(isAllowedPath("/dashboard/tutor"), false);
    assert.equal(isAllowedPath("/messages"), false);
    assert.equal(isAllowedPath("/"), false);
  });
});

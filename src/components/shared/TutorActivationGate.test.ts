import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isAllowedPath,
  shouldRedirectToOnboarding,
  type TutorActivationGateInput,
} from "./TutorActivationGate";

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

describe("TutorActivationGate.shouldRedirectToOnboarding", () => {
  const baseInput: TutorActivationGateInput = {
    isLoading: false,
    isTutor: true,
    isAdmin: false,
    isImpersonating: false,
    tutorialCompleted: false,
    pathname: "/dashboard/tutor",
  };

  it("redirects a tutor who has not completed the tutorial off non-allowed routes", () => {
    assert.equal(shouldRedirectToOnboarding(baseInput), true);
  });

  it("does NOT redirect staff carrying a tutor role (admin ping-pong regression)", () => {
    // Regression: a missing staff exemption here once bounced admins between
    // /admin-control (this gate) and /tutor/onboarding (RouteGuard's admin
    // bounce), flickering the screen until a manual click escaped the loop.
    assert.equal(
      shouldRedirectToOnboarding({
        ...baseInput,
        isAdmin: true,
        pathname: "/admin-control",
      }),
      false
    );
  });

  it("still gates staff while they are impersonating a tutor account", () => {
    assert.equal(
      shouldRedirectToOnboarding({
        ...baseInput,
        isAdmin: true,
        isImpersonating: true,
      }),
      true
    );
  });

  it("does not redirect tutors who completed the tutorial", () => {
    assert.equal(
      shouldRedirectToOnboarding({ ...baseInput, tutorialCompleted: true }),
      false
    );
  });

  it("does not redirect while auth is still loading", () => {
    assert.equal(
      shouldRedirectToOnboarding({ ...baseInput, isLoading: true }),
      false
    );
  });

  it("does not redirect on allowed routes", () => {
    assert.equal(
      shouldRedirectToOnboarding({ ...baseInput, pathname: "/tutor/onboarding" }),
      false
    );
  });

  it("does not redirect non-tutors", () => {
    assert.equal(
      shouldRedirectToOnboarding({ ...baseInput, isTutor: false }),
      false
    );
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { COACHING_SETUP_STEPS } from "@/lib/coachingSetup";
import { CoachingSetupProgress } from "./CoachingSetupProgress";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

describe("CoachingSetupProgress", () => {
  it("shows the approved eight stages and marks the current URL-addressable step", () => {
    render(
      <CoachingSetupProgress
        currentStep="availability"
        unlockedSteps={COACHING_SETUP_STEPS}
      />
    );

    assert.equal(screen.getAllByRole("listitem").length, 8);
    const current = screen.getByRole("link", { name: /Koçluk müsaitliği/ });
    assert.equal(current.getAttribute("aria-current"), "step");
    assert.equal(current.getAttribute("href"), "?step=availability");
    assert.ok(screen.getByRole("link", { name: /Kapasite/ }));
  });

  it("does not expose locked capacity as an interactive link", () => {
    render(
      <CoachingSetupProgress
        currentStep="description"
        unlockedSteps={["frequency", "price", "exams", "description", "availability"]}
      />
    );

    assert.equal(screen.queryByRole("link", { name: /Kapasite/ }), null);
    assert.ok(screen.getByText("Kapasite"));
  });
});

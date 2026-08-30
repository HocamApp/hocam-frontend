import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { getTutorialStep, TUTORIAL_STEPS } from "@/lib/liveLessonTutorialSteps";
import { TutorialCard } from "./TutorialCard";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

after(() => window.close());
afterEach(cleanup);

describe("TutorialCard", () => {
  it("uses a theme-aware paper surface with the Hocam action vocabulary", () => {
    render(
      <TutorialCard
        step={getTutorialStep("camera-mic")}
        stepNumber={2}
        totalSteps={TUTORIAL_STEPS.length}
        rects={[]}
        actionDone={false}
        canGoBack
        onBack={() => undefined}
        onPrimary={() => undefined}
      />,
    );

    const dialog = screen.getByRole("dialog");
    assert.match(dialog.className, /bg-surface/);
    assert.match(dialog.className, /text-ink/);
    assert.doesNotMatch(dialog.className, /bg-ink/);
    assert.match(screen.getByRole("button", { name: "Devam" }).className, /bg-pink/);
    assert.ok(screen.getByText(/Mikrofon düğmesine tıklayıp/i));
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";

import { COACHING_SETUP_STEPS } from "@/lib/coachingSetup";
import { CoachingSetupProgress } from "./CoachingSetupProgress";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });
after(() => window.close());
afterEach(cleanup);

function segmentStates() {
  const bar = screen.getByRole("progressbar");
  return Array.from(bar.querySelectorAll("[data-state]")).map((node) => node.getAttribute("data-state"));
}

describe("CoachingSetupProgress", () => {
  it("draws seven segments: saved steps gold, the current one pink, the rest empty", () => {
    render(
      <CoachingSetupProgress
        currentStep="capacity"
        doneSteps={["frequency", "price", "exams", "description", "availability"]}
        unlockedSteps={COACHING_SETUP_STEPS}
      />
    );

    assert.deepEqual(segmentStates(), ["done", "done", "done", "done", "done", "current", "todo"]);
    const segments = Array.from(screen.getByRole("progressbar").querySelectorAll("[data-state]"));
    assert.match(segments[0].className, /bg-gold/);
    assert.match(segments[5].className, /bg-pink/);
    assert.match(segments[6].className, /bg-line/);
  });

  it("reads progress from saved data, not from position", () => {
    render(
      <CoachingSetupProgress
        currentStep="frequency"
        doneSteps={["frequency", "price", "exams", "description", "availability", "capacity"]}
        unlockedSteps={COACHING_SETUP_STEPS}
      />
    );

    // Editing the first step of a finished setup leaves every other step done.
    assert.deepEqual(segmentStates(), ["current", "done", "done", "done", "done", "done", "todo"]);
  });

  it("names the step and its place in the seven", () => {
    render(
      <CoachingSetupProgress currentStep="exams" doneSteps={["frequency", "price"]} unlockedSteps={COACHING_SETUP_STEPS} />
    );

    assert.ok(screen.getByText("Adım 3 / 7"));
    assert.ok(screen.getByRole("heading", { name: "Koçluk verdiğin sınavlar" }));
    const bar = screen.getByRole("progressbar");
    assert.equal(bar.getAttribute("aria-valuenow"), "3");
    assert.equal(bar.getAttribute("aria-valuemax"), "7");
    assert.equal(bar.getAttribute("aria-valuetext"), "Adım 3 / 7");
  });

  it("offers a chip, with the saved value, only for steps that are done", () => {
    render(
      <CoachingSetupProgress
        currentStep="description"
        doneSteps={["frequency", "price", "exams"]}
        unlockedSteps={COACHING_SETUP_STEPS}
        chipValues={{ frequency: "Haftada bir", price: "600,00 ₺", exams: "YKS, DGS" }}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Koçluk kurulum adımları" });
    const chips = within(nav).getAllByRole("link");
    assert.deepEqual(
      chips.map((chip) => chip.textContent),
      ["Görüşme düzeni · Haftada bir", "Fiyat · 600,00 ₺", "Sınavlar · YKS, DGS"]
    );
    assert.deepEqual(
      chips.map((chip) => chip.getAttribute("href")),
      ["?step=frequency", "?step=price", "?step=exams"]
    );
    // The step in progress and the ones ahead are not links yet.
    assert.equal(within(nav).queryByRole("link", { name: /Açıklama/ }), null);
    assert.equal(within(nav).queryByRole("link", { name: /Kapasite/ }), null);
  });

  it("marks the current step's own chip when it is already saved", () => {
    render(
      <CoachingSetupProgress
        currentStep="price"
        doneSteps={["frequency", "price", "exams"]}
        unlockedSteps={COACHING_SETUP_STEPS}
        chipValues={{ price: "600,00 ₺" }}
      />
    );

    const current = screen.getByRole("link", { name: /Fiyat/ });
    assert.equal(current.getAttribute("aria-current"), "step");
    assert.equal(screen.getByRole("link", { name: /Sınavlar/ }).getAttribute("aria-current"), null);
  });

  it("shows a bare chip for a step with no short value", () => {
    render(
      <CoachingSetupProgress
        currentStep="availability"
        doneSteps={["frequency", "price", "exams", "description"]}
        unlockedSteps={COACHING_SETUP_STEPS}
      />
    );

    assert.equal(screen.getByRole("link", { name: "Açıklama" }).textContent, "Açıklama");
  });

  it("keeps the chip row wrapping so nothing is clipped on a phone", () => {
    render(
      <CoachingSetupProgress
        currentStep="capacity"
        doneSteps={["frequency", "price", "exams", "description", "availability"]}
        unlockedSteps={COACHING_SETUP_STEPS}
      />
    );

    const list = screen.getAllByRole("list")[0];
    assert.match(list.className, /flex-wrap/);
    assert.match(screen.getByRole("navigation", { name: "Koçluk kurulum adımları" }).className, /p-4/);
  });
});

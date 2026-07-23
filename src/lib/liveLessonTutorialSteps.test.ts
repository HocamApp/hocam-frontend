import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";

import {
  TUTORIAL_STEPS,
  TUTORIAL_STEP_IDS,
  allStepsCompleted,
  canNavigateTo,
  markStepCompleted,
  seedFromServer,
} from "./liveLessonTutorialSteps";

describe("tutorial step registry", () => {
  it("has 10 unique ids in registry order", () => {
    assert.equal(TUTORIAL_STEP_IDS.length, 10);
    assert.equal(new Set(TUTORIAL_STEP_IDS).size, 10);
    assert.deepEqual(
      TUTORIAL_STEPS.map((step) => step.id),
      TUTORIAL_STEP_IDS
    );
  });

  it("try steps carry a hint; every step has title, body and CTA", () => {
    for (const step of TUTORIAL_STEPS) {
      assert.ok(step.title.length > 0, step.id);
      assert.ok(step.body.length > 0, step.id);
      assert.ok(step.ctaLabel.length > 0, step.id);
      if (step.kind === "try") {
        assert.ok(step.tryHint && step.tryHint.length > 0, step.id);
      }
    }
  });

  it("every spotlight target exists in the mock lesson screen markup", () => {
    const sources = [
      "src/components/tutorial/MockLessonScreen.tsx",
      "src/components/tutorial/MockJitsiToolbar.tsx",
    ]
      .map((file) => fs.readFileSync(path.resolve(file), "utf-8"))
      .join("\n");
    for (const step of TUTORIAL_STEPS) {
      for (const target of step.targets) {
        assert.ok(
          sources.includes(`data-tutorial-target="${target}"`),
          `missing mock target for ${step.id}: ${target}`
        );
      }
    }
  });

  it("mirrors the backend TUTORIAL_STEP_IDS tuple when the repo is present", () => {
    // Best-effort lockstep check: verifies against the sibling backend
    // checkout when it exists (developer machines / monorepo CI layouts).
    const backendFile = path.resolve(
      "..", "Hocam_backend", "apps", "tutors", "tutorial.py"
    );
    if (!fs.existsSync(backendFile)) return;
    const source = fs.readFileSync(backendFile, "utf-8");
    for (const id of TUTORIAL_STEP_IDS) {
      assert.ok(source.includes(`"${id}"`), `backend missing step id: ${id}`);
    }
  });
});

describe("tutorial progress state", () => {
  it("seeds resume position from current_step", () => {
    const state = seedFromServer(["welcome", "camera-mic"], "chat");
    assert.equal(TUTORIAL_STEP_IDS[state.stepIndex], "chat");
    assert.deepEqual(state.completedSteps, ["welcome", "camera-mic"]);
  });

  it("falls back to first incomplete step when current_step is invalid", () => {
    const state = seedFromServer(["welcome"], "bogus");
    assert.equal(TUTORIAL_STEP_IDS[state.stepIndex], "camera-mic");
  });

  it("drops unknown completed steps from the server payload", () => {
    const state = seedFromServer(["welcome", "bogus"], null);
    assert.deepEqual(state.completedSteps, ["welcome"]);
  });

  it("marks steps monotonically and in canonical order", () => {
    let state = seedFromServer([], null);
    state = markStepCompleted(state, "chat");
    state = markStepCompleted(state, "welcome");
    state = markStepCompleted(state, "chat");
    assert.deepEqual(state.completedSteps, ["welcome", "chat"]);
  });

  it("allows back always, forward only across completed steps", () => {
    const state = {
      stepIndex: 2,
      completedSteps: ["welcome", "camera-mic", "chat"] as const,
    };
    const mutable = { ...state, completedSteps: [...state.completedSteps] };
    assert.equal(canNavigateTo(mutable, 0), true);
    assert.equal(canNavigateTo(mutable, 3), true); // steps 0-2 all complete
    assert.equal(canNavigateTo(mutable, 4), false); // screen-share incomplete
    assert.equal(canNavigateTo(mutable, 99), false);
  });

  it("allStepsCompleted requires every canonical step", () => {
    const partial = seedFromServer(TUTORIAL_STEP_IDS.slice(0, 9), null);
    assert.equal(allStepsCompleted(partial), false);
    const full = seedFromServer([...TUTORIAL_STEP_IDS], null);
    assert.equal(allStepsCompleted(full), true);
  });
});

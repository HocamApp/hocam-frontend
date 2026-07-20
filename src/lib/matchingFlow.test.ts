import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  answersForGoal,
  deriveMatchingSceneState,
  hasAnswerForStep,
  selectAvailabilityWindow,
  toggleLimited,
} from "./matchingFlow";
import type { MatchingAnswers } from "@/types";

const completeAnswers: MatchingAnswers = {
  goal: "YKS",
  stage: "grade_12",
  subject_keys: ["matematik", "fizik"],
  challenges: ["foundations", "speed_accuracy"],
  teaching_styles: ["foundations_patient", "planning_accountability"],
  availability_windows: ["weekday_evening"],
  budget_segment: "balanced",
  schema_version: 1,
};

describe("matching flow state", () => {
  it("enforces limits while still allowing selected values to be removed", () => {
    assert.deepEqual(toggleLimited(["a", "b"], "c", 2), ["a", "b"]);
    assert.deepEqual(toggleLimited(["a", "b"], "a", 2), ["b"]);
  });

  it("makes flexible availability mutually exclusive", () => {
    assert.deepEqual(selectAvailabilityWindow(["weekday_day"], "flexible"), ["flexible"]);
    assert.deepEqual(selectAvailabilityWindow(["flexible"], "weekend_day"), ["weekend_day"]);
    assert.deepEqual(selectAvailabilityWindow(["flexible"], "flexible"), []);
  });

  it("clears dependent answers when the goal changes", () => {
    assert.deepEqual(answersForGoal("DGS"), { goal: "DGS", schema_version: 1 });
  });

  it("validates every one of the seven answer steps", () => {
    for (let step = 0; step < 7; step += 1) {
      assert.equal(hasAnswerForStep(completeAnswers, step), true);
    }
    assert.equal(hasAnswerForStep({ goal: "YKS" }, 1), false);
  });

  it("shows previous stops as committed and the current answer as preview", () => {
    const scene = deriveMatchingSceneState(completeAnswers, 3, {
      stage: "12. sınıf",
      subjects: { matematik: "Matematik", fizik: "Fizik" },
    });

    assert.deepEqual(scene.stops, [
      "committed",
      "committed",
      "committed",
      "preview",
      "empty",
      "empty",
      "empty",
    ]);
    assert.equal(scene.stage, "12. sınıf");
    assert.deepEqual(scene.subjects, ["Matematik", "Fizik"]);
    assert.deepEqual(scene.teachingStyles, []);
  });

  it("reveals the complete scene only for matching and results", () => {
    const scene = deriveMatchingSceneState(completeAnswers, 6, {}, true);
    assert.equal(scene.isComplete, true);
    assert.ok(scene.stops.every((stop) => stop === "committed"));
    assert.equal(scene.budget, "balanced");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COACHING_SETUP_STEPS,
  buildCoachingPlanPayload,
  readCoachingSetupStep,
  unlockedCoachingSetupSteps,
} from "./coachingSetup";

describe("Coaching setup navigation", () => {
  it("uses the approved availability-before-capacity order", () => {
    assert.deepEqual(COACHING_SETUP_STEPS, [
      "frequency",
      "price",
      "exams",
      "description",
      "availability",
      "capacity",
      "preview",
      "publish",
    ]);
  });

  it("falls back to frequency for an unknown URL step", () => {
    assert.equal(readCoachingSetupStep("capacity"), "capacity");
    assert.equal(readCoachingSetupStep("unknown"), "frequency");
    assert.equal(readCoachingSetupStep(null), "frequency");
  });

  it("unlocks all steps for an existing plan and gates capacity on availability for first setup", () => {
    assert.deepEqual(unlockedCoachingSetupSteps({ hasPlan: true, weeklySlotCount: 0 }), COACHING_SETUP_STEPS);
    assert.deepEqual(
      unlockedCoachingSetupSteps({ hasPlan: false, weeklySlotCount: 0 }),
      ["frequency", "price", "exams", "description", "availability"]
    );
    assert.deepEqual(
      unlockedCoachingSetupSteps({ hasPlan: false, weeklySlotCount: 2 }),
      COACHING_SETUP_STEPS
    );
  });
});

describe("buildCoachingPlanPayload", () => {
  it("serializes only YKS, DGS, and KPSS at the write boundary", () => {
    const payload = buildCoachingPlanPayload({
      frequency: "weekly",
      priceMinor: 25000,
      maxActiveStudents: 3,
      examTypes: ["TYT", "YKS", "AYT", "KPSS"],
      description: "  Haftalık plan takibi.  ",
    });

    assert.deepEqual(payload, {
      frequency: "weekly",
      price_per_session_minor: 25000,
      max_active_students: 3,
      target_exam_types: ["YKS", "KPSS"],
      description: "Haftalık plan takibi.",
    });
  });

  it("rejects a payload without a canonical exam", () => {
    assert.throws(
      () =>
        buildCoachingPlanPayload({
          frequency: "weekly",
          priceMinor: 0,
          maxActiveStudents: 1,
          examTypes: ["TYT"],
          description: "",
        }),
      /En az bir sınav/
    );
  });
});

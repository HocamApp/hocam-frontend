import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingPlan } from "./coachingApi";
import {
  COACHING_SETUP_STEPS,
  buildCoachingPlanPayload,
  coachingSetupDoneSteps,
  coachingSetupStepDone,
  coachingSetupStepForError,
  isCoachingSetupComplete,
  readCoachingSetupStep,
  unlockedCoachingSetupSteps,
} from "./coachingSetup";

function savedPlan(overrides: Partial<CoachingPlan> = {}): CoachingPlan {
  return {
    id: "plan-1",
    frequency: "weekly",
    session_duration_minutes: 30,
    price_per_session_minor: 60000,
    price_per_session_display: "600,00 ₺",
    price_cap_minor: 90000,
    max_active_students: 6,
    target_exam_types: ["YKS", "DGS"],
    description: "",
    is_published: false,
    is_accepting_new_students: true,
    published_at: null,
    capacity: null,
    created_at: "2026-10-01T09:00:00Z",
    updated_at: "2026-10-01T09:00:00Z",
    ...overrides,
  };
}

describe("Coaching setup navigation", () => {
  it("uses the approved availability-before-capacity order and one review-and-publish step", () => {
    assert.deepEqual(COACHING_SETUP_STEPS, [
      "frequency",
      "price",
      "exams",
      "description",
      "availability",
      "capacity",
      "publish",
    ]);
  });

  it("sends the retired preview step to the combined review-and-publish step", () => {
    assert.equal(readCoachingSetupStep("preview"), "publish");
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

  it("routes publish validation back to the field the tutor can act on", () => {
    assert.equal(coachingSetupStepForError("availability_required"), "availability");
    assert.equal(coachingSetupStepForError("capacity_exceeds_theoretical"), "capacity");
    assert.equal(coachingSetupStepForError("price_exceeds_cap"), "price");
    assert.equal(coachingSetupStepForError("has_active_students"), "publish");
    assert.equal(coachingSetupStepForError(null), "publish");
  });
});

describe("Coaching setup progress by saved data", () => {
  it("marks nothing done before a plan exists", () => {
    for (const step of COACHING_SETUP_STEPS) {
      assert.equal(coachingSetupStepDone(step, { plan: null, weeklySlotCount: 0 }), false, step);
    }
  });

  it("marks steps from what is saved, not from where the tutor stands", () => {
    const snapshot = { plan: savedPlan(), weeklySlotCount: 0 };
    assert.equal(coachingSetupStepDone("frequency", snapshot), true);
    assert.equal(coachingSetupStepDone("price", snapshot), true);
    assert.equal(coachingSetupStepDone("exams", snapshot), true);
    assert.equal(coachingSetupStepDone("description", snapshot), true);
    assert.equal(coachingSetupStepDone("availability", snapshot), false);
    assert.equal(coachingSetupStepDone("capacity", snapshot), false);
    assert.equal(coachingSetupStepDone("publish", snapshot), false);

    const withHours = { plan: savedPlan(), weeklySlotCount: 12 };
    assert.equal(coachingSetupStepDone("availability", withHours), true);
    assert.equal(coachingSetupStepDone("capacity", withHours), true);
  });

  it("counts a free price and an empty optional description as done", () => {
    const snapshot = { plan: savedPlan({ price_per_session_minor: 0, description: "" }), weeklySlotCount: 2 };
    assert.equal(coachingSetupStepDone("price", snapshot), true);
    assert.equal(coachingSetupStepDone("description", snapshot), true);
  });

  it("does not count exams as done when none is saved", () => {
    assert.equal(
      coachingSetupStepDone("exams", { plan: savedPlan({ target_exam_types: [] }), weeklySlotCount: 2 }),
      false
    );
  });

  it("is publish-done only once the plan is published", () => {
    assert.equal(
      coachingSetupStepDone("publish", { plan: savedPlan({ is_published: true }), weeklySlotCount: 2 }),
      true
    );
  });

  it("calls the setup complete when every step before publishing is saved", () => {
    assert.equal(isCoachingSetupComplete({ plan: null, weeklySlotCount: 0 }), false);
    assert.equal(isCoachingSetupComplete({ plan: savedPlan(), weeklySlotCount: 0 }), false);
    assert.equal(isCoachingSetupComplete({ plan: savedPlan(), weeklySlotCount: 3 }), true);
    assert.equal(
      isCoachingSetupComplete({ plan: savedPlan({ target_exam_types: [] }), weeklySlotCount: 3 }),
      false
    );
    // Publishing is the last step, not a precondition of being set up.
    assert.equal(isCoachingSetupComplete({ plan: savedPlan({ is_published: true }), weeklySlotCount: 3 }), true);
  });

  it("reads a returning tutor's progress from data alone", () => {
    const done = coachingSetupDoneSteps({
      snapshot: { plan: savedPlan(), weeklySlotCount: 0 },
      currentStep: "frequency",
      firstSetup: false,
    });
    assert.deepEqual(done, ["frequency", "price", "exams", "description"]);
  });

  it("lets a first setup count the steps already walked, as long as their data holds", () => {
    assert.deepEqual(
      coachingSetupDoneSteps({
        snapshot: { plan: null, weeklySlotCount: 0 },
        currentStep: "exams",
        firstSetup: true,
      }),
      ["frequency", "price"]
    );
    assert.deepEqual(
      coachingSetupDoneSteps({
        snapshot: { plan: savedPlan(), weeklySlotCount: 0 },
        currentStep: "capacity",
        firstSetup: true,
      }),
      ["frequency", "price", "exams", "description"]
    );
    assert.deepEqual(
      coachingSetupDoneSteps({
        snapshot: { plan: savedPlan(), weeklySlotCount: 4 },
        currentStep: "publish",
        firstSetup: true,
      }),
      ["frequency", "price", "exams", "description", "availability", "capacity"]
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

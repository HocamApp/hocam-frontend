import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingCapacityDetail, CoachingPlan } from "./coachingApi";
import {
  coachingSetupSteps,
  deriveCoachingStatus,
  isCoachingExamGroup,
  type CoachingReadinessState,
} from "./coachingPresentation";

describe("isCoachingExamGroup", () => {
  it("accepts only canonical Coaching exam groups", () => {
    assert.equal(isCoachingExamGroup("YKS"), true);
    assert.equal(isCoachingExamGroup("DGS"), true);
    assert.equal(isCoachingExamGroup("KPSS"), true);
    assert.equal(isCoachingExamGroup("TYT"), false);
    assert.equal(isCoachingExamGroup("AYT"), false);
    assert.equal(isCoachingExamGroup("YDT"), false);
  });
});

describe("deriveCoachingStatus", () => {
  const plan = {
    is_published: true,
    is_accepting_new_students: true,
  } as CoachingPlan;
  const capacity = {
    weekly_slot_count: 4,
    theoretical_capacity: 4,
    max_active_students: 3,
    active_students: 1,
    can_accept_new_student: true,
  } as CoachingCapacityDetail;

  it("keeps a published offer and platform-paused checkout as independent states", () => {
    const status = deriveCoachingStatus({
      onboardingComplete: true,
      plan,
      capacity,
      checkoutEnabled: false,
    });

    assert.equal(status.publication, "published");
    assert.equal(status.intake, "open");
    assert.equal(status.capacity, "available");
    assert.equal(status.platformCheckout, "platform_paused");
    assert.equal(status.readiness, "complete");
    assert.equal(
      status.platformMessage,
      "Teklifin yayında. Yeni koçluk satışları platform genelinde şu anda kapalı."
    );
    assert.equal(status.nextAction, null);
    assert.deepEqual(status.stepsDone, { onboarding: true, plan: true, availability: true, capacity: true, publish: true });
  });

  it("knows which steps are done on their own, not only which one is first missing", () => {
    const status = deriveCoachingStatus({
      onboardingComplete: false,
      plan,
      capacity,
      checkoutEnabled: true,
    });

    assert.equal(status.readiness, "onboarding");
    assert.deepEqual(status.stepsDone, { onboarding: false, plan: true, availability: true, capacity: true, publish: true });
  });

  it("does not call a step done that it cannot see: no plan, no capacity yet", () => {
    const status = deriveCoachingStatus({ onboardingComplete: true, plan: null, capacity: null, checkoutEnabled: true });

    assert.deepEqual(status.stepsDone, { onboarding: true, plan: false, availability: false, capacity: false, publish: false });
  });

  it("routes missing availability to the tutor-fixable setup step", () => {
    const status = deriveCoachingStatus({
      onboardingComplete: true,
      plan: { ...plan, is_published: false },
      capacity: { ...capacity, weekly_slot_count: 0, theoretical_capacity: 0 },
      checkoutEnabled: false,
    });

    assert.equal(status.capacity, "missing_availability");
    assert.equal(status.readiness, "availability");
    assert.equal(status.nextAction?.href, "/dashboard/tutor/coaching/plan?step=availability");
  });
});

describe("coachingSessionStatusLabel", () => {
  it("labels every backend session status in Turkish", async () => {
    const { coachingSessionStatusLabel } = await import("./coachingPresentation");
    for (const status of [
      "scheduled", "reschedule_requested", "in_progress", "awaiting_report", "completed",
      "student_no_show", "tutor_no_show", "cancelled", "technical_failure",
    ]) {
      const label = coachingSessionStatusLabel(status);
      assert.notEqual(label, status);
      assert.doesNotMatch(label, /_/);
    }
  });

  it("never echoes an unknown raw code", async () => {
    const { coachingSessionStatusLabel } = await import("./coachingPresentation");
    assert.equal(coachingSessionStatusLabel("brand_new_state"), "Durum güncelleniyor");
  });
});

describe("coachingRoomUserInfo", () => {
  it("uses the viewer's own name and never the e-mail address", async () => {
    const { coachingRoomUserInfo } = await import("./coachingPresentation");
    const detail = { tutor_name: "Ayşe Kaya", student_name: "Ali Demir" };
    assert.deepEqual(coachingRoomUserInfo(detail, "student"), { displayName: "Ali Demir", email: "" });
    assert.deepEqual(coachingRoomUserInfo(detail, "tutor"), { displayName: "Ayşe Kaya", email: "" });
  });

  it("falls back to the role, not to an address, before the detail loads", async () => {
    const { coachingRoomUserInfo } = await import("./coachingPresentation");
    assert.deepEqual(coachingRoomUserInfo(undefined, "student"), { displayName: "Öğrenci", email: "" });
  });
});

describe("studentCoachingNextStep", () => {
  it("asks to pick a time only while the schedule is actually open", async () => {
    const { studentCoachingNextStep } = await import("./coachingPresentation");
    assert.deepEqual(studentCoachingNextStep("accepted_awaiting_schedule", undefined), { kind: "pick_schedule" });
    for (const status of ["cancelled", "completed", "rejected", "refunded", "paused_by_platform", "accepted_awaiting_payment"]) {
      assert.notEqual(studentCoachingNextStep(status, undefined).kind, "pick_schedule", status);
    }
  });

  it("shows the next meeting while active or winding down", async () => {
    const { studentCoachingNextStep } = await import("./coachingPresentation");
    const sessions = [
      { status: "completed", scheduled_start: "2026-10-01T15:00:00Z" },
      { status: "scheduled", scheduled_start: "2026-10-12T15:00:00Z" },
    ];
    assert.deepEqual(studentCoachingNextStep("active", sessions), { kind: "next_session", startsAt: "2026-10-12T15:00:00Z" });
    assert.deepEqual(studentCoachingNextStep("cancellation_pending", sessions), { kind: "next_session", startsAt: "2026-10-12T15:00:00Z" });
    assert.deepEqual(studentCoachingNextStep("active", []), { kind: "no_upcoming_session" });
  });

  it("never echoes a raw status", async () => {
    const { studentCoachingNextStep } = await import("./coachingPresentation");
    const step = studentCoachingNextStep("something_new", undefined);
    assert.equal(step.kind, "message");
    assert.doesNotMatch(step.kind === "message" ? step.text : "", /_/);
  });
});

describe("coachingSetupSteps", () => {
  const states = (readiness: CoachingReadinessState) =>
    coachingSetupSteps(readiness).map((step) => `${step.key}:${step.state}`);

  it("lists the five parts of getting a coaching offer ready, in order", () => {
    assert.deepEqual(
      coachingSetupSteps("onboarding").map((step) => step.title),
      ["Tanıtım", "Teklif", "Koçluk saatleri", "Kapasite", "Gözden geçir ve yayınla"],
    );
  });

  it("marks what comes before the open step as done and what follows as waiting", () => {
    assert.deepEqual(states("onboarding"), [
      "onboarding:current",
      "plan:pending",
      "availability:pending",
      "capacity:pending",
      "publish:pending",
    ]);
    assert.deepEqual(states("availability"), [
      "onboarding:done",
      "plan:done",
      "availability:current",
      "capacity:pending",
      "publish:pending",
    ]);
    assert.deepEqual(states("publish"), [
      "onboarding:done",
      "plan:done",
      "availability:done",
      "capacity:done",
      "publish:current",
    ]);
  });

  it("has every step done once the setup is complete", () => {
    assert.ok(coachingSetupSteps("complete").every((step) => step.state === "done"));
  });

  it("says in one sentence what the open step asks for, and says it only for that step", () => {
    const [open, ...rest] = coachingSetupSteps("capacity").filter((step) => step.state === "current");
    assert.equal(open.detail, "Saatlerin seçtiğin kapasiteye yetmiyor: saat ekle ya da kapasiteyi düşür.");
    assert.equal(rest.length, 0);
    assert.equal(
      coachingSetupSteps("availability").find((step) => step.state === "current")?.detail,
      "Öğrencilerin seçebileceği haftalık saatleri sen belirlersin.",
    );
  });

  it("shows a later step as done when it is, so a published offer is not made to look unstarted", () => {
    const done = { onboarding: false, plan: true, availability: true, capacity: true, publish: true };
    assert.deepEqual(
      coachingSetupSteps("onboarding", done).map((step) => `${step.key}:${step.state}`),
      ["onboarding:current", "plan:done", "availability:done", "capacity:done", "publish:done"],
    );
    // Without that knowledge the steps after the open one wait.
    assert.equal(coachingSetupSteps("onboarding").filter((step) => step.state === "pending").length, 4);
  });

  it("follows deriveCoachingStatus: the open step is the one its next action opens", () => {
    const status = deriveCoachingStatus({
      onboardingComplete: true,
      plan: { is_published: false, is_accepting_new_students: true } as CoachingPlan,
      capacity: { weekly_slot_count: 0, theoretical_capacity: 0 } as CoachingCapacityDetail,
      checkoutEnabled: true,
    });

    assert.equal(coachingSetupSteps(status.readiness).find((step) => step.state === "current")?.key, "availability");
    assert.match(status.nextAction?.href ?? "", /step=availability$/);
  });
});

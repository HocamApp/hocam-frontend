import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  AcceptanceRequest,
  CoachingCapacityDetail,
  CoachingPlan,
  CoachingSessionItem,
  CoachingStudentRow,
} from "./coachingApi";
import {
  deriveCoachingMetrics,
  deriveCoachingStatus,
  isCoachingExamGroup,
  partitionAcceptanceRequests,
} from "./coachingPresentation";

function request(id: string, includesCoaching: boolean, status: AcceptanceRequest["status"] = "pending") {
  return { id, includes_coaching: includesCoaching, status } as AcceptanceRequest;
}

describe("partitionAcceptanceRequests", () => {
  it("keeps Coaching bundles and lesson-only requests mutually exclusive", () => {
    const result = partitionAcceptanceRequests([
      request("coaching-pending", true),
      request("coaching-accepted", true, "accepted"),
      request("lesson-only", false),
    ]);

    assert.deepEqual(result.coaching.map(({ id }) => id), ["coaching-pending", "coaching-accepted"]);
    assert.deepEqual(result.lessonOnly.map(({ id }) => id), ["lesson-only"]);
    assert.deepEqual(
      result.coaching.filter((left) => result.lessonOnly.some((right) => right.id === left.id)),
      []
    );
  });
});

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

describe("deriveCoachingMetrics", () => {
  it("counts active students, upcoming meetings, reports, and pending Coaching requests", () => {
    const students = [
      { service_status: "active" },
      { service_status: "active" },
      { service_status: "cancelled" },
    ] as CoachingStudentRow[];
    const sessions = [
      { status: "scheduled" },
      { status: "reschedule_requested" },
      { status: "awaiting_report" },
    ] as CoachingSessionItem[];
    const requests = [
      request("coaching", true),
      request("accepted-coaching", true, "accepted"),
      request("lesson", false),
    ];

    assert.deepEqual(deriveCoachingMetrics({ students, sessions, requests }), {
      activeStudents: 2,
      upcomingSessions: 2,
      pendingReports: 1,
      pendingRequests: 1,
    });
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

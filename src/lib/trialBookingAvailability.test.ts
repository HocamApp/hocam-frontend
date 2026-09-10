import assert from "node:assert/strict";
import test from "node:test";

import type { TutorProfile } from "@/types";
import {
  prepareTrialBooking,
  resolveTrialBookingAvailability,
  trialBookingUnavailableCopy,
} from "./trialBookingAvailability";

const eligibleTutor = {
  id: "tutor-1",
  user: "tutor-user-1",
  accepts_trial_lessons: true,
  accepting_new_students: true,
  open_student_slots: 2,
  is_bookable: true,
  trial_lesson_eligible: true,
  trial_lessons_remaining: 2,
} as TutorProfile;

const student = {
  isAuthenticated: true,
  isStudent: true,
  userId: "student-1",
};

test("allows an authenticated student only when the personalized detail verdict is eligible", () => {
  assert.equal(resolveTrialBookingAvailability(eligibleTutor, student), "eligible");
});

test("reports each real backend blocking reason instead of opening the calendar", () => {
  const cases: Array<[Partial<TutorProfile>, string]> = [
    [{ trial_lessons_remaining: 0, trial_lesson_eligible: false }, "monthly_quota"],
    [{ accepts_trial_lessons: false, trial_lesson_eligible: false }, "tutor_not_accepting_trials"],
    [{ accepting_new_students: false, is_bookable: false, trial_lesson_eligible: false }, "tutor_capacity_full"],
    [{ open_student_slots: 0, is_bookable: false, trial_lesson_eligible: false }, "tutor_capacity_full"],
    [{ is_bookable: false, trial_lesson_eligible: false }, "no_available_time"],
    [{ trial_lesson_eligible: false }, "already_used_with_tutor"],
  ];

  for (const [overrides, expected] of cases) {
    assert.equal(
      resolveTrialBookingAvailability({ ...eligibleTutor, ...overrides }, student),
      expected,
    );
  }
});

test("asks signed-out visitors to sign in before any tutor-specific verdict", () => {
  assert.equal(
    resolveTrialBookingAvailability(eligibleTutor, {
      isAuthenticated: false,
      isStudent: false,
      userId: null,
    }),
    "sign_in_required",
  );
});

test("provides specific Turkish guidance for every unavailable state", () => {
  for (const reason of [
    "monthly_quota",
    "already_used_with_tutor",
    "tutor_not_accepting_trials",
    "tutor_capacity_full",
    "no_available_time",
    "sign_in_required",
    "student_account_required",
    "own_profile",
    "unavailable",
  ] as const) {
    const copy = trialBookingUnavailableCopy(reason);
    assert.ok(copy.title.length > 0);
    assert.ok(copy.description.length > 0);
  }
});

test("loads fresh personalized tutor detail before allowing the calendar to open", async () => {
  const requestedIds: string[] = [];
  const result = await prepareTrialBooking("tutor-1", student, async (id) => {
    requestedIds.push(id);
    return eligibleTutor;
  });

  assert.deepEqual(requestedIds, ["tutor-1"]);
  assert.deepEqual(result, { status: "eligible", tutor: eligibleTutor });
});

test("does not call the personalized endpoint before a visitor signs in", async () => {
  let requests = 0;
  const result = await prepareTrialBooking(
    "tutor-1",
    { isAuthenticated: false, isStudent: false, userId: null },
    async () => {
      requests += 1;
      return eligibleTutor;
    },
  );

  assert.equal(requests, 0);
  assert.deepEqual(result, { status: "unavailable", reason: "sign_in_required" });
});

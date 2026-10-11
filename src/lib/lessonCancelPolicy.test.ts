import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  EMERGENCY_REASON_MIN_LENGTH,
  TUTOR_CANCEL_LOCK_MS,
  emergencyReasonProblem,
  tutorCancelMode,
} from "@/lib/lessonCancelPolicy";

const HOUR = 60 * 60 * 1000;

test("the lock window matches the backend's 12 hours", () => {
  assert.equal(TUTOR_CANCEL_LOCK_MS, 12 * HOUR);
});

test("a confirmed lesson with notice can be cancelled, after a confirmation", () => {
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: 2 * 24 * HOUR }), "confirm");
  // Exactly 12 hours out is still open (the server only locks strictly inside).
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: 12 * HOUR }), "confirm");
});

test("a confirmed lesson inside 12 hours offers only the emergency request", () => {
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: 12 * HOUR - 1 }), "emergency");
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: 5 * 60 * 1000 }), "emergency");
});

test("declining a pending request is never locked", () => {
  assert.equal(tutorCancelMode({ status: "pending", msUntilStart: 60 * 1000 }), "decline");
  assert.equal(tutorCancelMode({ status: "pending", msUntilStart: 3 * 24 * HOUR }), "decline");
});

test("nothing is offered once the lesson started or is over", () => {
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: 0 }), "none");
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: -1000 }), "none");
  assert.equal(tutorCancelMode({ status: "confirmed", msUntilStart: Number.NaN }), "none");
  assert.equal(tutorCancelMode({ status: "completed", msUntilStart: 5 * HOUR }), "none");
  assert.equal(tutorCancelMode({ status: "cancelled", msUntilStart: 5 * HOUR }), "none");
  assert.equal(tutorCancelMode({ status: "in_progress", msUntilStart: 5 * HOUR }), "none");
});

test("the emergency reason must say something, and not too much", () => {
  assert.equal(EMERGENCY_REASON_MIN_LENGTH, 10);
  assert.ok(emergencyReasonProblem("acil"));
  assert.ok(emergencyReasonProblem("          "));
  assert.equal(emergencyReasonProblem("Hastaneye gitmem gerekiyor."), null);
  assert.ok(emergencyReasonProblem("x".repeat(2001)));
  assert.equal(emergencyReasonProblem("x".repeat(2000)), null);
});

// The backend is a sibling checkout, not a dependency: when it is absent (CI
// for this repo) the check skips rather than fails, like cancellationPolicy.test.
const POLICY = path.join(process.cwd(), "..", "Hocam_backend", "apps/lessons/policy.py");

test(
  "the lock window mirrors the backend policy default",
  { skip: !fs.existsSync(POLICY) && "backend policy.py not checked out" },
  () => {
    const match = fs.readFileSync(POLICY, "utf8").match(/"TUTOR_CANCEL_LOCK_HOURS", (\d+)/);
    assert.ok(match, "TUTOR_CANCEL_LOCK_HOURS default not found in policy.py");
    assert.equal(Number(match[1]) * HOUR, TUTOR_CANCEL_LOCK_MS);
  },
);

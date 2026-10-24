import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { EXTENSION_CAPS, extensionCapDays, formatTlAmount, POLICY_FACTS } from "./policyFacts";

/**
 * Pins every number the legal pages and the marketing copy quote to the
 * backend rule it mirrors. Change a rule there and the matching line here
 * fails until policyFacts.ts, and so every sentence built from it, is looked at.
 *
 * The backend is a sibling checkout, not a dependency. When it is absent the
 * mirror suite is skipped, as the other legal mirror tests are.
 */

const BACKEND = path.join(process.cwd(), "..", "Hocam_backend");
const backendAvailable = fs.existsSync(BACKEND);
const read = (rel: string) => fs.readFileSync(path.join(BACKEND, rel), "utf8");

function number(src: string, pattern: RegExp): number {
  const match = src.match(pattern);
  assert.ok(match, `constant not found: ${pattern}`);
  return Number(match[1]);
}

describe("policy facts mirror the backend", { skip: !backendAvailable && "Hocam_backend not checked out" }, () => {
  const settings = () => read("config/settings.py");
  const lessonServices = () => read("apps/lessons/services.py");
  const lessonModels = () => read("apps/lessons/models.py");
  const lessonPolicy = () => read("apps/lessons/policy.py");

  it("lessons: cancellation, lock, notice, attendance", () => {
    assert.equal(number(lessonServices(), /CANCELLATION_FREE_WINDOW = timedelta\(hours=(\d+)\)/), POLICY_FACTS.freeCancelHours);
    assert.equal(number(lessonPolicy(), /"TUTOR_CANCEL_LOCK_HOURS", (\d+)\)/), POLICY_FACTS.tutorCancelLockHours);
    assert.equal(number(lessonPolicy(), /"LESSON_MIN_NOTICE_HOURS", (\d+)\)/), POLICY_FACTS.firstLessonNoticeHours);
    assert.equal(number(lessonServices(), /NO_SHOW_GRACE_PERIOD = timedelta\(minutes=(\d+)\)/), POLICY_FACTS.noShowGraceMinutes);
    assert.equal(number(lessonServices(), /STUDENT_ABSENCE_DISPUTE_WINDOW = timedelta\(hours=(\d+)\)/), POLICY_FACTS.absenceDisputeHours);
    assert.equal(number(lessonServices(), /NO_SHOW_AUTO_HIDE_THRESHOLD = (\d+)/), POLICY_FACTS.noShowHideThreshold);
    assert.equal(number(lessonModels(), /AUTO_CONFIRM_HOURS = (\d+)/), POLICY_FACTS.autoConfirmHours);
    assert.equal(number(lessonModels(), /REVIEW_WINDOW_DAYS = (\d+)/), POLICY_FACTS.reviewWindowDays);
  });

  it("checkout: hold, payment page, retry, attempts", () => {
    assert.equal(number(settings(), /PACKAGE_HOLD_MINUTES = config\('PACKAGE_HOLD_MINUTES', default=(\d+)/), POLICY_FACTS.holdMinutes);
    assert.equal(number(settings(), /PAYTR_TIMEOUT_MINUTES = config\('PAYTR_TIMEOUT_MINUTES', default=(\d+)/), POLICY_FACTS.paymentPageMinutes);
    assert.equal(
      number(settings(), /PAYTR_FAILED_RETRY_HOLD_MINUTES = config\('PAYTR_FAILED_RETRY_HOLD_MINUTES', default=(\d+)/),
      POLICY_FACTS.failedRetryHoldMinutes,
    );
    assert.equal(number(settings(), /PAYTR_MAX_ATTEMPTS = config\('PAYTR_MAX_ATTEMPTS', default=(\d+)/), POLICY_FACTS.maxPaymentAttempts);
  });

  it("refunds: near window, settle days, second approval", () => {
    assert.equal(number(settings(), /REFUND_NEAR_LESSON_HOURS = config\('REFUND_NEAR_LESSON_HOURS', default=(\d+)/), POLICY_FACTS.refundNearLessonHours);
    assert.equal(number(settings(), /REFUND_SLA_DAYS = config\('REFUND_SLA_DAYS', default=(\d+)/), POLICY_FACTS.refundSettleDays);
    assert.equal(
      number(settings(), /'REFUND_SECOND_APPROVAL_THRESHOLD_TL', default=(\d+)/),
      POLICY_FACTS.refundSecondApprovalTl,
    );
  });

  it("term extension: the cap and its maximum", () => {
    const extensions = read("apps/payments/extensions.py");
    assert.equal(number(extensions, /MAX_EXTENSION_DAYS = (\d+)/), POLICY_FACTS.maxExtensionDays);
    assert.match(extensions, /min\(\(plan\.duration_days or 0\) \/\/ 2, MAX_EXTENSION_DAYS\)/);
  });

  it("coaching: meeting length, tutor absence, late extension, time together", () => {
    const scheduling = read("apps/coaching/scheduling.py");
    const lifecycle = read("apps/coaching/session_lifecycle.py");
    const lateTutor = read("apps/coaching/late_tutor.py");
    const attendance = read("apps/coaching/attendance.py");
    const sessionMinutes = number(scheduling, /^SESSION_DURATION_MINUTES = (\d+)/m);
    assert.equal(sessionMinutes, POLICY_FACTS.coachingSessionMinutes);
    assert.equal(number(lifecycle, /^TUTOR_ABSENT_AFTER = timedelta\(minutes=(\d+)\)/m), POLICY_FACTS.coachingTutorAbsentMinutes);
    assert.equal(
      number(lateTutor, /^LATE_TUTOR_MAX_EXTENSION = timedelta\(minutes=(\d+)\)/m),
      POLICY_FACTS.coachingLateExtensionMaxMinutes,
    );
    // A meeting is held once the two were together for this share of its length.
    const ratio = number(attendance, /^MEETING_HELD_RATIO = ([\d.]+)/m);
    assert.equal(ratio * sessionMinutes, POLICY_FACTS.coachingMeetingHeldMinutes);
  });

  it("coaching: scheduling deadline, proposal window, complaint windows, reply time", () => {
    const models = read("apps/coaching/models.py");
    const disputes = read("apps/coaching/phase8_disputes.py");
    assert.equal(number(models, /slot_selection_deadline_days = models\.PositiveSmallIntegerField\(default=(\d+)\)/), POLICY_FACTS.coachingScheduleDeadlineDays);
    assert.equal(number(models, /new_time_request_hours = models\.PositiveSmallIntegerField\(default=(\d+)\)/), POLICY_FACTS.coachingTimeRequestHours);
    assert.equal(number(disputes, /_SESSION_ISSUE_WINDOW = timedelta\(hours=(\d+)\)/), POLICY_FACTS.coachingComplaintSessionHours);
    assert.equal(number(disputes, /_MESSAGE_SLA_WINDOW = timedelta\(days=(\d+)\)/), POLICY_FACTS.coachingComplaintDays);
    assert.equal(number(disputes, /_PERIOD_DEFICIENCY_WINDOW = timedelta\(days=(\d+)\)/), POLICY_FACTS.coachingComplaintDays);
    assert.equal(
      number(read("apps/coaching/contract.py"), /en geç (\d+) saat içinde yanıt verilir/),
      POLICY_FACTS.coachingMessageReplyHours,
    );
  });

  it("the checkout summary states the same withdrawal period", () => {
    assert.equal(number(read("apps/payments/policy_copy.py"), /WITHDRAWAL_DAYS = (\d+)/), POLICY_FACTS.withdrawalDays);
  });
});

describe("policy facts helpers", () => {
  it("caps a term extension at half the plan and the maximum", () => {
    assert.deepEqual(
      EXTENSION_CAPS.map((cap) => [cap.planDays, cap.capDays]),
      [
        [14, 7],
        [30, 15],
        [90, 45],
        [180, 60],
      ],
    );
    assert.equal(extensionCapDays(365), POLICY_FACTS.maxExtensionDays);
  });

  it("writes an amount the way the product does", () => {
    assert.equal(formatTlAmount(5000), "5.000 TL");
  });
});

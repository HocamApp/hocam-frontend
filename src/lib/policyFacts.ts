/**
 * The numbers the legal pages and the marketing copy quote about packages.
 *
 * One list, so a page never retypes a number. Every value mirrors a rule the
 * backend enforces (the file named beside it); `policyFacts.test.ts` reads that
 * source and fails when the two disagree, so changing a rule in the backend
 * forces this list, and through it every sentence below, to be revisited.
 *
 * The exceptions are marked `statute`: they come from a regulation, not from a
 * setting, and change only when the regulation does.
 */

import { PLAN_DURATION_DAYS } from "@/lib/lessonPricing";

export const POLICY_FACTS = {
  /** apps/lessons/services.py CANCELLATION_FREE_WINDOW: the student cancels free this long before the start. */
  freeCancelHours: 12,
  /** apps/lessons/policy.py TUTOR_CANCEL_LOCK_HOURS: inside this window a tutor cannot cancel a confirmed lesson. */
  tutorCancelLockHours: 12,
  /** apps/lessons/policy.py LESSON_MIN_NOTICE_HOURS: the first lesson starts at least this long after payment. */
  firstLessonNoticeHours: 24,
  /** config/settings.py PACKAGE_HOLD_MINUTES: how long chosen hours are held for a purchase. */
  holdMinutes: 40,
  /** config/settings.py PAYTR_TIMEOUT_MINUTES: the longest the payment page stays open. */
  paymentPageMinutes: 20,
  /** config/settings.py PAYTR_FAILED_RETRY_HOLD_MINUTES: hours stay held this long after a failed try. */
  failedRetryHoldMinutes: 10,
  /** config/settings.py PAYTR_MAX_ATTEMPTS: tries one purchase gets. */
  maxPaymentAttempts: 3,
  /** apps/lessons/services.py NO_SHOW_GRACE_PERIOD, in minutes. */
  noShowGraceMinutes: 15,
  /** apps/lessons/services.py STUDENT_ABSENCE_DISPUTE_WINDOW, in hours. */
  absenceDisputeHours: 24,
  /** apps/lessons/models.py AUTO_CONFIRM_HOURS. */
  autoConfirmHours: 24,
  /** apps/lessons/models.py Booking.REVIEW_WINDOW_DAYS. */
  reviewWindowDays: 3,
  /** apps/lessons/services.py NO_SHOW_AUTO_HIDE_THRESHOLD. */
  noShowHideThreshold: 3,
  /** config/settings.py REFUND_NEAR_LESSON_HOURS: a lesson this close to a refund request counts as used. */
  refundNearLessonHours: 12,
  /** config/settings.py REFUND_SLA_DAYS: the time a refund request has to be settled in. */
  refundSettleDays: 14,
  /** config/settings.py REFUND_SECOND_APPROVAL_THRESHOLD_TL: refunds from this amount need two staff members. */
  refundSecondApprovalTl: 5000,
  /** apps/payments/extensions.py MAX_EXTENSION_DAYS: the most a term is ever extended. */
  maxExtensionDays: 60,
  /** statute: Mesafeli Sözleşmeler Yönetmeliği m.9(1), 6502 m.48(4). */
  withdrawalDays: 14,
  /** apps/coaching/scheduling.py SESSION_DURATION_MINUTES: every coaching meeting is this long. */
  coachingSessionMinutes: 30,
  /** apps/coaching/session_lifecycle.py TUTOR_ABSENT_AFTER: a tutor not in the room by then is absent. */
  coachingTutorAbsentMinutes: 15,
  /** apps/coaching/late_tutor.py LATE_TUTOR_MAX_EXTENSION: the most a late tutor lengthens a meeting. */
  coachingLateExtensionMaxMinutes: 15,
  /** apps/coaching/attendance.py MEETING_HELD_RATIO (0.5) of the meeting length: time together that counts as held. */
  coachingMeetingHeldMinutes: 15,
} as const;

/**
 * apps/payments/extensions.py extension_cap_days: half the plan's term, never
 * more than the maximum. 14 days: 7, 30: 15, 90: 45, 180: 60.
 */
export function extensionCapDays(planDays: number): number {
  return Math.min(Math.floor(planDays / 2), POLICY_FACTS.maxExtensionDays);
}

/** The cap for each plan the catalog sells, shortest plan first. */
export const EXTENSION_CAPS = PLAN_DURATION_DAYS.map((days) => ({
  planDays: days,
  capDays: extensionCapDays(days),
}));

/** 5000 -> "5.000 TL", the way the rest of the product writes an amount. */
export function formatTlAmount(amount: number): string {
  return `${amount.toLocaleString("tr-TR")} TL`;
}

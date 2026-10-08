/**
 * Product facts the homepage states out loud.
 *
 * Every value here mirrors a constant the backend actually enforces. They live
 * in one place so the FAQ and the entry promo cannot drift apart, and so that
 * when a rule changes there is a single line to correct rather than a hunt
 * through prose.
 *
 * Copy interpolates these rather than retyping them: the homepage copy in
 * ysHomeCopy.ts, the FAQ, the entry promo and a few public pages.
 */

import {
  formatPlanDuration,
  PLAN_DURATION_DAYS,
  WEEKLY_LESSON_OPTIONS,
} from "@/lib/lessonPricing";

/** apps/lessons/pricing.py TRIAL_DURATION_MINUTES (also BookingModal.tsx). */
export const TRIAL_MINUTES = 20;

/**
 * How long tutor sign-up takes, as the homepage mockup states it. An estimate,
 * not something the code enforces; correct it if it stops being true.
 */
export const TUTOR_SIGNUP_MINUTES = 5;

/** apps/lessons/models.py MONTHLY_TRIAL_LIMIT — per student, per calendar month. */
export const MONTHLY_TRIAL_LIMIT = 3;

/** apps/lessons/pricing.py LESSON_BASE_MINUTES. The profile price is for this. */
export const LESSON_MINUTES = 40;

/**
 * Highest package discount the catalog can produce: 6 lessons/week over 180
 * days. Derived from `duration_component + (lessons_per_week - 1)` in
 * apps/payments/migrations/0019. A tutor's own override is capped lower (20%),
 * so this stays a valid upper bound in every configuration.
 */
export const MAX_PACKAGE_DISCOUNT_PERCENT = 30;

/** apps/lessons/services.py CANCELLATION_FREE_WINDOW — 12 hours. */
export const CANCELLATION_FREE_HOURS = 12;

/**
 * The highest YKS rank a tutor can register with, formatted the Turkish way
 * (period as the thousands separator).
 *
 * Enforced, not aspirational: `app/(main)/tutor/setup/page.tsx` rejects
 * anything outside 1 to 15000 with "Sıralama 1-15000 arasında olmalıdır", and
 * the input carries the same max. That is what makes "ilk 15.000" a statement
 * about the product rather than a claim about it.
 */
export const MAX_TUTOR_YKS_RANK = "15.000";

/** The weekly-lesson axis of the package matrix, lessonPricing.ts WEEKLY_LESSON_OPTIONS. */
export const LESSONS_PER_WEEK = {
  min: Math.min(...WEEKLY_LESSON_OPTIONS),
  max: Math.max(...WEEKLY_LESSON_OPTIONS),
} as const;

/**
 * The package durations, lessonPricing.ts PLAN_DURATION_DAYS, each with the
 * label checkout prints for it (formatPlanDuration).
 */
export const PLAN_DURATIONS = PLAN_DURATION_DAYS.map((days) => ({
  days,
  label: formatPlanDuration(days),
}));

/**
 * apps/lessons/models.py AUTO_CONFIRM_HOURS. After a lesson the student
 * confirms it, or it confirms itself once this many hours pass without a
 * dispute. Already quoted by /iptal-ve-iade and LessonConfirmDisputeCard.
 */
export const AUTO_CONFIRM_HOURS = 24;

/**
 * Verification document retention, as /kvkk/hoca-dogrulama publishes it ("Ne
 * kadar saklanır?"): raw documents and safe previews are deleted within this
 * many days of approval...
 */
export const VERIFICATION_DOCS_DELETE_DAYS_AFTER_APPROVAL = 7;
/** ...and rejected or pending applications keep documents at most this long. */
export const VERIFICATION_DOCS_MAX_RETENTION_DAYS = 30;

/**
 * Single paid lessons are retired: the only paid model is the weekly-lessons ×
 * duration package (docs/current-product-and-technical-state.md).
 */
export const SINGLE_LESSON_AVAILABLE = false;

/* ------------------------------------------------------------------------ *
 * Undecided facts.
 *
 * Everything below is a sentence or number the owners have not settled yet.
 * Each one is `TODO` until it is, and `scripts/check-home-facts.ts` fails the
 * production build while any are left, so a placeholder cannot ship by
 * accident. Policy answers (no-show, cancellation details) come from
 * DERS_POLITIKALARI_RAPORU.md, payment timing waits for the payment provider:
 * none of them are to be filled in from guesswork.
 *
 * Render them through `YsFact`, which shows `[label]` in development and
 * nothing in production.
 * ------------------------------------------------------------------------ */

export const TODO: unique symbol = Symbol("TODO");
export type Todo = typeof TODO;
/** A fact that may still be undecided. */
export type Fact<T> = T | Todo;

export function isTodo(value: unknown): value is Todo {
  return value === TODO;
}

/** Lowest and highest profile price, per 40-minute lesson. */
export const PRICE_RANGE_TL: Fact<{ min: number; max: number }> = TODO;
/**
 * Platform commission on a tutor's price. Founder decision, 8 October 2026
 * (was 15%). Mirrors apps/tutors/price_insights.py
 * TUTOR_ESTIMATED_COMMISSION_BPS = 1750 and /kullanim-kosullari §10.
 * Render it with formatPercent so it reads "17,5", not "17.5".
 */
export const COMMISSION_PERCENT: Fact<number> = 17.5;
/** When the student's card is actually charged. Waits for the payment provider. */
export const PAYMENT_CHARGED_WHEN: Fact<string> = TODO;
/** When and how a tutor is paid. Never IBAN, never a promise before payouts are live. */
export const TUTOR_PAYOUT_TEXT: Fact<string> = TODO;
/** Whether a tutor is paid for a free trial lesson. */
export const TRIAL_PAID_TO_TUTOR: Fact<string> = TODO;
/** What happens when the tutor does not show up. DERS_POLITIKALARI_RAPORU.md. */
export const TUTOR_NO_SHOW_TEXT: Fact<string> = TODO;
/** What happens to the remaining lessons when a student switches tutor. */
export const REMAINING_ON_SWITCH_TEXT: Fact<string> = TODO;
/** Whether a tutor has to accept every lesson request. */
export const TUTOR_MUST_ACCEPT_TEXT: Fact<string> = TODO;
/** What happens when the student does not show up. DERS_POLITIKALARI_RAPORU.md. */
export const STUDENT_NO_SHOW_TEXT: Fact<string> = TODO;
/** Minimum weekly hours a tutor commits to. */
export const TUTOR_MIN_WEEKLY_HOURS: Fact<number> = TODO;
/** What happens when a verification application is rejected (can they reapply?). */
export const VERIFICATION_REJECTION_TEXT: Fact<string> = TODO;
/** Days until a verification application is decided. */
export const VERIFICATION_REVIEW_DAYS: Fact<number> = TODO;
/** How long after the review the verification documents are deleted, e.g. "30 gün". Must match /kvkk. */
export const VERIFICATION_DOCS_DELETED_AFTER: Fact<string> = TODO;
/** Whether lessons are recorded, and who can see a recording. */
export const RECORDING_POLICY_TEXT: Fact<string> = TODO;
/** Whether a parent can join or watch a lesson. */
export const PARENT_CAN_JOIN_TEXT: Fact<string> = TODO;
/** Whether a parent can pay on the student's behalf. */
export const PARENT_CAN_PAY_TEXT: Fact<string> = TODO;
/** How and how fast support answers. */
export const SUPPORT_REPLY_TEXT: Fact<string> = TODO;
/** The rule on moving lessons or payments off the platform. */
export const OFF_PLATFORM_TEXT: Fact<string> = TODO;
/** Tax obligations for tutors. */
export const TAX_TEXT: Fact<string> = TODO;
/** Who can become a coaching (koçluk) tutor. */
export const COACHING_TUTOR_TEXT: Fact<string> = TODO;
/** The company's registered legal name, for the footer. */
export const COMPANY_LEGAL_NAME: Fact<string> = TODO;
/** The company's registered address, for the footer. */
export const COMPANY_ADDRESS: Fact<string> = TODO;
/** The company's MERSİS number, for the footer. */
export const COMPANY_MERSIS: Fact<string> = TODO;

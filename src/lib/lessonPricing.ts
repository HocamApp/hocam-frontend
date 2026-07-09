/**
 * Client-side mirror of the backend package pricing rules
 * (apps/payments/pricing.py + the matrix plans seeded in
 * apps/payments/migrations/0010_seed_matrix_plans.py).
 *
 * Used only for live display on the checkout screen — the server recomputes
 * and stores every amount at purchase time and stays the source of truth.
 * Lesson counts and discount percentages always come from the plan catalog
 * API (never hardcoded here); this module only mirrors the arithmetic.
 * Promo-code discounts are intentionally NOT simulated here (no preview
 * endpoint exists); they apply server-side when the purchase is created.
 */

export const LESSON_BASE_MINUTES = 40;

/** The weekly-lesson axis of the purchase matrix (chips on checkout). */
export const WEEKLY_LESSON_OPTIONS = [1, 2, 3, 4, 5] as const;
export type WeeklyLessonOption = (typeof WEEKLY_LESSON_OPTIONS)[number];

/** Canonical duration axis, used for ordering and the "En popüler" pick.
 * The actually purchasable durations come from the plan catalog API. */
export const PLAN_DURATION_DAYS = [14, 30, 90, 180] as const;
export const MOST_POPULAR_DURATION_DAYS = 90;

/** Human label for a plan duration: month multiples read as months, the
 * rest as weeks (matches the fixed backend week mapping, 30 days = 1 ay). */
export function formatPlanDuration(durationDays: number): string {
  if (durationDays % 30 === 0) return `${durationDays / 30} Ay`;
  return `${Math.max(1, Math.round(durationDays / 7))} Hafta`;
}

export interface PackagePricing {
  lessonCount: number;
  discountPercent: number;
  /** Tutor's undiscounted 40-minute lesson price. */
  basePerLesson: number;
  /** Per-lesson price after the plan discount (= backend unit_price). */
  discountedPerLesson: number;
  subtotal: number;
  discountAmount: number;
  total: number;
}

// Python's round() is banker's rounding (half-to-even); JS Math.round is
// half-up. Exact-.5 cases are reachable (e.g. unit price on an 8-lesson
// plan), and the displayed amount must equal what the server will charge.
function roundHalfToEven(x: number): number {
  const floor = Math.floor(x);
  const diff = x - floor;
  if (diff > 0.5) return floor + 1;
  if (diff < 0.5) return floor;
  return floor % 2 === 0 ? floor : floor + 1;
}

/** Field-for-field mirror of backend calculate_package_pricing(). */
export function calculatePackagePricing(
  basePrice: number,
  lessonCount: number,
  discountPercent: number
): PackagePricing {
  const subtotal = basePrice * lessonCount;
  const discountAmount = roundHalfToEven((subtotal * discountPercent) / 100);
  const total = subtotal - discountAmount;
  return {
    lessonCount,
    discountPercent,
    basePerLesson: basePrice,
    discountedPerLesson: roundHalfToEven(total / lessonCount),
    subtotal,
    discountAmount,
    total,
  };
}

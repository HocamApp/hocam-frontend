/**
 * Client-side mirror of the backend package pricing rules
 * (apps/payments/pricing.py + the plans seeded in
 * apps/payments/migrations/0006_seed_weekly_plans.py).
 *
 * Used only for live display on the checkout screen — the server recomputes
 * and stores every amount at purchase time and stays the source of truth.
 * Promo-code discounts are intentionally NOT simulated here (no preview
 * endpoint exists); they apply server-side when the purchase is created.
 */

export const LESSON_BASE_MINUTES = 40;

export const TEN_PACK_LESSON_COUNT = 10;
export const TEN_PACK_DISCOUNT_PERCENT = 10;

export const WEEKLY_LESSON_OPTIONS = [2, 3, 4, 5] as const;
export type WeeklyLessonOption = (typeof WEEKLY_LESSON_OPTIONS)[number];

export const WEEKLY_TERM_OPTIONS = [1, 3, 12] as const;
export type WeeklyTermOption = (typeof WEEKLY_TERM_OPTIONS)[number];

export const WEEKLY_TERM_WEEKS: Record<WeeklyTermOption, number> = {
  1: 4,
  3: 12,
  12: 48,
};

export const WEEKLY_TERM_DISCOUNT_PERCENT: Record<WeeklyTermOption, number> = {
  1: 5,
  3: 15,
  12: 30,
};

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

export function getSingleLessonPrice(basePrice: number): PackagePricing {
  return calculatePackagePricing(basePrice, 1, 0);
}

export function getTenLessonPackagePrice(basePrice: number): PackagePricing {
  return calculatePackagePricing(
    basePrice,
    TEN_PACK_LESSON_COUNT,
    TEN_PACK_DISCOUNT_PERCENT
  );
}

export function getWeeklyPackagePrice(
  basePrice: number,
  lessonsPerWeek: WeeklyLessonOption,
  termMonths: WeeklyTermOption
): PackagePricing {
  return calculatePackagePricing(
    basePrice,
    lessonsPerWeek * WEEKLY_TERM_WEEKS[termMonths],
    WEEKLY_TERM_DISCOUNT_PERCENT[termMonths]
  );
}

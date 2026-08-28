/**
 * Product facts the homepage states out loud.
 *
 * Every value here mirrors a constant the backend actually enforces. They live
 * in one place so the FAQ and the entry promo cannot drift apart, and so that
 * when a rule changes there is a single line to correct rather than a hunt
 * through prose.
 *
 * If you change one of these, change the sentence that quotes it too — the
 * numbers are woven into the copy, not interpolated everywhere.
 */

/** apps/lessons/pricing.py TRIAL_DURATION_MINUTES (also BookingModal.tsx). */
export const TRIAL_MINUTES = 20;

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

/** apps/payments/services.py PACKAGE_GRACE_PERIOD_DAYS. */
export const PACKAGE_GRACE_DAYS = 14;

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

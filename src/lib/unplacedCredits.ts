import type { PackagePurchase } from "@/types";

/**
 * Whether a package has credits that are not on the calendar and can still be
 * put there: paid, credits left (after payment `remaining_credits` is exactly
 * the credits no lesson has been placed on), and a weekly plan, which is what
 * the hours are picked from.
 */
export function hasUnplacedCredits(purchase: PackagePurchase): boolean {
  return (
    purchase.status === "paid" &&
    purchase.remaining_credits > 0 &&
    Boolean(purchase.plan.lessons_per_week) &&
    Boolean(purchase.plan.duration_days)
  );
}

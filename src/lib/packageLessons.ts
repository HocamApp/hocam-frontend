import type { Booking, PackagePurchase } from "@/types";
import { computePackageExpiry, isPastPackage } from "@/lib/packageExpiry";

/**
 * Where a paid package stands, in the student's terms.
 *
 * A package is paid for and its lessons are put on the calendar in the same
 * step, so the server's `remaining_credits` no longer means "lessons left to
 * take". It counts only the credits that are not on any lesson yet (the
 * student's chosen hours were taken by someone else, a lesson was cancelled in
 * time and gave its credit back). Read as "lessons left" it says 0 for a
 * package paid for a minute ago. What the student wants to know comes from the
 * credits and the package's own lessons together.
 */
export interface PackageLessons {
  /** Lessons the package was sold with. */
  total: number;
  /** Booked lessons that have not been taught yet. */
  upcoming: number;
  /** Credits that are not on any lesson yet. */
  unscheduled: number;
  /** Lessons still to take or to place: `upcoming` + `unscheduled`. */
  remaining: number;
  /** Lessons already behind the student: taught, or used up by a late cancellation. */
  behind: number;
}

// A lesson that is on right now is still ahead: it has not been taught yet.
const AHEAD: ReadonlySet<Booking["status"]> = new Set<Booking["status"]>([
  "pending",
  "confirmed",
  "in_progress",
]);

export function packageLessons(
  purchase: PackagePurchase,
  bookings: readonly Booking[]
): PackageLessons {
  const total = Math.max(0, purchase.total_credits);
  const unscheduled = Math.max(0, purchase.remaining_credits);
  const upcoming = bookings.filter(
    (booking) => booking.package_purchase === purchase.id && AHEAD.has(booking.status)
  ).length;
  const remaining = Math.min(total, upcoming + unscheduled);

  return { total, upcoming, unscheduled, remaining, behind: total - remaining };
}

/**
 * The package a student is working through: paid, with lessons left to take or
 * to place, and not past its end.
 */
export function firstActivePackage(
  purchases: readonly PackagePurchase[],
  bookings: readonly Booking[]
): PackagePurchase | undefined {
  return purchases.find((purchase) => {
    const lessons = packageLessons(purchase, bookings);
    return (
      purchase.status === "paid" &&
      lessons.remaining > 0 &&
      !isPastPackage(purchase, computePackageExpiry(purchase), lessons)
    );
  });
}

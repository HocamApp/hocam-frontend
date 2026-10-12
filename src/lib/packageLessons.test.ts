import assert from "node:assert/strict";
import test from "node:test";

import { firstActivePackage, packageLessons } from "@/lib/packageLessons";
import { computePackageExpiry, isPastPackage } from "@/lib/packageExpiry";
import type { Booking, PackagePurchase } from "@/types";

function purchase(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "p1",
    student: { id: "s", name: "Ayşe", surname: "Kaya" },
    tutor: { id: "t", name: "Ada", surname: "Hoca" },
    plan: {
      id: "plan",
      name: "Haftada 2 ders",
      code: "weekly_2_28d",
      lesson_count: 8,
      lesson_duration_minutes: 40,
      lessons_per_week: 2,
      duration_days: 28,
      discount_percent: 0,
    },
    status: "paid",
    total_credits: 8,
    remaining_credits: 0,
    unit_price: 400,
    subtotal_price: 3200,
    discount_amount: 0,
    promo_discount_amount: 0,
    total_price: 3200,
    created_at: "2026-10-01T09:00:00Z",
    paid_at: "2026-10-01T09:30:00Z",
    expires_at: "2099-01-01T00:00:00Z",
    promotion_code: null,
    ...overrides,
  } as PackagePurchase;
}

let counter = 0;
function booking(status: Booking["status"], packageId: string | null = "p1"): Booking {
  counter += 1;
  return {
    id: `b${counter}`,
    status,
    package_purchase: packageId,
    start_time: "2026-10-20T10:00:00Z",
    duration_minutes: 40,
  } as Booking;
}

function bookings(status: Booking["status"], count: number, packageId: string | null = "p1") {
  return Array.from({ length: count }, () => booking(status, packageId));
}

test("a package paid for today is fully placed: nothing unscheduled, every lesson still ahead", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 0 }), bookings("confirmed", 8));

  assert.deepEqual(lessons, { total: 8, upcoming: 8, unscheduled: 0, remaining: 8, behind: 0 });
});

test("lessons left are the ones booked ahead plus the credits not placed yet", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 2 }), bookings("confirmed", 6));

  assert.equal(lessons.upcoming, 6);
  assert.equal(lessons.unscheduled, 2);
  assert.equal(lessons.remaining, 8);
  assert.equal(lessons.behind, 0);
});

test("lessons taken are behind the student, whatever their outcome", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 0 }), [
    ...bookings("completed", 2),
    ...bookings("awaiting_confirmation", 1),
    ...bookings("confirmed", 5),
  ]);

  assert.equal(lessons.upcoming, 5);
  assert.equal(lessons.remaining, 5);
  assert.equal(lessons.behind, 3);
});

test("a lesson that is on right now is still ahead, not behind", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 0 }), [
    ...bookings("in_progress", 1),
    ...bookings("confirmed", 7),
  ]);

  assert.equal(lessons.upcoming, 8);
  assert.equal(lessons.behind, 0);
});

test("a credit used up by a late cancellation is behind the student too", () => {
  // 8 sold; 2 completed, 5 ahead, 1 cancelled too late (the credit was not
  // given back, so it is neither ahead nor unscheduled).
  const lessons = packageLessons(purchase({ remaining_credits: 0 }), [
    ...bookings("completed", 2),
    ...bookings("confirmed", 5),
    ...bookings("cancelled", 1),
  ]);

  assert.equal(lessons.remaining, 5);
  assert.equal(lessons.behind, 3);
});

test("a cancelled lesson that gave its credit back is unscheduled, not lost", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 1 }), [
    ...bookings("confirmed", 7),
    ...bookings("cancelled", 1),
  ]);

  assert.equal(lessons.upcoming, 7);
  assert.equal(lessons.unscheduled, 1);
  assert.equal(lessons.remaining, 8);
});

test("only this package's lessons are counted", () => {
  const lessons = packageLessons(purchase({ remaining_credits: 0 }), [
    ...bookings("confirmed", 3),
    ...bookings("confirmed", 4, "someone-elses"),
    ...bookings("confirmed", 2, null),
  ]);

  assert.equal(lessons.upcoming, 3);
});

test("the count never runs past what was sold", () => {
  const lessons = packageLessons(purchase({ total_credits: 4, remaining_credits: 3 }), bookings("confirmed", 4));

  assert.equal(lessons.remaining, 4);
  assert.equal(lessons.behind, 0);
});

test("a freshly paid, fully placed package is not a past package", () => {
  const row = purchase({ remaining_credits: 0 });
  const expiry = computePackageExpiry(row);

  // Without the lessons it looks used up: no credit is left unscheduled.
  assert.equal(isPastPackage(row, expiry), true);
  // With them it is the package the student just paid for.
  assert.equal(isPastPackage(row, expiry, packageLessons(row, bookings("confirmed", 8))), false);
});

test("a package with nothing left to take or place is past", () => {
  const row = purchase({ remaining_credits: 0 });

  assert.equal(
    isPastPackage(row, computePackageExpiry(row), packageLessons(row, bookings("completed", 8))),
    true
  );
});

test("a package with only unplaced credits is still in use", () => {
  const row = purchase({ remaining_credits: 3 });

  assert.equal(
    isPastPackage(row, computePackageExpiry(row), packageLessons(row, bookings("completed", 5))),
    false
  );
});

test("the active package is the one just paid for, even with no credit left unscheduled", () => {
  const fresh = purchase({ id: "fresh", remaining_credits: 0 });

  assert.equal(firstActivePackage([fresh], bookings("confirmed", 8, "fresh")), fresh);
});

test("a package with nothing left, a cancelled one and one waiting for payment are not active", () => {
  const usedUp = purchase({ id: "used-up", remaining_credits: 0 });
  const cancelled = purchase({ id: "cancelled", status: "cancelled", remaining_credits: 8 });
  const pending = purchase({ id: "pending", status: "pending", paid_at: null, remaining_credits: 0 });

  assert.equal(
    firstActivePackage([usedUp, cancelled, pending], bookings("completed", 8, "used-up")),
    undefined
  );
});

test("a package past its end is not active, however many lessons it still has", () => {
  const ended = purchase({ id: "ended", remaining_credits: 3, expires_at: "2020-01-01T00:00:00Z" });

  assert.equal(firstActivePackage([ended], []), undefined);
});

test("with several packages the first one in the list that is still running wins", () => {
  const finished = purchase({ id: "finished", remaining_credits: 0 });
  const running = purchase({ id: "running", remaining_credits: 2 });
  const later = purchase({ id: "later", remaining_credits: 8 });

  assert.equal(
    firstActivePackage([finished, running, later], bookings("completed", 8, "finished")),
    running
  );
});

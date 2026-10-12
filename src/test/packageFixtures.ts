import type { Booking, PackagePurchase } from "@/types";

/** A lesson package of 8 lessons, two a week for four weeks, paid and running. */
export function purchaseFixture(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "purchase-1",
    student: { id: "student-1", name: "Ayşe", surname: "Kaya" },
    tutor: { id: "tutor-1", name: "Ada", surname: "Hoca" },
    plan: {
      id: "plan-1",
      name: "Haftada 2 ders, 4 hafta",
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
    created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    paid_at: new Date(Date.now() - 30 * 60_000).toISOString(),
    expires_at: new Date(Date.now() + 27 * 24 * 60 * 60_000).toISOString(),
    promotion_code: null,
    ...overrides,
  };
}

let counter = 0;

/** A lesson of the fixture package, with the status given. */
export function bookingFixture(
  status: Booking["status"],
  overrides: Partial<Booking> = {}
): Booking {
  counter += 1;
  return {
    id: `booking-${counter}`,
    status,
    package_purchase: "purchase-1",
    subject: { id: "subject-1", name: "Matematik", exam_type: "TYT" },
    // Far enough ahead to stay "upcoming" for as long as these tests exist.
    start_time: "2099-01-05T10:00:00Z",
    duration_minutes: 40,
    ...overrides,
  } as Booking;
}

export function bookingsFixture(
  status: Booking["status"],
  count: number,
  overrides: Partial<Booking> = {}
): Booking[] {
  return Array.from({ length: count }, () => bookingFixture(status, overrides));
}

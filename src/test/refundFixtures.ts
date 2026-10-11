import type {
  PackagePurchase,
  RefundCalculation,
  RefundLesson,
  RefundPreview,
  RefundReason,
  RefundRequest,
} from "@/types";

/** Real instants (offset included), as the refund API sends them. 15:00 UTC is
 * 18:00 in Istanbul. */
export function lessonAt(day: number, why: RefundLesson["why"], hourUtc = 15): RefundLesson {
  return {
    starts_at: `2026-10-${String(day).padStart(2, "0")}T${String(hourUtc).padStart(2, "0")}:00:00+00:00`,
    why,
  };
}

/** 10 credits at 850 ₺: two taken, four still to come, four never scheduled. */
export function calculation(overrides: Partial<RefundCalculation> = {}): RefundCalculation {
  return {
    full_refund: false,
    total_paid: 8500,
    unit_price: 850,
    used_credits: 2,
    unscheduled_credits: 4,
    deduction_amount: 1700,
    refund_amount: 6800,
    used_lessons: [lessonAt(8, "lesson_taken"), lessonAt(9, "lesson_taken")],
    cancelled_lessons: [
      lessonAt(14, "still_to_come"),
      lessonAt(15, "still_to_come"),
      lessonAt(16, "still_to_come"),
      lessonAt(17, "still_to_come"),
    ],
    near_window_hours: 12,
    ...overrides,
  };
}

export function preview(overrides: Partial<RefundPreview> = {}): RefundPreview {
  return {
    purchase_id: "purchase-1",
    reason: "voluntary" as RefundReason,
    eligible: true,
    blocked_reason: "",
    answer_within_days: 14,
    calculation: calculation(),
    token: "token-1",
    token_valid_for_minutes: 15,
    ...overrides,
  };
}

export function refundRequest(overrides: Partial<RefundRequest> = {}): RefundRequest {
  const working = overrides.calculation === undefined ? calculation() : overrides.calculation;
  return {
    id: "refund-1",
    purchase: "purchase-1",
    student: "student-1",
    reason: "voluntary",
    initiated_by: "student",
    status: "requested",
    paytr_refund: null,
    used_credits: 2,
    remaining_credits: 4,
    deduction_unit_price: 850,
    deduction_amount: 1700,
    refund_amount: 6800,
    student_note: "",
    rejection_reason: "",
    due_at: "2026-10-25T09:00:00+00:00",
    decided_at: null,
    provider_refunded_at: null,
    processed_at: null,
    created_at: "2026-10-11T09:00:00+00:00",
    updated_at: "2026-10-11T09:00:00+00:00",
    purchase_summary: {
      id: "purchase-1",
      status: "paid",
      total_credits: 10,
      remaining_credits: 4,
      tutor: { id: "tutor-1", name: "Ada", surname: "Lovelace" },
    },
    ...overrides,
    calculation: working,
  };
}

/** The package those figures belong to: ten lessons at 850 ₺ after discount. */
export function paidPurchase(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "purchase-1",
    student: { id: "student-1", name: "Deniz", surname: "Kaya" },
    tutor: { id: "tutor-1", name: "Ada", surname: "Lovelace" },
    plan: {
      id: "plan-1",
      name: "Haftada 2 ders · 30 gün",
      code: "w2-d30",
      lesson_count: 10,
      lesson_duration_minutes: 40,
      lessons_per_week: 2,
      duration_days: 30,
      discount_percent: 15,
    },
    status: "paid",
    total_credits: 10,
    remaining_credits: 4,
    unit_price: 850,
    subtotal_price: 10000,
    discount_amount: 1500,
    promo_discount_amount: 0,
    total_price: 8500,
    created_at: "2026-10-05T09:00:00+03:00",
    paid_at: "2026-10-05T09:20:00+03:00",
    expires_at: "2026-11-04T09:20:00+03:00",
    promotion_code: null,
    ...overrides,
  };
}

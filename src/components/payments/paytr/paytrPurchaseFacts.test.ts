import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PackagePurchase } from "@/types";

import { readPayTRPurchaseFacts } from "./paytrPurchaseFacts";

function purchase(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "purchase-1",
    student: { id: "student-1", name: "Ada", surname: "Yılmaz" },
    tutor: { id: "tutor-1", name: "Deniz", surname: "Kaya" },
    plan: {
      id: "plan-1",
      name: "Haftada 3 ders · 30 gün",
      code: "w3-d30",
      lesson_count: 12,
      lesson_duration_minutes: 40,
      lessons_per_week: 3,
      duration_days: 30,
      discount_percent: 10,
    },
    status: "pending",
    total_credits: 12,
    remaining_credits: 0,
    unit_price: 400,
    subtotal_price: 4800,
    discount_amount: 480,
    promo_discount_amount: 120,
    total_price: 4200,
    created_at: "2026-09-17T09:00:00Z",
    paid_at: null,
    promotion_code: null,
    ...overrides,
  };
}

describe("readPayTRPurchaseFacts", () => {
  it("reads the amounts the server stored, and does not recompute the total", () => {
    const facts = readPayTRPurchaseFacts(purchase());

    assert.equal(facts?.total, 4200);
    assert.equal(facts?.subtotal, 4800);
    assert.equal(facts?.packageDiscount, 480);
    assert.equal(facts?.promoDiscount, 120);
    // 4800 - 480 - 120 is 4200 here, but a server total of 1 would still win.
    assert.equal(readPayTRPurchaseFacts(purchase({ total_price: 1 }))?.total, 1);
  });

  it("carries the tutor and plan the purchase names", () => {
    const facts = readPayTRPurchaseFacts(purchase());

    assert.equal(facts?.tutorName, "Deniz Kaya");
    assert.equal(facts?.planName, "Haftada 3 ders · 30 gün");
    assert.equal(facts?.totalCredits, 12);
    assert.equal(facts?.lessonDurationMinutes, 40);
  });

  it("refuses the whole summary when an amount is missing or unusable", () => {
    assert.equal(
      readPayTRPurchaseFacts(
        purchase({ total_price: undefined as unknown as number })
      ),
      null
    );
    assert.equal(
      readPayTRPurchaseFacts(purchase({ subtotal_price: Number.NaN })),
      null
    );
    assert.equal(
      readPayTRPurchaseFacts(purchase({ total_price: -1 })),
      null
    );
    assert.equal(readPayTRPurchaseFacts(null), null);
    assert.equal(readPayTRPurchaseFacts(undefined), null);
  });

  it("accepts the numeric strings DRF decimals arrive as", () => {
    const facts = readPayTRPurchaseFacts(
      purchase({ total_price: "4200.00" as unknown as number })
    );

    assert.equal(facts?.total, 4200);
  });

  it("hides a discount row the purchase does not have", () => {
    const facts = readPayTRPurchaseFacts(
      purchase({ discount_amount: 0, promo_discount_amount: 0 })
    );

    assert.equal(facts?.packageDiscount, 0);
    assert.equal(facts?.promoDiscount, 0);
  });
});

describe("the hours a purchase holds", () => {
  const slot = (day: number, start: string, subject = "Matematik") => ({
    slot_index: 0,
    day_of_week: day,
    start_time: start,
    subject: { id: "s1", name: subject },
  });

  it("reads them sorted by day and time, whatever order they arrive in", () => {
    const facts = readPayTRPurchaseFacts(
      purchase({ recurring_slots: [slot(3, "12:00"), slot(0, "11:00"), slot(0, "09:30")] })
    );

    assert.deepEqual(
      facts?.weeklySlots.map((entry) => [entry.dayOfWeek, entry.startTime]),
      [
        [0, "09:30"],
        [0, "11:00"],
        [3, "12:00"],
      ]
    );
    assert.equal(facts?.weeklySlots[0].subjectName, "Matematik");
  });

  it("drops a slot that is malformed instead of showing half of it", () => {
    const facts = readPayTRPurchaseFacts(
      purchase({
        recurring_slots: [
          slot(7, "10:00"),
          slot(-1, "10:00"),
          slot(2, "25:00"),
          slot(2, "10:0"),
          slot(1.5, "10:00"),
          slot(2, "10:00"),
        ],
      })
    );

    assert.deepEqual(facts?.weeklySlots.map((entry) => entry.dayOfWeek), [2]);
  });

  it("has none for a purchase that carries none", () => {
    assert.deepEqual(readPayTRPurchaseFacts(purchase())?.weeklySlots, []);
    assert.deepEqual(
      readPayTRPurchaseFacts(purchase({ recurring_slots: undefined }))?.weeklySlots,
      []
    );
  });

  it("reads the end of the hold only for a purchase that is still waiting for its payment", () => {
    const deadline = "2026-10-12T09:40:00+03:00";

    assert.equal(
      readPayTRPurchaseFacts(purchase({ payment_deadline: deadline }))?.holdDeadlineMs,
      Date.parse(deadline)
    );
    for (const status of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(
        readPayTRPurchaseFacts(purchase({ status, payment_deadline: deadline }))?.holdDeadlineMs,
        null,
        status
      );
    }
  });

  it("treats a missing or unreadable deadline as no hold", () => {
    assert.equal(readPayTRPurchaseFacts(purchase())?.holdDeadlineMs, null);
    assert.equal(readPayTRPurchaseFacts(purchase({ payment_deadline: null }))?.holdDeadlineMs, null);
    assert.equal(
      readPayTRPurchaseFacts(purchase({ payment_deadline: "next tuesday" }))?.holdDeadlineMs,
      null
    );
  });
});


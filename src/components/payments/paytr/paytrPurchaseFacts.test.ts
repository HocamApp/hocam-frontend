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

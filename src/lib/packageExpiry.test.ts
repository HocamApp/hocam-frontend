import assert from "node:assert/strict";
import test from "node:test";

import { computePackageExpiry, isPastPackage } from "@/lib/packageExpiry";
import type { PackagePurchase } from "@/types";

const DAY = 24 * 60 * 60 * 1000;
const PAID_AT = Date.parse("2026-10-01T09:00:00Z");

function purchase(overrides: Partial<PackagePurchase> = {}): PackagePurchase {
  return {
    id: "p1",
    student: { id: "s", name: "Ayşe", surname: "Kaya" },
    tutor: { id: "t", name: "Ada", surname: "Hoca" },
    plan: {
      id: "plan",
      name: "Haftada 2 ders",
      code: "weekly_2_14d",
      lesson_count: 4,
      lesson_duration_minutes: 40,
      lessons_per_week: 2,
      duration_days: 14,
      discount_percent: 0,
    },
    status: "paid",
    total_credits: 4,
    remaining_credits: 4,
    unit_price: 400,
    subtotal_price: 1600,
    discount_amount: 0,
    promo_discount_amount: 0,
    total_price: 1600,
    created_at: new Date(PAID_AT - DAY).toISOString(),
    paid_at: new Date(PAID_AT).toISOString(),
    promotion_code: null,
    ...overrides,
  } as PackagePurchase;
}

test("the end comes from the server, with no client-side grace window", () => {
  const expiresAt = new Date(PAID_AT + 14 * DAY).toISOString();
  const row = purchase({ expires_at: expiresAt, grace_period_days: 0 });

  const justBefore = computePackageExpiry(row, PAID_AT + 14 * DAY - 1000);
  assert.ok(justBefore);
  assert.equal(justBefore.isExpired, false);

  // The old client assumed 14 extra days: a package the backend refuses to
  // book for was shown as usable with "N gün kaldı".
  const dayAfter = computePackageExpiry(row, PAID_AT + 15 * DAY);
  assert.ok(dayAfter);
  assert.equal(dayAfter.isExpired, true);
  assert.equal(dayAfter.isInGrace, false);
  assert.equal(dayAfter.hardExpiryDate.toISOString(), expiresAt);
  assert.equal(dayAfter.termEndDate.toISOString(), expiresAt);
});

test("a grace window frozen on the purchase is honoured and shown as grace", () => {
  const row = purchase({
    expires_at: new Date(PAID_AT + 28 * DAY).toISOString(),
    grace_period_days: 14,
  });

  const inGrace = computePackageExpiry(row, PAID_AT + 20 * DAY);
  assert.ok(inGrace);
  assert.equal(inGrace.isExpired, false);
  assert.equal(inGrace.isInGrace, true);
  assert.equal(inGrace.termEndDate.toISOString(), new Date(PAID_AT + 14 * DAY).toISOString());
  assert.equal(inGrace.graceDaysLeft, 8);

  const after = computePackageExpiry(row, PAID_AT + 29 * DAY);
  assert.ok(after);
  assert.equal(after.isExpired, true);
});

test("an API response without expires_at falls back to the term, not to a guessed grace", () => {
  const row = purchase({ expires_at: undefined, grace_period_days: undefined });
  const fallback = computePackageExpiry(row, PAID_AT + 1 * DAY);
  assert.ok(fallback);
  assert.equal(fallback.hardExpiryDate.toISOString(), new Date(PAID_AT + 14 * DAY).toISOString());
});

test("a purchase with no term has no expiry", () => {
  const legacy = purchase({
    plan: { ...purchase().plan, duration_days: null },
  });
  assert.equal(computePackageExpiry(legacy, PAID_AT), null);
  assert.equal(computePackageExpiry(purchase({ paid_at: null }), PAID_AT), null);
});

test("an unreadable end date is treated as no expiry instead of a wrong one", () => {
  assert.equal(
    computePackageExpiry(purchase({ expires_at: "not-a-date" }), PAID_AT),
    null
  );
});

test("a package is past when cancelled, refunded, out of credits or out of time", () => {
  const live = computePackageExpiry(
    purchase({ expires_at: new Date(PAID_AT + 14 * DAY).toISOString() }),
    PAID_AT + DAY
  );
  assert.equal(isPastPackage(purchase({ status: "cancelled" }), live), true);
  assert.equal(isPastPackage(purchase({ status: "refunded" }), live), true);
  assert.equal(isPastPackage(purchase({ remaining_credits: 0 }), live), true);
  assert.equal(isPastPackage(purchase(), live), false);

  const expired = computePackageExpiry(
    purchase({ expires_at: new Date(PAID_AT + 14 * DAY).toISOString() }),
    PAID_AT + 30 * DAY
  );
  assert.equal(isPastPackage(purchase(), expired), true);
  // A pending purchase is judged by the card, never by an expiry it does not have.
  assert.equal(isPastPackage(purchase({ status: "pending" }), null), false);
});

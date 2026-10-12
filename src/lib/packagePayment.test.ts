import assert from "node:assert/strict";
import test from "node:test";

import {
  awaitingPayment,
  deadlineTimeLabel,
  packageBadgeStatus,
  packageRestartHref,
} from "@/lib/packagePayment";

const NOW = Date.parse("2026-10-12T09:00:00Z");

test("a pending purchase with a deadline in the future is waiting for its payment", () => {
  const waiting = awaitingPayment(
    { status: "pending", payment_deadline: "2026-10-12T09:40:00Z" },
    NOW
  );

  assert.deepEqual(waiting, { open: true, deadlineMs: Date.parse("2026-10-12T09:40:00Z") });
});

test("past its deadline the hold is over, but it is still the same purchase", () => {
  const waiting = awaitingPayment(
    { status: "pending", payment_deadline: "2026-10-12T08:59:59Z" },
    NOW
  );

  assert.equal(waiting?.open, false);
});

test("a pending purchase with no deadline is not waiting for a payment: it waits for a tutor", () => {
  assert.equal(awaitingPayment({ status: "pending", payment_deadline: null }, NOW), null);
  assert.equal(awaitingPayment({ status: "pending" }, NOW), null);
});

test("only a pending purchase can be waiting", () => {
  for (const status of ["paid", "cancelled", "refunded"] as const) {
    assert.equal(
      awaitingPayment({ status, payment_deadline: "2026-10-12T09:40:00Z" }, NOW),
      null
    );
  }
});

test("a deadline that cannot be read is ignored rather than trusted", () => {
  assert.equal(awaitingPayment({ status: "pending", payment_deadline: "soon" }, NOW), null);
});

test("the badge says what the purchase is waiting for, and keeps every other status", () => {
  assert.equal(
    packageBadgeStatus({ status: "pending", payment_deadline: "2026-10-12T09:40:00Z" }, NOW),
    "awaiting_payment"
  );
  assert.equal(
    packageBadgeStatus({ status: "pending", payment_deadline: "2026-10-12T08:00:00Z" }, NOW),
    "payment_expired"
  );
  assert.equal(packageBadgeStatus({ status: "pending", payment_deadline: null }, NOW), "pending");
  assert.equal(packageBadgeStatus({ status: "paid", payment_deadline: null }, NOW), "paid");
  assert.equal(packageBadgeStatus({ status: "refunded" }, NOW), "refunded");
});

test("the way back to the hours is this tutor's schedule step, with the purchase's plan", () => {
  assert.equal(
    packageRestartHref({
      tutor: { id: "t1", name: "Ada", surname: "Hoca" },
      plan: { lessons_per_week: 3, duration_days: 30 },
    } as never),
    "/tutors/t1/checkout/schedule?per_week=3&duration=30"
  );
  assert.equal(
    packageRestartHref({
      tutor: { id: "t1", name: "Ada", surname: "Hoca" },
      plan: { lessons_per_week: null, duration_days: null },
    } as never),
    "/tutors/t1/checkout/schedule"
  );
});

test("the deadline is shown on Istanbul's clock, whatever the browser's", () => {
  // 11:35Z is 14:35 in Istanbul (UTC+3).
  assert.equal(deadlineTimeLabel(Date.parse("2026-10-12T11:35:00Z")), "14:35");
});

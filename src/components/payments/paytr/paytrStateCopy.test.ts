import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PayTRCheckoutStateName } from "./paytrCheckoutState";
import { payTRStateCopy } from "./paytrStateCopy";

const EVERY_STATE: PayTRCheckoutStateName[] = [
  "loading",
  "query_error",
  "purchase_unavailable",
  "acceptance_pending",
  "acceptance_rejected",
  "payment_unavailable",
  "payment_ready",
  "starting_payment",
  "iframe_open",
  "callback_pending",
  "attempt_failed",
  "manual_review",
  "payment_paid",
  "purchase_cancelled",
  "purchase_refunded",
];

describe("payTRStateCopy", () => {
  it("has a heading and a body for every state the mapper can return", () => {
    for (const name of EVERY_STATE) {
      const copy = payTRStateCopy({ name });

      assert.ok(copy.title.trim(), name);
      assert.ok(copy.description.trim(), name);
    }
  });

  it("names the acceptance outcome instead of lumping them together", () => {
    assert.equal(
      payTRStateCopy({ name: "acceptance_rejected", acceptanceStatus: "expired" }).title,
      "Talebin süresi doldu"
    );
    assert.equal(
      payTRStateCopy({ name: "acceptance_rejected", acceptanceStatus: "rejected" }).title,
      "Paket talebi kabul edilmedi"
    );
    assert.equal(
      payTRStateCopy({ name: "acceptance_rejected", acceptanceStatus: "withdrawn" }).title,
      "Paket talebi kapatıldı"
    );
  });

  it("separates a flag that is off from a coaching package that is held back", () => {
    assert.equal(
      payTRStateCopy({ name: "payment_unavailable", blockedReason: "flag_off" }).title,
      "Ödeme şu anda kullanılamıyor"
    );
    assert.equal(
      payTRStateCopy({ name: "payment_unavailable", blockedReason: "coaching_unverified" }).title,
      "Bu paket için ödeme henüz kullanılamıyor"
    );
  });

  it("claims success only where the backend already said paid", () => {
    assert.equal(payTRStateCopy({ name: "payment_paid" }).tone, "success");

    for (const name of EVERY_STATE.filter((state) => state !== "payment_paid")) {
      assert.notEqual(payTRStateCopy({ name }).tone, "success", name);
    }
  });

  it("never tells an unresolved payment that the card was not charged", () => {
    for (const name of ["callback_pending", "manual_review", "attempt_failed"] as const) {
      const copy = payTRStateCopy({ name });

      assert.doesNotMatch(copy.description, /çekilmedi|iade edilecek|para iade/i);
    }
    assert.match(
      payTRStateCopy({ name: "callback_pending" }).description,
      /durumu kontrol et/i
    );
  });

  it("offers a re-check, not a new payment, while a result is unresolved", () => {
    assert.equal(payTRStateCopy({ name: "callback_pending" }).action, "recheck");
    assert.equal(payTRStateCopy({ name: "manual_review" }).action, "recheck");
    assert.equal(payTRStateCopy({ name: "attempt_failed" }).action, "retry");
    assert.equal(payTRStateCopy({ name: "purchase_cancelled" }).action, "packages");
    assert.equal(payTRStateCopy({ name: "payment_paid" }).action, "packages");
  });

  it("stays neutral on a refunded purchase instead of promising the bank moved", () => {
    const copy = payTRStateCopy({ name: "purchase_refunded" });

    assert.doesNotMatch(copy.description, /hesabına geçti|bankaya ulaştı|ödendi/i);
  });
});

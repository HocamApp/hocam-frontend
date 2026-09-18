import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchase, PackagePurchaseStatus } from "@/types";

import {
  paytrCheckoutState,
  type PayTRCheckoutStateInput,
} from "./paytrCheckoutState";

function purchase(status: PackagePurchaseStatus = "pending"): PackagePurchase {
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
    status,
    total_credits: 12,
    remaining_credits: status === "paid" ? 12 : 0,
    unit_price: 400,
    subtotal_price: 4800,
    discount_amount: 480,
    promo_discount_amount: 0,
    total_price: 4320,
    created_at: "2026-09-17T09:00:00Z",
    paid_at: status === "paid" ? "2026-09-17T09:20:00Z" : null,
    promotion_code: null,
  };
}

const NO_ACCEPTANCE: PurchaseAcceptanceState = {
  requires_tutor_acceptance: false,
  acceptance: null,
};

function acceptance(
  status: NonNullable<PurchaseAcceptanceState["acceptance"]>["status"],
  includesCoaching = false
): PurchaseAcceptanceState {
  return {
    requires_tutor_acceptance: true,
    acceptance: {
      id: "acceptance-1",
      status,
      expires_at: "2026-09-19T09:00:00Z",
      responded_at: status === "pending" ? null : "2026-09-17T10:00:00Z",
      includes_coaching: includesCoaching,
    },
  };
}

function state(overrides: Partial<PayTRCheckoutStateInput> = {}) {
  return paytrCheckoutState({
    paytrEnabled: true,
    purchase: purchase(),
    acceptance: NO_ACCEPTANCE,
    ...overrides,
  });
}

describe("paytrCheckoutState — reading the server before anything else", () => {
  it("waits while either query is still unresolved", () => {
    assert.equal(state({ purchase: undefined }).name, "loading");
    assert.equal(state({ acceptance: undefined }).name, "loading");
  });

  it("separates a purchase we could not read from one that is not ours", () => {
    assert.equal(
      state({ purchase: null, purchaseQueryFailed: true }).name,
      "query_error"
    );
    assert.equal(state({ purchase: null }).name, "purchase_unavailable");
  });

  it("never opens payment on an acceptance answer it could not read", () => {
    const failed = state({ acceptance: null, acceptanceQueryFailed: true });

    assert.equal(failed.name, "query_error");
    assert.equal(failed.canStartPayment, false);
  });

  it("does not let a stale ready view survive a fresh acceptance failure", () => {
    const ready = state();
    const afterFailure = state({
      acceptance: null,
      acceptanceQueryFailed: true,
    });

    assert.equal(ready.name, "payment_ready");
    assert.equal(afterFailure.canStartPayment, false);
  });
});

describe("paytrCheckoutState — the purchase status is the last word", () => {
  it("renders success from the backend status alone", () => {
    const paid = state({ purchase: purchase("paid") });

    assert.equal(paid.name, "payment_paid");
    assert.equal(paid.canStartPayment, false);
  });

  it("keeps success even when every local signal says the attempt went wrong", () => {
    const paid = state({
      purchase: purchase("paid"),
      lastStartErrorKind: "unknown",
      knownAttempt: {
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: "OID",
        tutorId: "tutor-1",
        startedAt: 1,
      },
    });

    // The failed return route renders whatever this says, so "paid" here is
    // what stops /odeme/basarisiz from contradicting the server.
    assert.equal(paid.name, "payment_paid");
  });

  it("closes every payment control on a cancelled or refunded purchase", () => {
    const cancelled = state({ purchase: purchase("cancelled") });
    const refunded = state({ purchase: purchase("refunded") });

    assert.equal(cancelled.name, "purchase_cancelled");
    assert.equal(refunded.name, "purchase_refunded");
    assert.equal(cancelled.canStartPayment, false);
    assert.equal(refunded.canStartPayment, false);
    assert.equal(cancelled.canRetryPayment, false);
  });
});

describe("paytrCheckoutState — tutor acceptance", () => {
  it("opens the form when no tutor decision is required", () => {
    const ready = state();

    assert.equal(ready.name, "payment_ready");
    assert.equal(ready.canStartPayment, true);
  });

  it("opens the form once the tutor has accepted", () => {
    assert.equal(state({ acceptance: acceptance("accepted") }).name, "payment_ready");
  });

  it("waits, without a form, while the tutor has not answered", () => {
    const pending = state({ acceptance: acceptance("pending") });

    assert.equal(pending.name, "acceptance_pending");
    assert.equal(pending.canStartPayment, false);
  });

  it("carries which ended state it was, so the screen can name it", () => {
    for (const status of ["rejected", "expired", "withdrawn", "cancelled"] as const) {
      const ended = state({ acceptance: acceptance(status) });

      assert.equal(ended.name, "acceptance_rejected");
      assert.equal(ended.acceptanceStatus, status);
      assert.equal(ended.canStartPayment, false);
    }
  });

  it("blocks rather than guesses when the server contradicts itself (B06)", () => {
    const inconsistent = state({
      acceptance: { requires_tutor_acceptance: true, acceptance: null },
    });

    assert.equal(inconsistent.canStartPayment, false);
    assert.equal(inconsistent.name, "query_error");
  });
});

describe("paytrCheckoutState — gates that are not about the tutor", () => {
  it("offers no new payment while the frontend flag is off", () => {
    const off = state({ paytrEnabled: false });

    assert.equal(off.name, "payment_unavailable");
    assert.equal(off.blockedReason, "flag_off");
    assert.equal(off.canStartPayment, false);
  });

  it("still reaches the recovery path for an attempt that already started", () => {
    const off = state({
      paytrEnabled: false,
      knownAttempt: {
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: "OID",
        tutorId: "tutor-1",
        startedAt: 1,
      },
    });

    assert.equal(off.name, "callback_pending");
  });

  it("holds back a coaching purchase until its collection contract is verified", () => {
    const coaching = state({ acceptance: acceptance("accepted", true) });

    assert.equal(coaching.name, "payment_unavailable");
    assert.equal(coaching.blockedReason, "coaching_unverified");
    assert.equal(coaching.canStartPayment, false);
  });
});

describe("paytrCheckoutState — one attempt at a time", () => {
  it("shows the iframe only with a URL the caller verified", () => {
    const open = state({
      attemptPhase: "iframe",
      iframeUrl: "https://www.paytr.com/odeme/guvenli/tok",
    });

    assert.equal(open.name, "iframe_open");
    assert.equal(open.iframeUrl, "https://www.paytr.com/odeme/guvenli/tok");
    assert.equal(open.canStartPayment, false);
  });

  it("falls back to the form when the iframe phase has no URL", () => {
    assert.equal(state({ attemptPhase: "iframe" }).name, "payment_ready");
  });

  it("locks the submit while the token request is in flight", () => {
    const starting = state({ attemptPhase: "starting" });

    assert.equal(starting.name, "starting_payment");
    assert.equal(starting.canStartPayment, false);
  });

  it("treats a lost token response as unresolved, not as a free retry", () => {
    const lost = state({ lastStartErrorKind: "unknown" });

    assert.equal(lost.name, "callback_pending");
    assert.equal(lost.canStartPayment, false);
    assert.equal(lost.canRetryPayment, false);
  });

  it("does not reopen the form for an attempt this tab already started", () => {
    const reloaded = state({
      knownAttempt: {
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: null,
        tutorId: "tutor-1",
        startedAt: 1_758_000_000_000,
      },
    });

    assert.equal(reloaded.name, "callback_pending");
  });

  it("ignores a stored attempt that belongs to a different purchase", () => {
    const other = state({
      knownAttempt: {
        schemaVersion: 1,
        purchaseId: "purchase-2",
        merchantOid: "OID",
        tutorId: "tutor-1",
        startedAt: 1,
      },
    });

    assert.equal(other.name, "payment_ready");
  });

  it("keeps a 503 on the form instead of inventing an unresolved attempt", () => {
    const serviceDown = state({ lastStartErrorKind: "service" });

    assert.equal(serviceDown.name, "payment_ready");
    assert.equal(serviceDown.canStartPayment, true);
  });
});

describe("paytrCheckoutState — verified attempt data only (S7)", () => {
  it("cannot reach a failed attempt without the backend saying so", () => {
    const withoutEndpoint = state({ lastStartErrorKind: "unknown" });

    assert.notEqual(withoutEndpoint.name, "attempt_failed");
    assert.notEqual(withoutEndpoint.name, "manual_review");
  });

  it("offers one retry on the same purchase for a verified failure", () => {
    const failed = state({
      verifiedAttempt: { status: "failed", manualReview: false },
    });

    assert.equal(failed.name, "attempt_failed");
    assert.equal(failed.canRetryPayment, true);
    assert.equal(failed.canStartPayment, false);
  });

  it("starts nothing new while the purchase is under manual review", () => {
    const review = state({
      verifiedAttempt: { status: "failed", manualReview: true },
    });

    assert.equal(review.name, "manual_review");
    assert.equal(review.canRetryPayment, false);
    assert.equal(review.canStartPayment, false);
  });

  it("waits out an attempt the server still calls open", () => {
    for (const status of ["created", "token_issued"] as const) {
      assert.equal(
        state({ verifiedAttempt: { status, manualReview: false } }).name,
        "callback_pending"
      );
    }
  });

  it("claims no success from an attempt the purchase has not caught up with", () => {
    const succeededAttempt = state({
      verifiedAttempt: { status: "succeeded", manualReview: false },
    });

    assert.equal(succeededAttempt.name, "callback_pending");
    assert.notEqual(succeededAttempt.name, "payment_paid");
  });
});

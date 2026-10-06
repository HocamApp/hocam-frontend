import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PayTRPaymentStatus } from "@/types";

import {
  payTREntryBlockedMessage,
  payTREntryDecision,
  payTRPayHref,
  payTRPostCreateTarget,
  payTRServerAllowsUnpaidCancel,
  payTRShowsUnpaidCancel,
  type PayTREntryInput,
} from "./paytrEntryPoints";

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

/** A pending purchase the server is ready to take payment for. */
function serverStatus(overrides: Partial<PayTRPaymentStatus> = {}): PayTRPaymentStatus {
  return {
    purchase_id: "purchase-1",
    purchase_status: "pending",
    paid_at: null,
    provider: "",
    provider_reference: "",
    amount_minor: 432000,
    lesson_amount_minor: 432000,
    coaching_amount_minor: 0,
    coaching_subtotal_minor: 0,
    coaching_discount_minor: 0,
    currency: "TL",
    checkout_enabled: true,
    has_active_attempt: false,
    manual_review: false,
    requires_reconciliation: false,
    can_start_checkout: true,
    can_resume_checkout: false,
    can_retry_checkout: false,
    can_cancel_unpaid: true,
    checkout_blocked_reason: "",
    latest_attempt: null,
    ...overrides,
  };
}

/** The server's answer for a lesson + coaching bundle of 4,320 + 1,500 TL. */
function coachingStatus(overrides: Partial<PayTRPaymentStatus> = {}): PayTRPaymentStatus {
  return serverStatus({
    amount_minor: 582000,
    lesson_amount_minor: 432000,
    coaching_amount_minor: 150000,
    coaching_subtotal_minor: 150000,
    ...overrides,
  });
}

function decide(overrides: Partial<PayTREntryInput> = {}) {
  return payTREntryDecision({
    paytrEnabled: true,
    purchaseId: "purchase-1",
    purchaseStatus: "pending",
    totalPrice: 4320,
    acceptance: NO_ACCEPTANCE,
    paymentStatus: serverStatus(),
    hasKnownAttempt: false,
    ...overrides,
  });
}

function action(overrides: Partial<PayTREntryInput> = {}) {
  return decide(overrides).action;
}

describe("payTREntryDecision — server says the purchase can be paid", () => {
  it("offers payment on a package the tutor does not have to answer", () => {
    assert.equal(action(), "pay");
  });

  it("offers payment once the tutor has accepted", () => {
    assert.equal(action({ acceptance: acceptance("accepted") }), "pay");
  });

  it("pays a lesson-only package even without the amount breakdown", () => {
    // lesson_amount_minor / coaching_amount_minor are optional on the wire;
    // the payment screen only checks them for coaching, and so do we.
    const { lesson_amount_minor, coaching_amount_minor, ...bare } = serverStatus();
    void lesson_amount_minor;
    void coaching_amount_minor;
    for (const lessonOnly of [NO_ACCEPTANCE, acceptance("accepted", false)]) {
      assert.equal(
        action({ acceptance: lessonOnly, paymentStatus: bare as PayTRPaymentStatus }),
        "pay"
      );
      assert.equal(
        action({
          acceptance: lessonOnly,
          paymentStatus: bare as PayTRPaymentStatus,
          totalPrice: undefined,
        }),
        "pay"
      );
    }
  });
});

describe("payTREntryDecision — an order exists or may exist", () => {
  it("shows the same open order to a tab that never started it", () => {
    // No breadcrumb here: only the server knows another tab opened an order.
    const decision = decide({
      acceptance: acceptance("accepted"),
      paymentStatus: serverStatus({
        has_active_attempt: true,
        can_start_checkout: false,
        checkout_blocked_reason: "checkout_in_progress",
        latest_attempt: {
          merchant_oid: "HOCAM-OID-1",
          status: "token_issued",
          created_at: "2026-10-06T09:00:00Z",
          completed_at: null,
        },
      }),
    });
    assert.deepEqual(decision, { action: "check_status" });
  });

  it("never offers a second charge while an earlier order is unresolved", () => {
    const unresolved: Partial<PayTRPaymentStatus>[] = [
      { requires_reconciliation: true, can_start_checkout: false, checkout_blocked_reason: "payment_unverified" },
      { manual_review: true, requires_reconciliation: true, can_start_checkout: false, checkout_blocked_reason: "payment_under_review" },
      {
        latest_attempt: {
          merchant_oid: "HOCAM-OID-1",
          status: "failed",
          created_at: "2026-10-06T09:00:00Z",
          completed_at: "2026-10-06T09:05:00Z",
        },
        can_retry_checkout: true,
      },
    ];
    for (const overrides of unresolved) {
      assert.equal(action({ paymentStatus: serverStatus(overrides) }), "check_status");
    }
  });

  it("sends a resumable order to the status check, never to 'pay'", () => {
    assert.equal(
      action({
        paymentStatus: serverStatus({ can_resume_checkout: true, has_active_attempt: true }),
      }),
      "check_status"
    );
    // Even if the server's answer contradicts itself.
    assert.equal(
      action({
        paymentStatus: serverStatus({ can_resume_checkout: true, has_active_attempt: false }),
      }),
      "check_status"
    );
  });

  it("lets this tab's breadcrumb narrow a server 'go ahead' to a status check", () => {
    assert.equal(action({ hasKnownAttempt: true }), "check_status");
  });
});

describe("payTREntryDecision — reading the answers", () => {
  it("offers nothing while either answer is loading", () => {
    assert.equal(action({ paymentStatus: undefined }), "status_loading");
    assert.equal(action({ acceptance: undefined }), "status_loading");
    assert.equal(
      action({ paymentStatus: undefined, hasKnownAttempt: true }),
      "status_loading"
    );
  });

  it("reports a failed read instead of guessing", () => {
    assert.equal(action({ paymentStatus: null }), "status_error");
    assert.equal(action({ acceptance: null }), "status_error");
    assert.equal(action({ paymentStatus: null, hasKnownAttempt: true }), "status_error");
  });

  it("refuses an answer about a different purchase", () => {
    assert.equal(
      action({ paymentStatus: serverStatus({ purchase_id: "purchase-2" }) }),
      "status_error"
    );
  });

  it("offers nothing once the server has settled the purchase", () => {
    for (const purchase_status of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(action({ paymentStatus: serverStatus({ purchase_status }) }), "none");
    }
  });

  it("offers nothing on a purchase the list already shows as settled", () => {
    for (const purchaseStatus of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(action({ purchaseStatus }), "none", purchaseStatus);
      assert.equal(action({ purchaseStatus, hasKnownAttempt: true }), "none", purchaseStatus);
    }
  });
});

describe("payTREntryDecision — the tutor has not said yes", () => {
  it("offers nothing, and explains nothing the acceptance copy already explains", () => {
    const blocked = serverStatus({
      can_start_checkout: false,
      checkout_blocked_reason: "acceptance_required",
    });
    for (const status of ["pending", "rejected", "expired", "withdrawn", "cancelled"] as const) {
      assert.deepEqual(
        decide({ acceptance: acceptance(status), paymentStatus: blocked }),
        { action: "none" },
        status
      );
    }
  });
});

describe("payTREntryDecision — refusals say why", () => {
  it("names a closed checkout", () => {
    assert.deepEqual(
      decide({
        paymentStatus: serverStatus({
          checkout_enabled: false,
          can_start_checkout: false,
          checkout_blocked_reason: "checkout_disabled",
        }),
      }),
      { action: "none", blockedReason: "checkout_disabled" }
    );
  });

  it("maps every server refusal it knows, and still refuses the ones it does not", () => {
    const cases: [string, string][] = [
      ["coaching_not_supported", "coaching_not_supported"],
      ["coaching_price_unverified", "coaching_price_unverified"],
      ["not_payable", "unavailable"],
      // Our acceptance read says yes, the server says no: still a refusal.
      ["acceptance_required", "unavailable"],
      ["something_new", "unavailable"],
      ["", "unavailable"],
    ];
    for (const [code, reason] of cases) {
      assert.deepEqual(
        decide({
          acceptance: acceptance("accepted"),
          paymentStatus: serverStatus({
            can_start_checkout: false,
            checkout_blocked_reason: code,
          }),
        }),
        { action: "none", blockedReason: reason },
        code
      );
    }
  });

  it("has a short Turkish line for every reason", () => {
    for (const reason of [
      "checkout_disabled",
      "coaching_not_supported",
      "coaching_price_unverified",
      "amount_unverified",
      "unavailable",
    ] as const) {
      const message = payTREntryBlockedMessage(reason);
      assert.ok(message.length > 0 && message.length < 80, reason);
      assert.doesNotMatch(message, /abi|abla/i);
    }
  });
});

describe("payTREntryDecision — coaching bundles", () => {
  it("offers payment when the server opened coaching and the combined amount adds up", () => {
    assert.equal(
      action({ acceptance: acceptance("accepted", true), paymentStatus: coachingStatus() }),
      "pay"
    );
  });

  it("accepts a fully discounted coaching part as long as the sum holds", () => {
    assert.equal(
      action({
        acceptance: acceptance("accepted", true),
        paymentStatus: coachingStatus({
          amount_minor: 432000,
          coaching_amount_minor: 0,
          coaching_discount_minor: 150000,
        }),
      }),
      "pay"
    );
  });

  it("refuses, with a reason, a bundle whose amounts do not add up", () => {
    const mismatches: Partial<PayTRPaymentStatus>[] = [
      { amount_minor: 432000 },
      { lesson_amount_minor: 400000 },
      { coaching_amount_minor: undefined },
      { currency: "USD" },
    ];
    for (const overrides of mismatches) {
      assert.deepEqual(
        decide({
          acceptance: acceptance("accepted", true),
          paymentStatus: coachingStatus(overrides),
        }),
        { action: "none", blockedReason: "amount_unverified" },
        JSON.stringify(overrides)
      );
    }
    assert.deepEqual(
      decide({
        acceptance: acceptance("accepted", true),
        paymentStatus: coachingStatus(),
        totalPrice: undefined,
      }),
      { action: "none", blockedReason: "amount_unverified" }
    );
  });

  it("leaves coaching closed when the backend has not opened it", () => {
    assert.deepEqual(
      decide({
        acceptance: acceptance("accepted", true),
        paymentStatus: coachingStatus({
          can_start_checkout: false,
          checkout_blocked_reason: "coaching_not_supported",
          coaching_amount_minor: 0,
          amount_minor: 432000,
        }),
      }),
      { action: "none", blockedReason: "coaching_not_supported" }
    );
  });
});

describe("payTREntryDecision — flag off", () => {
  it("offers nothing, whatever the server says", () => {
    assert.equal(action({ paytrEnabled: false }), "none");
    assert.equal(action({ paytrEnabled: false, paymentStatus: undefined }), "none");
    assert.equal(action({ paytrEnabled: false, paymentStatus: null }), "none");
  });

  it("still lets a known attempt be checked", () => {
    assert.equal(
      action({ paytrEnabled: false, hasKnownAttempt: true, paymentStatus: undefined }),
      "check_status"
    );
  });
});

describe("payTRPostCreateTarget", () => {
  const purchase = { id: "purchase-1", status: "pending" as const, total_price: 4320 };

  function target(overrides: Partial<Parameters<typeof payTRPostCreateTarget>[0]> = {}) {
    return payTRPostCreateTarget({
      paytrEnabled: true,
      purchase,
      acceptance: NO_ACCEPTANCE,
      paymentStatus: serverStatus(),
      ...overrides,
    });
  }

  it("sends a payable new purchase straight to payment", () => {
    assert.deepEqual(target(), { target: "pay" });
    assert.deepEqual(target({ acceptance: acceptance("accepted") }), { target: "pay" });
    assert.deepEqual(
      target({ acceptance: acceptance("accepted", true), paymentStatus: coachingStatus() }),
      { target: "pay" }
    );
  });

  it("waits for both answers before deciding", () => {
    assert.deepEqual(target({ paymentStatus: undefined }), { target: "checking" });
    assert.deepEqual(target({ acceptance: undefined }), { target: "checking" });
  });

  it("reports an unreadable status instead of acting on it", () => {
    // The caller must never turn this into a second package POST.
    assert.deepEqual(target({ paymentStatus: null }), { target: "status_error" });
    assert.deepEqual(target({ acceptance: null }), { target: "status_error" });
  });

  it("keeps the request screen when the tutor still has to answer", () => {
    assert.deepEqual(
      target({
        acceptance: acceptance("pending"),
        paymentStatus: serverStatus({
          can_start_checkout: false,
          checkout_blocked_reason: "acceptance_required",
        }),
      }),
      { target: "stay" }
    );
  });

  it("keeps the request screen, with the reason, when payment is refused", () => {
    assert.deepEqual(
      target({
        paymentStatus: serverStatus({
          checkout_enabled: false,
          can_start_checkout: false,
          checkout_blocked_reason: "checkout_disabled",
        }),
      }),
      { target: "blocked", blockedReason: "checkout_disabled" }
    );
  });

  it("does not jump into payment when an order already exists", () => {
    assert.deepEqual(
      target({ paymentStatus: serverStatus({ has_active_attempt: true }) }),
      { target: "stay" }
    );
  });

  it("keeps the request screen while payments are switched off", () => {
    assert.deepEqual(target({ paytrEnabled: false }), { target: "stay" });
    assert.deepEqual(
      target({ paytrEnabled: false, paymentStatus: undefined, acceptance: undefined }),
      { target: "stay" }
    );
  });
});

describe("payTRShowsUnpaidCancel", () => {
  function shows(overrides: Partial<Parameters<typeof payTRShowsUnpaidCancel>[0]> = {}) {
    return payTRShowsUnpaidCancel({
      paytrEnabled: true,
      canCancelUnpaid: true,
      hasKnownAttempt: false,
      purchaseId: "purchase-1",
      purchaseStatus: "pending",
      paymentStatus: serverStatus(),
      ...overrides,
    });
  }

  it("offers cancel when both answers agree nothing is in flight", () => {
    assert.equal(shows(), true);
    assert.equal(shows({ canCancelUnpaid: false }), false);
  });

  it("hides cancel while an order is open, whatever can_cancel_unpaid says", () => {
    for (const overrides of [
      { has_active_attempt: true },
      { can_resume_checkout: true },
      { requires_reconciliation: true },
      { manual_review: true },
      { can_cancel_unpaid: false },
    ] as Partial<PayTRPaymentStatus>[]) {
      assert.equal(
        shows({ paymentStatus: serverStatus({ can_cancel_unpaid: true, ...overrides }) }),
        false,
        JSON.stringify(overrides)
      );
    }
  });

  it("hides cancel while the payment status is loading or unreadable", () => {
    assert.equal(shows({ paymentStatus: undefined }), false);
    assert.equal(shows({ paymentStatus: null }), false);
    assert.equal(
      shows({ paymentStatus: serverStatus({ purchase_id: "purchase-2" }) }),
      false
    );
  });

  it("withdraws the offer while this tab knows about an attempt", () => {
    assert.equal(shows({ hasKnownAttempt: true }), false);
  });

  it("never cancels an unpaid purchase that is no longer unpaid", () => {
    for (const purchaseStatus of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(shows({ purchaseStatus }), false, purchaseStatus);
      assert.equal(shows({ purchaseStatus, paytrEnabled: false }), false, purchaseStatus);
    }
    assert.equal(
      shows({ paymentStatus: serverStatus({ purchase_status: "paid" }) }),
      false
    );
  });

  it("follows the acceptance answer alone while the flag is off", () => {
    assert.equal(shows({ paytrEnabled: false, paymentStatus: undefined }), true);
    assert.equal(
      shows({ paytrEnabled: false, paymentStatus: undefined, canCancelUnpaid: false }),
      false
    );
    assert.equal(
      shows({ paytrEnabled: false, paymentStatus: undefined, hasKnownAttempt: true }),
      false
    );
  });
});

describe("payTRServerAllowsUnpaidCancel", () => {
  it("is the server half of the cancel rule, usable on a fresh read", () => {
    assert.equal(payTRServerAllowsUnpaidCancel("purchase-1", serverStatus()), true);
    assert.equal(
      payTRServerAllowsUnpaidCancel("purchase-1", serverStatus({ has_active_attempt: true })),
      false
    );
    assert.equal(payTRServerAllowsUnpaidCancel("purchase-1", null), false);
  });
});

describe("payTRPayHref", () => {
  it("points at the purchase's own payment route", () => {
    assert.equal(payTRPayHref("purchase-1"), "/package-purchases/purchase-1/pay");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";

import {
  payTRPayHref,
  payTRPostCreateTarget,
  payTRPurchaseAction,
  payTRShowsUnpaidCancel,
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

function action(overrides: Partial<Parameters<typeof payTRPurchaseAction>[0]> = {}) {
  return payTRPurchaseAction({
    paytrEnabled: true,
    purchaseStatus: "pending",
    acceptance: NO_ACCEPTANCE,
    hasKnownAttempt: false,
    ...overrides,
  });
}

describe("payTRPurchaseAction", () => {
  it("offers payment on a pending purchase the tutor does not have to answer", () => {
    assert.equal(action(), "pay");
  });

  it("offers payment once the tutor has accepted", () => {
    assert.equal(action({ acceptance: acceptance("accepted") }), "pay");
  });

  it("offers nothing while the tutor is still deciding, or after they ended it", () => {
    assert.equal(action({ acceptance: acceptance("pending") }), "none");
    for (const status of ["rejected", "expired", "withdrawn", "cancelled"] as const) {
      assert.equal(action({ acceptance: acceptance(status) }), "none", status);
    }
  });

  it("asks about a known attempt instead of offering to pay again", () => {
    assert.equal(action({ hasKnownAttempt: true }), "check_status");
    assert.equal(
      action({ hasKnownAttempt: true, acceptance: acceptance("accepted") }),
      "check_status"
    );
  });

  it("offers nothing on a settled purchase", () => {
    for (const status of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(action({ purchaseStatus: status }), "none", status);
      assert.equal(
        action({ purchaseStatus: status, hasKnownAttempt: true }),
        "none",
        status
      );
    }
  });

  it("holds back a coaching package until its collection contract is verified", () => {
    assert.equal(action({ acceptance: acceptance("accepted", true) }), "none");
  });

  it("offers nothing it cannot prove, and nothing while the flag is off", () => {
    assert.equal(action({ acceptance: undefined }), "none");
    assert.equal(action({ acceptance: null }), "none");
    assert.equal(action({ paytrEnabled: false }), "none");
  });

  it("still lets a known attempt be checked while the flag is off", () => {
    assert.equal(
      action({ paytrEnabled: false, hasKnownAttempt: true }),
      "check_status"
    );
  });
});

describe("payTRPostCreateTarget", () => {
  it("sends a payable new purchase straight to payment", () => {
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: true, acceptance: NO_ACCEPTANCE }),
      "pay"
    );
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: true, acceptance: acceptance("accepted") }),
      "pay"
    );
  });

  it("keeps the request screen when the tutor still has to answer", () => {
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: true, acceptance: acceptance("pending") }),
      "stay"
    );
  });

  it("keeps the request screen when the acceptance answer could not be read", () => {
    // The caller must never turn this into a second package POST.
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: true, acceptance: null }),
      "stay"
    );
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: true, acceptance: undefined }),
      "stay"
    );
  });

  it("keeps the request screen while payments are switched off", () => {
    assert.equal(
      payTRPostCreateTarget({ paytrEnabled: false, acceptance: NO_ACCEPTANCE }),
      "stay"
    );
  });
});

describe("payTRShowsUnpaidCancel", () => {
  it("follows the server's own flag when nothing is in flight", () => {
    assert.equal(
      payTRShowsUnpaidCancel({
        canCancelUnpaid: true,
        hasKnownAttempt: false,
        purchaseStatus: "pending",
      }),
      true
    );
    assert.equal(
      payTRShowsUnpaidCancel({
        canCancelUnpaid: false,
        hasKnownAttempt: false,
        purchaseStatus: "pending",
      }),
      false
    );
  });

  it("withdraws the offer while this tab knows about an attempt", () => {
    assert.equal(
      payTRShowsUnpaidCancel({
        canCancelUnpaid: true,
        hasKnownAttempt: true,
        purchaseStatus: "pending",
      }),
      false
    );
  });

  it("never cancels an unpaid purchase that is no longer unpaid", () => {
    // A stale can_cancel_unpaid must not survive the purchase settling.
    for (const purchaseStatus of ["paid", "cancelled", "refunded"] as const) {
      assert.equal(
        payTRShowsUnpaidCancel({
          canCancelUnpaid: true,
          hasKnownAttempt: false,
          purchaseStatus,
        }),
        false,
        purchaseStatus
      );
    }
  });
});

describe("payTRPayHref", () => {
  it("points at the purchase's own payment route", () => {
    assert.equal(payTRPayHref("purchase-1"), "/package-purchases/purchase-1/pay");
  });
});

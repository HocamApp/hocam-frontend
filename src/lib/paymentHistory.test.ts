import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PaymentLedgerEntry } from "@/types";
import {
  creditActivityLabel,
  isMonetaryPaymentEntry,
  isPackageCreditActivity,
} from "./paymentHistory";

function ledgerEntry(
  overrides: Partial<PaymentLedgerEntry>
): PaymentLedgerEntry {
  return {
    id: "entry-1",
    entry_type: "lesson_credit_used",
    amount: 0,
    credit_delta: -1,
    description: "",
    created_at: "2026-07-24T10:00:00Z",
    package_purchase: "package-1",
    booking: "booking-1",
    ...overrides,
  };
}

describe("payment history presentation", () => {
  it("keeps paid purchases and processed refunds in monetary history", () => {
    assert.equal(
      isMonetaryPaymentEntry(
        ledgerEntry({ entry_type: "package_purchase_paid", amount: 6381 })
      ),
      true
    );
    assert.equal(
      isMonetaryPaymentEntry(
        ledgerEntry({ entry_type: "package_refund_processed", amount: 1000 })
      ),
      true
    );
  });

  it("removes package requests and zero-value credit movements from monetary history", () => {
    assert.equal(
      isMonetaryPaymentEntry(
        ledgerEntry({ entry_type: "package_purchase_created", amount: 6381 })
      ),
      false
    );
    assert.equal(isMonetaryPaymentEntry(ledgerEntry({})), false);
  });

  it("associates only credit-changing activity with its own package", () => {
    assert.equal(isPackageCreditActivity(ledgerEntry({}), "package-1"), true);
    assert.equal(isPackageCreditActivity(ledgerEntry({}), "package-2"), false);
    assert.equal(
      isPackageCreditActivity(ledgerEntry({ credit_delta: 0 }), "package-1"),
      false
    );
  });

  it("uses clear Turkish credit activity labels", () => {
    assert.equal(creditActivityLabel(ledgerEntry({})), "1 ders hakkı kullanıldı");
    assert.equal(
      creditActivityLabel(
        ledgerEntry({
          entry_type: "lesson_credit_refunded",
          credit_delta: 2,
        })
      ),
      "2 ders hakkı iade edildi"
    );
  });
});

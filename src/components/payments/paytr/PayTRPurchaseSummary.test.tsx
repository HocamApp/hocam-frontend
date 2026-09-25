import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

import { PayTRPurchaseSummary } from "./PayTRPurchaseSummary";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

afterEach(() => cleanup());

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

function combinedStatus(): PayTRPaymentStatus {
  return {
    purchase_id: "purchase-1", purchase_status: "pending", paid_at: null,
    provider: "", provider_reference: "", amount_minor: 520025,
    lesson_amount_minor: 420000, coaching_amount_minor: 100025,
    coaching_subtotal_minor: 110000, coaching_discount_minor: 9975,
    currency: "TL", checkout_enabled: true, has_active_attempt: false,
    manual_review: false, requires_reconciliation: false,
    can_start_checkout: true, can_resume_checkout: false,
    can_retry_checkout: false, can_cancel_unpaid: true,
    checkout_blocked_reason: "", latest_attempt: null,
  };
}

describe("PayTRPurchaseSummary", () => {
  it("shows the tutor, the package and the total the server stored", () => {
    render(<PayTRPurchaseSummary purchase={purchase()} />);

    assert.ok(screen.getByText("Deniz Kaya"));
    assert.ok(screen.getByText("Haftada 3 ders · 30 gün"));
    assert.ok(screen.getByText("4.200 ₺"));
    assert.ok(screen.getByText("Toplam ödeme"));
  });

  it("renders a server total that does not match the rows, rather than its own sum", () => {
    render(<PayTRPurchaseSummary purchase={purchase({ total_price: 3900 })} />);

    assert.ok(screen.getByText("3.900 ₺"));
    assert.equal(screen.queryByText("4.200 ₺"), null);
  });

  it("leaves out a discount row the purchase does not have", () => {
    render(
      <PayTRPurchaseSummary
        purchase={purchase({ discount_amount: 0, promo_discount_amount: 0 })}
      />
    );

    assert.equal(screen.queryByText("Paket indirimi"), null);
    assert.equal(screen.queryByText("Promosyon indirimi"), null);
    assert.ok(screen.getByText("Ara toplam"));
  });

  it("says the payment happens once", () => {
    render(<PayTRPurchaseSummary purchase={purchase()} />);

    assert.ok(screen.getByText("Tek seferlik ödeme. Otomatik yenilenmez."));
  });

  it("refuses to price a purchase whose amounts it cannot trust", () => {
    render(
      <PayTRPurchaseSummary
        purchase={purchase({ total_price: undefined as unknown as number })}
      />
    );

    assert.ok(screen.getByText("Paket tutarı görüntülenemiyor."));
    assert.equal(screen.queryByText("0 ₺"), null);
    assert.equal(screen.queryByText("Toplam ödeme"), null);
  });

  it("shows a skeleton, not a price, while the purchase is loading", () => {
    const { container } = render(<PayTRPurchaseSummary purchase={undefined} />);

    assert.equal(container.textContent?.includes("₺"), false);
    assert.ok(container.querySelector("[aria-hidden='true']"));
  });

  it("keeps the total open on a phone and folds only the breakdown", () => {
    render(<PayTRPurchaseSummary purchase={purchase()} />);

    const disclosure = screen.getByRole("button", { name: /Fiyat ayrıntıları/ });
    const controls = disclosure.getAttribute("aria-controls");

    assert.equal(disclosure.getAttribute("aria-expanded"), "false");
    assert.ok(controls && document.getElementById(controls));
    assert.ok(screen.getByText("4.200 ₺"));

    fireEvent.click(disclosure);
    assert.equal(disclosure.getAttribute("aria-expanded"), "true");
  });

  it("never repeats the customer's contact details back at them", () => {
    const { container } = render(
      <PayTRPurchaseSummary purchase={purchase()} />
    );

    assert.doesNotMatch(container.textContent ?? "", /adres|telefon/i);
  });

  it("shows the combined provider total with exact kuruş", () => {
    render(<PayTRPurchaseSummary
      purchase={purchase()} paymentStatus={combinedStatus()} includesCoaching
    />);
    assert.ok(screen.getByText("5.200,25 ₺"));
    assert.ok(screen.getByText("Koçluk paketi dahil"));
    assert.ok(screen.getByText("Koçluk ara toplam"));
    assert.equal(screen.queryByText("4.200 ₺"), null);
  });

  it("refuses a coaching price that differs from the provider order", () => {
    render(<PayTRPurchaseSummary
      purchase={purchase()}
      paymentStatus={{ ...combinedStatus(), amount_minor: 520024 }}
      includesCoaching
    />);
    assert.ok(screen.getByText("Paket tutarı görüntülenemiyor."));
    assert.equal(screen.queryByText("5.200,24 ₺"), null);
  });
});

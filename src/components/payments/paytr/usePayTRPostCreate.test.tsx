import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * The checkout screen right after a package is created, with PayTR on. It
 * may move to payment only on proof, and nothing that goes wrong on the way
 * may create a second package.
 */

const getCalls: string[] = [];
const postCalls: string[] = [];
const pushes: string[] = [];
let invalidatedAtPush: boolean[] = [];
let currentClient: QueryClient | null = null;

let acceptanceResponse: PurchaseAcceptanceState;
let paymentStatusAnswer: () => Promise<PayTRPaymentStatus>;

const purchase: PackagePurchase = {
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
  promo_discount_amount: 0,
  total_price: 4320,
  created_at: "2026-10-06T09:00:00Z",
  paid_at: null,
  promotion_code: null,
};

function payableStatus(overrides: Partial<PayTRPaymentStatus> = {}): PayTRPaymentStatus {
  return {
    purchase_id: "purchase-1",
    purchase_status: "pending",
    paid_at: null,
    provider: "",
    provider_reference: "",
    amount_minor: 432000,
    lesson_amount_minor: 432000,
    coaching_amount_minor: 0,
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

function answer(status: PayTRPaymentStatus) {
  paymentStatusAnswer = async () => status;
}

let usePayTRPostCreate: typeof import("./usePayTRPostCreate").usePayTRPostCreate;
let CheckoutPurchaseSuccess: typeof import("@/components/checkout/CheckoutSuccess").CheckoutPurchaseSuccess;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => {
          pushes.push(href);
          invalidatedAtPush.push(
            Boolean(
              currentClient?.getQueryState(["paytr-payment-status", "purchase-1"])
                ?.isInvalidated
            )
          );
        },
        replace: () => {},
        back: () => {},
      }),
      usePathname: () => "/tutors/tutor-1/checkout",
      useSearchParams: () => new URLSearchParams(),
    },
  });
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        getCalls.push(url);
        if (url.includes("payment-status")) return { data: await paymentStatusAnswer() };
        return { data: acceptanceResponse };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ usePayTRPostCreate } = await import("./usePayTRPostCreate"));
  ({ CheckoutPurchaseSuccess } = await import("@/components/checkout/CheckoutSuccess"));
});

function CreatedPurchaseScreen() {
  const postCreate = usePayTRPostCreate(purchase);
  return (
    <CheckoutPurchaseSuccess
      purchase={purchase}
      tutorId="tutor-1"
      paymentCheck={postCreate.check}
      paymentBlockedReason={postCreate.blockedReason}
      onRetryPaymentCheck={postCreate.retry}
    />
  );
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  currentClient = client;
  const view = render(
    <QueryClientProvider client={client}>
      <CreatedPurchaseScreen />
    </QueryClientProvider>
  );
  return { client, view };
}

const statusReads = () => getCalls.filter((url) => url.includes("payment-status")).length;

beforeEach(() => {
  acceptanceResponse = { requires_tutor_acceptance: false, acceptance: null };
  answer(payableStatus());
  getCalls.length = 0;
  postCalls.length = 0;
  pushes.length = 0;
  invalidatedAtPush = [];
});

afterEach(() => {
  cleanup();
  currentClient?.clear();
  currentClient = null;
});

describe("usePayTRPostCreate with PayTR on", () => {
  it("goes to payment once, after marking the shared status stale", async () => {
    const { client, view } = renderScreen();

    await waitFor(() => assert.deepEqual(pushes, ["/package-purchases/purchase-1/pay"]));
    assert.deepEqual(invalidatedAtPush, [true]);

    // Re-rendering the same created purchase never redirects twice.
    view.rerender(
      <QueryClientProvider client={client}>
        <CreatedPurchaseScreen />
      </QueryClientProvider>
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(pushes.length, 1);
    assert.deepEqual(postCalls, []);
  });

  it("stays, with a re-read and no POST, when the payment status cannot be read", async () => {
    paymentStatusAnswer = async () => {
      throw new Error("network");
    };
    renderScreen();

    await screen.findByText("Ödeme durumu alınamadı.");
    assert.deepEqual(pushes, []);
    assert.deepEqual(postCalls, [], "never a second package POST");

    const before = statusReads();
    answer(payableStatus());
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));

    await waitFor(() => assert.equal(statusReads(), before + 1));
    await waitFor(() => assert.deepEqual(pushes, ["/package-purchases/purchase-1/pay"]));
    assert.deepEqual(postCalls, []);
  });

  it("stays quietly while the tutor still has to answer", async () => {
    acceptanceResponse = {
      requires_tutor_acceptance: true,
      acceptance: {
        id: "acceptance-1",
        status: "pending",
        expires_at: "2099-10-07T09:00:00Z",
        responded_at: null,
        includes_coaching: true,
      },
    };
    answer(
      payableStatus({ can_start_checkout: false, checkout_blocked_reason: "acceptance_required" })
    );
    const { client } = renderScreen();

    await waitFor(() =>
      assert.equal(client.getQueryState(["paytr-payment-status", "purchase-1"])?.status, "success")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(pushes, []);
    assert.equal(screen.queryByRole("status"), null);
    assert.equal(screen.queryByRole("button", { name: "Yenile" }), null);
  });

  it("stays and says why when the server refuses payment", async () => {
    answer(
      payableStatus({
        checkout_enabled: false,
        can_start_checkout: false,
        checkout_blocked_reason: "checkout_disabled",
      })
    );
    renderScreen();

    await screen.findByText("Online ödeme şu anda kapalı.");
    assert.deepEqual(pushes, []);
  });

  it("does not jump into payment when an order already exists", async () => {
    answer(payableStatus({ has_active_attempt: true, can_start_checkout: false }));
    const { client } = renderScreen();

    await waitFor(() =>
      assert.equal(client.getQueryState(["paytr-payment-status", "purchase-1"])?.status, "success")
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.deepEqual(pushes, []);
  });

  it("announces the check while it runs, without any action", async () => {
    let release: () => void = () => {};
    paymentStatusAnswer = () =>
      new Promise((resolve) => {
        release = () => resolve(payableStatus());
      });
    renderScreen();

    await screen.findByText("Ödeme durumu kontrol ediliyor");
    assert.equal(screen.queryByRole("button", { name: "Yenile" }), null);
    assert.deepEqual(pushes, []);

    release();
    await waitFor(() => assert.equal(pushes.length, 1));
  });
});

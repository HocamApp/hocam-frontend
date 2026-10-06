import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * FE-1 acceptance criteria for the package card with PayTR on: what the card
 * offers is decided by the server's payment status, not by this tab's memory.
 */

const getCalls: string[] = [];
const postCalls: string[] = [];

let acceptanceResponse: PurchaseAcceptanceState;
let paymentStatusAnswer: () => Promise<PayTRPaymentStatus>;
let releaseHeld: (() => void) | null = null;

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

let PackageRequestStatus: typeof import("./PackageRequestStatus").PackageRequestStatus;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "ada@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
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

  ({ PackageRequestStatus } = await import("./PackageRequestStatus"));
});

const clients: QueryClient[] = [];

function renderStatus(totalPrice = 4320) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <PackageRequestStatus
        purchaseId="purchase-1"
        purchaseStatus="pending"
        totalPrice={totalPrice}
      />
    </QueryClientProvider>
  );
  return client;
}

function accepted(includesCoaching = false): PurchaseAcceptanceState {
  return {
    requires_tutor_acceptance: true,
    acceptance: {
      id: "acceptance-1",
      status: "accepted",
      expires_at: "2099-09-19T09:00:00Z",
      responded_at: "2026-09-17T10:00:00Z",
      includes_coaching: includesCoaching,
    },
    can_withdraw: false,
    // The acceptance answer on its own still says cancel is fine.
    can_cancel_unpaid: true,
  };
}

const PAY = { name: "Ödemeye devam et" };
const CHECK = { name: "Ödeme durumunu kontrol et" };
const CANCEL = { name: "Paketi iptal et" };

beforeEach(() => {
  acceptanceResponse = accepted();
  answer(payableStatus());
  getCalls.length = 0;
  postCalls.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  releaseHeld?.();
  releaseHeld = null;
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("PackageRequestStatus reads the server's payment status", () => {
  it("shows another tab's open order: a status check, never a second 'pay'", async () => {
    // Nothing in this tab's sessionStorage — only the server knows.
    answer(
      payableStatus({
        has_active_attempt: true,
        can_start_checkout: false,
        checkout_blocked_reason: "checkout_in_progress",
        latest_attempt: {
          merchant_oid: "HOCAM-OID-1",
          status: "token_issued",
          created_at: "2026-10-06T09:00:00Z",
          completed_at: null,
        },
      })
    );
    renderStatus();

    await screen.findByRole("link", CHECK);
    assert.equal(screen.queryByRole("link", PAY), null);
  });

  it("hides unpaid cancel while an order is open, even when the server says cancel", async () => {
    answer(payableStatus({ has_active_attempt: true, can_cancel_unpaid: true }));
    renderStatus();

    await screen.findByRole("link", CHECK);
    assert.equal(screen.queryByRole("button", CANCEL), null);
  });

  it("does not open a second charge while an earlier order is unverified", async () => {
    answer(
      payableStatus({
        requires_reconciliation: true,
        can_start_checkout: false,
        can_cancel_unpaid: false,
        checkout_blocked_reason: "payment_unverified",
      })
    );
    renderStatus();

    await screen.findByRole("link", CHECK);
    assert.equal(screen.queryByRole("link", PAY), null);
    assert.equal(screen.queryByRole("button", CANCEL), null);
  });

  it("sends a resumable order to the status check", async () => {
    answer(payableStatus({ has_active_attempt: true, can_resume_checkout: true }));
    renderStatus();

    await screen.findByRole("link", CHECK);
    assert.equal(screen.queryByRole("link", PAY), null);
  });

  it("shows no action at all while the payment status is loading", async () => {
    paymentStatusAnswer = () =>
      new Promise((resolve) => {
        releaseHeld = () => resolve(payableStatus());
      });
    renderStatus();

    // The acceptance answer is in and rendered; only payment status is missing.
    await screen.findByText("Öğretmenin kabul etti. Paket ödeme bekliyor.");
    screen.getByText("Ödeme durumu kontrol ediliyor");
    assert.deepEqual(screen.queryAllByRole("button"), []);
    assert.deepEqual(screen.queryAllByRole("link"), []);

    releaseHeld?.();
    await screen.findByRole("link", PAY);
  });

  it("offers only a re-read when the payment status cannot be read", async () => {
    paymentStatusAnswer = async () => {
      throw new Error("network");
    };
    renderStatus();

    await screen.findByText("Ödeme durumu alınamadı.");
    assert.equal(screen.queryByRole("link", PAY), null);
    assert.equal(screen.queryByRole("link", CHECK), null);
    assert.equal(screen.queryByRole("button", CANCEL), null);

    const statusReads = () => getCalls.filter((url) => url.includes("payment-status")).length;
    const before = statusReads();
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));
    await waitFor(() => assert.equal(statusReads(), before + 1));
    assert.deepEqual(postCalls, [], "a failed read never turns into a POST");
  });

  it("offers a coaching bundle whose combined amount adds up", async () => {
    acceptanceResponse = accepted(true);
    answer(
      payableStatus({
        amount_minor: 582000,
        lesson_amount_minor: 432000,
        coaching_amount_minor: 150000,
      })
    );
    renderStatus();

    await screen.findByRole("link", PAY);
    screen.getByText("Çalışma koçluğu dahil");
  });

  it("refuses a coaching bundle that does not add up, and says so", async () => {
    acceptanceResponse = accepted(true);
    answer(
      payableStatus({
        amount_minor: 432000,
        lesson_amount_minor: 432000,
        coaching_amount_minor: 150000,
      })
    );
    renderStatus();

    await screen.findByText("Ödeme tutarı doğrulanamadı. Daha sonra tekrar kontrol et.");
    assert.equal(screen.queryByRole("link", PAY), null);
  });

  it("pays a lesson-only package without the amount breakdown", async () => {
    const status = payableStatus();
    delete status.lesson_amount_minor;
    delete status.coaching_amount_minor;
    answer(status);
    renderStatus();

    await screen.findByRole("link", PAY);
  });

  it("names why a package the tutor accepted cannot be paid yet", async () => {
    answer(
      payableStatus({
        checkout_enabled: false,
        can_start_checkout: false,
        checkout_blocked_reason: "checkout_disabled",
      })
    );
    renderStatus();

    await screen.findByText("Online ödeme şu anda kapalı.");
    assert.equal(screen.queryByRole("link", PAY), null);
  });

  it("names a coaching package the backend has not opened for payment", async () => {
    acceptanceResponse = accepted(true);
    answer(
      payableStatus({
        can_start_checkout: false,
        checkout_blocked_reason: "coaching_not_supported",
      })
    );
    renderStatus();

    await screen.findByText("Koçluk içeren paketlerde online ödeme henüz açık değil.");
    assert.equal(screen.queryByRole("link", PAY), null);
  });
});

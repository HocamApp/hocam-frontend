import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * What the student does on the package card with PayTR on: cancel, re-read,
 * and leave for the payment screen. Each one has to respect the server's
 * payment status at the moment it happens, not the one the card first read.
 */

const STATUS_KEY = ["paytr-payment-status", "purchase-1"];

const getCalls: string[] = [];
const postCalls: string[] = [];

let paymentStatusAnswer: () => Promise<PayTRPaymentStatus>;

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

function failReads() {
  paymentStatusAnswer = async () => {
    throw new Error("network");
  };
}

const ACCEPTED: PurchaseAcceptanceState = {
  requires_tutor_acceptance: true,
  acceptance: {
    id: "acceptance-1",
    status: "accepted",
    expires_at: "2099-09-19T09:00:00Z",
    responded_at: "2026-09-17T10:00:00Z",
    includes_coaching: false,
  },
  can_withdraw: false,
  can_cancel_unpaid: true,
};

let PackageRequestStatus: typeof import("./PackageRequestStatus").PackageRequestStatus;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, onClick, ...props }: React.ComponentProps<"a">) => (
      <a
        href={String(href)}
        onClick={(event) => {
          onClick?.(event);
          event.preventDefault();
        }}
        {...props}
      >
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
        return { data: ACCEPTED };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: { status: "cancelled" } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ PackageRequestStatus } = await import("./PackageRequestStatus"));
});

const clients: QueryClient[] = [];

function renderStatus() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <PackageRequestStatus purchaseId="purchase-1" purchaseStatus="pending" totalPrice={4320} />
    </QueryClientProvider>
  );
  return client;
}

const statusReads = () => getCalls.filter((url) => url.includes("payment-status")).length;

async function confirmCancel() {
  fireEvent.click(await screen.findByRole("button", { name: "Paketi iptal et" }));
  // The confirmation step reuses the label on its destructive button.
  fireEvent.click(await screen.findByRole("button", { name: "Paketi iptal et" }));
}

beforeEach(() => {
  answer(payableStatus());
  getCalls.length = 0;
  postCalls.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  focusManager.setFocused(undefined);
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("PackageRequestStatus cancel with PayTR on", () => {
  it("re-reads the payment status and cancels once when nothing is in flight", async () => {
    renderStatus();
    await screen.findByRole("link", { name: "Ödemeye devam et" });
    const before = statusReads();

    await confirmCancel();

    await waitFor(() => assert.equal(postCalls.length, 1));
    assert.match(postCalls[0], /purchase-1\/cancel-unpaid\/$/);
    assert.ok(statusReads() > before, "the cancel waited for a fresh read");
  });

  it("does not cancel when the fresh read finds an order opened meanwhile", async () => {
    renderStatus();
    await screen.findByRole("link", { name: "Ödemeye devam et" });

    // Another tab opens an order after this card rendered.
    answer(payableStatus({ has_active_attempt: true, can_start_checkout: false }));
    await confirmCancel();

    await screen.findByText("Ödeme sürüyor, paket şu anda iptal edilemez.");
    assert.deepEqual(postCalls, []);
    await screen.findByRole("link", { name: "Ödeme durumunu kontrol et" });
    assert.equal(screen.queryByRole("button", { name: "Paketi iptal et" }), null);
  });

  it("does not cancel when the fresh read fails, and offers a re-read instead", async () => {
    renderStatus();
    await screen.findByRole("link", { name: "Ödemeye devam et" });

    failReads();
    await confirmCancel();

    await screen.findByText("Ödeme durumu alınamadı.");
    screen.getByRole("button", { name: "Yenile" });
    assert.deepEqual(postCalls, []);
    assert.equal(screen.queryByRole("button", { name: "Paketi iptal et" }), null);
    assert.equal(screen.queryByRole("link", { name: "Ödemeye devam et" }), null);
  });
});

describe("PackageRequestStatus re-read with PayTR on", () => {
  it("recovers from a failed focus refetch through 'Yenile'", async () => {
    const client = renderStatus();
    await screen.findByRole("link", { name: "Ödemeye devam et" });

    // The student comes back to this tab after the card's answer went stale,
    // and that refetch fails.
    client.setQueryData(STATUS_KEY, client.getQueryData(STATUS_KEY), {
      updatedAt: Date.now() - 60_000,
    });
    failReads();
    focusManager.setFocused(false);
    focusManager.setFocused(true);

    await screen.findByText("Ödeme durumu alınamadı.");
    assert.equal(screen.queryByRole("link", { name: "Ödemeye devam et" }), null);
    assert.equal(screen.queryByRole("button", { name: "Paketi iptal et" }), null);

    answer(payableStatus());
    fireEvent.click(screen.getByRole("button", { name: "Yenile" }));

    await screen.findByRole("link", { name: "Ödemeye devam et" });
    screen.getByRole("button", { name: "Paketi iptal et" });
    assert.equal(screen.queryByText("Ödeme durumu alınamadı."), null);
    assert.deepEqual(postCalls, []);
  });
});

describe("PackageRequestStatus hand-off to the payment screen", () => {
  it("marks the shared payment status stale so the payment screen reads its own", async () => {
    const client = renderStatus();
    const link = await screen.findByRole("link", { name: "Ödemeye devam et" });
    const before = statusReads();

    fireEvent.click(link);

    assert.equal(client.getQueryState(STATUS_KEY)?.isInvalidated, true);
    // Marking only: the card does not fetch again on its way out.
    assert.equal(statusReads(), before);
  });
});

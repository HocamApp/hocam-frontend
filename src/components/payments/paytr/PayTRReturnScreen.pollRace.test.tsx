import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * The return screen polls the purchase list and payment-status separately,
 * so after the callback marks the purchase paid either one can see it first.
 * When the list won, payment-status stopped polling on the list's "paid",
 * stayed "pending", and the mismatch held /odeme/basarili in "Paket bilgileri
 * alınamadı" for good — the payment page had the same race (its own PR).
 * These cases read the list first on purpose instead of leaving the order to
 * the poll timers. Proven against mocks only.
 */

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";
const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];

let purchaseStatus: PackagePurchase["status"] = "pending";
// Set to mark the purchase paid on the next list read: the callback lands
// after payment-status last answered "pending", so the list sees it first.
let payOnNextListRead = false;
let listSawPaidFirst = false;
let statusReadsSincePaid = 0;
let framed = false;
const topMoves: number[] = [];

function purchase(): PackagePurchase {
  if (payOnNextListRead) {
    payOnNextListRead = false;
    purchaseStatus = "paid";
    listSawPaidFirst = statusReadsSincePaid === 0;
  }
  return {
    id: "purchase-1",
    student: { id: "student-1", name: "Ada", surname: "Yılmaz" },
    tutor: { id: "tutor-1", name: "Deniz", surname: "Kaya" },
    plan: {
      id: "plan-1", name: "Haftada 3 ders · 30 gün", code: "w3-d30",
      lesson_count: 12, lesson_duration_minutes: 40, lessons_per_week: 3,
      duration_days: 30, discount_percent: 10,
    },
    status: purchaseStatus,
    total_credits: 12,
    remaining_credits: purchaseStatus === "paid" ? 12 : 0,
    unit_price: 400, subtotal_price: 4800, discount_amount: 480,
    promo_discount_amount: 0, total_price: 4320,
    created_at: "2026-09-17T09:00:00Z",
    paid_at: purchaseStatus === "paid" ? "2026-09-17T09:20:00Z" : null,
    promotion_code: null,
  };
}

function paymentStatus() {
  return {
    purchase_id: "purchase-1", purchase_status: purchaseStatus,
    paid_at: purchaseStatus === "paid" ? "2026-09-17T09:20:00Z" : null,
    provider: purchaseStatus === "paid" ? "paytr" : "", provider_reference: "",
    amount_minor: 432000, currency: "TL", checkout_enabled: true,
    has_active_attempt: false, manual_review: false, requires_reconciliation: false,
    can_start_checkout: false, can_resume_checkout: false, can_retry_checkout: false,
    can_cancel_unpaid: false, checkout_blocked_reason: "",
    latest_attempt: {
      merchant_oid: "HOCAM-OID-1", status: "token_issued",
      created_at: "2026-09-17T09:00:00Z", completed_at: null,
    },
  };
}

let SuccessRoute: React.ComponentType;
let appQueryClient: QueryClient;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: (href: string) => routerCalls.push(href),
        back: () => {},
      }),
      usePathname: () => "/odeme/basarili",
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
  mock.module("@/hooks/useAuth", {
    namedExports: {
      useAuth: () => ({
        user: { id: "student-1", role: "student", email: "ada@example.com" },
        isAuthenticated: true, isStudent: true, isTutor: false, isAdmin: false,
        isImpersonating: false, isLoading: false,
      }),
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        getCalls.push(url);
        if (url.includes("payment-status")) {
          if (purchaseStatus === "paid") statusReadsSincePaid += 1;
          return { data: paymentStatus() };
        }
        return { data: [purchase()] };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  // jsdom's window.top cannot be redefined; the frame check is its own
  // module (tested on fake windows in paytrFrameEscape.test.ts).
  mock.module("./paytrFrameEscape", {
    namedExports: {
      isFramed: () => framed,
      moveTopHere: () => {
        topMoves.push(1);
        return true;
      },
    },
  });

  ({ default: SuccessRoute } = await import("@/app/(checkout)/odeme/basarili/page"));
  ({ queryClient: appQueryClient } = await import("@/lib/queryClient"));
});

const clients: QueryClient[] = [];

function renderReturn(client = newClient()) {
  render(
    <QueryClientProvider client={client}>
      <SuccessRoute />
    </QueryClientProvider>
  );
  return client;
}

// The app's own defaults (five-minute staleTime, no focus refetch), so the
// freshness tests measure what the student's browser would actually do.
function newClient() {
  const app = appQueryClient.getDefaultOptions();
  const client = new QueryClient({
    defaultOptions: {
      queries: { ...app.queries, retry: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  return client;
}

function rememberAttempt(startedAt = Date.now()) {
  window.sessionStorage.setItem(
    RECOVERY_KEY,
    JSON.stringify({
      schemaVersion: 1, purchaseId: "purchase-1", merchantOid: "HOCAM-OID-1",
      tutorId: "tutor-1", startedAt,
    })
  );
}

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  payOnNextListRead = false;
  listSawPaidFirst = false;
  statusReadsSincePaid = 0;
  framed = false;
  topMoves.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  focusManager.setFocused(undefined);
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

async function listSeesPaymentFirst(client: QueryClient) {
  await screen.findByText("Ödeme sonucu doğrulanıyor");
  payOnNextListRead = true;
  // The list is read between two payment-status polls (here a refetch; with
  // real timers the two polls drift apart and do the same).
  await act(() => client.refetchQueries({ queryKey: ["package-purchases"] }));
}

describe("return screen when the purchase list sees the payment first", () => {
  it("still reaches the paid result and moves focus to it", async () => {
    rememberAttempt();
    const client = renderReturn();
    await listSeesPaymentFirst(client);

    const heading = await screen.findByRole(
      "heading",
      { name: "Ödemen onaylandı" },
      { timeout: 8000 }
    );
    assert.ok(listSawPaidFirst, "the list answered paid before payment-status did");
    assert.ok(statusReadsSincePaid > 0, "success waited for payment-status to say paid");
    assert.ok(heading.closest('[role="status"]'), "result is in a live region");
    await waitFor(() => assert.ok(document.activeElement === heading, "focus"));
  });

  it("does not show the load error while the two answers catch up", async () => {
    rememberAttempt();
    const client = renderReturn();
    await listSeesPaymentFirst(client);

    const seen = new Set<string>();
    await waitFor(
      () => {
        for (const h of screen.queryAllByRole("heading")) seen.add(h.textContent ?? "");
        assert.ok(screen.queryByRole("heading", { name: "Ödemen onaylandı" }));
      },
      { timeout: 8000, interval: 20 }
    );
    assert.ok(!seen.has("Paket bilgileri alınamadı"), Array.from(seen).join(" | "));
  });
});

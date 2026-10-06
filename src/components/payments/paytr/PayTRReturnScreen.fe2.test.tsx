import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * FE-2 on the PayTR return screen (/odeme/basarili, /odeme/basarisiz) with
 * the flag on. Everything here is proven against mocks only; where PayTR
 * actually lands the browser after 3D Secure is a staging question.
 */

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";
const STATUS_KEY = ["paytr-payment-status", "purchase-1"];
const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];

let purchaseStatus: PackagePurchase["status"] = "pending";
let framed = false;
const topMoves: number[] = [];

function purchase(): PackagePurchase {
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
        if (url.includes("payment-status")) return { data: paymentStatus() };
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

const statusReads = () => getCalls.filter((url) => url.includes("payment-status")).length;


beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  framed = false;
  topMoves.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  focusManager.setFocused(undefined);
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("return screen opened inside the PayTR frame", () => {
  it("moves itself to the top window and reads nothing in the frame", async () => {
    rememberAttempt();
    framed = true;
    renderReturn();

    await waitFor(() => assert.equal(topMoves.length, 1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(getCalls, [], "the top window does the reading, not the frame");
    assert.deepEqual(routerCalls, [], "no login redirect inside the frame");
    assert.deepEqual(postCalls, []);
  });

  it("stays put when it is the top window", async () => {
    rememberAttempt();
    renderReturn();
    await screen.findByText("Ödeme sonucu doğrulanıyor");
    assert.ok(statusReads() >= 1);
    assert.equal(topMoves.length, 0);
  });
});

describe("return screen freshness", () => {
  it("does not trust a cached status from before the redirect", async () => {
    rememberAttempt();
    const client = newClient();
    purchaseStatus = "pending";
    client.setQueryData(STATUS_KEY, paymentStatus(), { updatedAt: Date.now() - 60_000 });
    renderReturn(client);

    await waitFor(() => assert.ok(statusReads() >= 1, "re-read on arrival"));
  });

  it("re-reads when the student comes back to the tab", async () => {
    rememberAttempt(Date.now() - 60_000);
    renderReturn();
    await screen.findByText("Ödeme sonucu doğrulanıyor");
    const before = statusReads();

    focusManager.setFocused(false);
    focusManager.setFocused(true);

    await waitFor(() => assert.ok(statusReads() > before));
  });
});

describe("return screen waiting longer than the polling window", () => {
  it("says it is taking longer, without inviting a second payment", async () => {
    rememberAttempt(Date.now() - 60_000);
    renderReturn();

    const line = await screen.findByText(
      "Doğrulama beklenenden uzun sürüyor. Yeniden ödeme yapma; durumu kontrol et."
    );
    assert.ok(line.closest('[role="status"]'));
    assert.equal(screen.queryByRole("button", { name: "Yeniden ödeme başlat" }), null);
    assert.deepEqual(postCalls, []);
  });

  it("does not say so while the window is still open", async () => {
    rememberAttempt();
    renderReturn();
    await screen.findByText("Ödeme sonucu doğrulanıyor");
    assert.equal(screen.queryByText(/beklenenden uzun sürüyor/), null);
  });
});

describe("return screen without a breadcrumb", () => {
  it("points to Paketlerim to check the payment, with one link", async () => {
    renderReturn();
    const link = await screen.findByRole("link", {
      name: "Paketlerim'de ödeme durumunu kontrol et",
    });
    assert.equal(link.getAttribute("href"), "/profile/payments");
    assert.equal(screen.queryByRole("link", { name: "Paketlerime git" }), null);
    assert.equal(screen.getAllByRole("link", { name: /Paketlerim/ }).filter(
      (el) => el.closest("main")
    ).length, 1);
  });
});

describe("return screen accessibility", () => {
  it("announces the result and moves focus to it once it arrives", async () => {
    purchaseStatus = "paid";
    rememberAttempt();
    renderReturn();

    const heading = await screen.findByRole("heading", { name: "Ödemen onaylandı" });
    assert.ok(heading.closest('[role="status"]'), "result is in a live region");
    await waitFor(() => assert.ok(document.activeElement === heading, "focus"));
  });
});

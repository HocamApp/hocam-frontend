import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";

import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * The purchase list and payment-status both poll while the frame is open, so
 * after the callback marks the purchase paid either one can see it first.
 * When the list won, payment-status stopped polling on the list's "paid",
 * stayed "pending", and the mismatch held the page in "Paket bilgileri
 * alınamadı" for good (page.fe2Focus.test.tsx hit it in CI when the two poll
 * timers drifted apart). These cases put the list first on purpose instead of
 * leaving the order to timers. Its own file for the same reason as
 * page.fe2Focus.test.tsx.
 */

const PAY_PATH = "/package-purchases/purchase-1/pay";
const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];

let purchaseStatus: PackagePurchase["status"] = "pending";
// Set to mark the purchase paid on the next list read: the callback lands
// after payment-status last answered "pending", so the list sees it first.
let payOnNextListRead = false;
let listSawPaid = false;
let statusReadsSincePaid = 0;
let authenticated = true;

function paymentStatus(): PayTRPaymentStatus {
  return {
    purchase_id: "purchase-1", purchase_status: purchaseStatus,
    paid_at: purchaseStatus === "paid" ? "2026-09-17T09:20:00Z" : null,
    provider: purchaseStatus === "paid" ? "paytr" : "", provider_reference: "",
    amount_minor: 432000, currency: "TL", checkout_enabled: true,
    has_active_attempt: false, manual_review: false, requires_reconciliation: false,
    can_start_checkout: purchaseStatus === "pending", can_resume_checkout: false,
    can_retry_checkout: false, can_cancel_unpaid: purchaseStatus === "pending",
    checkout_blocked_reason: "", latest_attempt: null,
  };
}

function purchase(): PackagePurchase {
  if (payOnNextListRead) {
    payOnNextListRead = false;
    purchaseStatus = "paid";
    listSawPaid = statusReadsSincePaid === 0;
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

let PayPage: React.ComponentType<{ params: { purchaseId: string } }>;
let appQueryClient: QueryClient;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: (href: string) => routerCalls.push(href),
        back: () => {},
      }),
      usePathname: () => PAY_PATH,
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
        user: authenticated
          ? { id: "student-1", role: "student", email: "ada@example.com" }
          : null,
        isAuthenticated: authenticated,
        isStudent: authenticated,
        isTutor: false, isAdmin: false, isImpersonating: false, isLoading: false,
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
        if (url.includes("acceptance-status")) {
          return { data: { requires_tutor_acceptance: false, acceptance: null } };
        }
        return { data: [purchase()] };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return {
          data: {
            merchant_oid: "HOCAM-OID-1",
            iframe_url: "https://www.paytr.com/odeme/guvenli/abc123token",
          },
        };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ default: PayPage } = await import("./page"));
  ({ queryClient: appQueryClient } = await import("@/lib/queryClient"));
});

const clients: QueryClient[] = [];

// The app's own query defaults, so freshness is measured as in production.
function newClient() {
  const app = appQueryClient.getDefaultOptions();
  const client = new QueryClient({
    defaultOptions: { queries: { ...app.queries, retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return client;
}

function tree(client: QueryClient) {
  return (
    <QueryClientProvider client={client}>
      <PayPage params={{ purchaseId: "purchase-1" }} />
    </QueryClientProvider>
  );
}

async function fillAndSubmit() {
  await waitFor(() => screen.getByLabelText("Ad soyad"));
  fireEvent.change(screen.getByLabelText("Ad soyad"), { target: { value: "Ada Yılmaz" } });
  fireEvent.change(screen.getByLabelText("Telefon"), { target: { value: "0555 111 22 33" } });
  fireEvent.change(screen.getByLabelText("Adres"), {
    target: { value: "Bağdat Caddesi 1, Kadıköy" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Güvenli ödemeye geç" }));
  await waitFor(() => assert.ok(document.querySelector("iframe")));
}

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  payOnNextListRead = false;
  listSawPaid = false;
  statusReadsSincePaid = 0;
  authenticated = true;
  window.sessionStorage.clear();
});

afterEach(() => {
  focusManager.setFocused(undefined);
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("payment page when the purchase list sees the payment first", () => {
  it("still reaches the paid result and moves focus to it", async () => {
    const client = newClient();
    render(tree(client));
    await fillAndSubmit();

    payOnNextListRead = true;
    // The list is read first, between two payment-status polls (here a
    // refetch; in CI the poll timers drifted apart and did the same).
    await act(() => client.refetchQueries({ queryKey: ["package-purchases"] }));
    const heading = await screen.findByRole(
      "heading",
      { name: "Ödemen onaylandı" },
      { timeout: 8000 }
    );
    assert.ok(listSawPaid, "the list answered paid before payment-status did");
    assert.ok(statusReadsSincePaid > 0, "success waited for payment-status to say paid");
    assert.ok(heading.closest('[role="status"]'), "result is in a live region");
    await waitFor(() => assert.ok(document.activeElement === heading, "focus"));
  });

  it("does not show the load error while the two answers catch up", async () => {
    const client = newClient();
    render(tree(client));
    await fillAndSubmit();

    payOnNextListRead = true;
    // The list is read first, between two payment-status polls (here a
    // refetch; in CI the poll timers drifted apart and did the same).
    await act(() => client.refetchQueries({ queryKey: ["package-purchases"] }));
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

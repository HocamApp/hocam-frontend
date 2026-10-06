import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";

import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * FE-2 on the payment page with the flag on: focus and announcements as the
 * screen changes under the student. Its own file because the node test
 * process stops running cases when too many share one file with the frame.
 * Proven against mocks only — real 3D Secure and real PayTR are staging work.
 */

const PAY_PATH = "/package-purchases/purchase-1/pay";
const STATUS_KEY = ["paytr-payment-status", "purchase-1"];
const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];

let purchaseStatus: PackagePurchase["status"] = "pending";
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
        if (url.includes("payment-status")) return { data: paymentStatus() };
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

const statusReads = () => getCalls.filter((url) => url.includes("payment-status")).length;

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  authenticated = true;
  window.sessionStorage.clear();
});

afterEach(() => {
  focusManager.setFocused(undefined);
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("payment page focus and announcements", () => {
  it("moves focus to the PayTR frame's heading when it opens", async () => {
    render(tree(newClient()));
    await fillAndSubmit();

    const heading = screen.getByRole("heading", { name: "Kartla ödeme" });
    await waitFor(() => assert.ok(document.activeElement === heading, "focus"));
  });

  it("announces the result and moves focus to it when the frame gives way", async () => {
    render(tree(newClient()));
    await fillAndSubmit();

    purchaseStatus = "paid";
    const heading = await screen.findByRole(
      "heading",
      { name: "Ödemen onaylandı" },
      { timeout: 4000 }
    );
    assert.ok(heading.closest('[role="status"]'), "result is in a live region");
    await waitFor(() => assert.ok(document.activeElement === heading, "focus"));
  });

  it("does not steal focus on a first load", async () => {
    render(tree(newClient()));
    await waitFor(() => screen.getByLabelText("Ad soyad"));
    assert.ok(document.activeElement === document.body, "focus");
  });
});

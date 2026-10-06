import "@/test/setupDom";

// No NEXT_PUBLIC_PAYTR_ENABLED: the production build, where payments are off.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * FE-2 changes the payment page, the PayTR frame and the return screen, all
 * behind the PayTR build flag. With the flag off these screens must stay what
 * main ships: the same markup and the same requests. The expected markup in
 * fe2FlagOff.markup.json was captured from origin/main 08c0b76 before FE-2
 * touched any of them (FE2_CAPTURE=1 rewrites it — only ever against main).
 */

const FIXTURE = join(process.cwd(), "src/components/payments/paytr/fe2FlagOff.markup.json");
const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";

const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];
let purchaseStatus: PackagePurchase["status"] = "pending";

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
    amount_minor: 432000, lesson_amount_minor: 432000, coaching_amount_minor: 0,
    currency: "TL", checkout_enabled: false, has_active_attempt: false,
    manual_review: false, requires_reconciliation: false,
    can_start_checkout: false, can_resume_checkout: false, can_retry_checkout: false,
    can_cancel_unpaid: purchaseStatus === "pending",
    checkout_blocked_reason: "checkout_disabled", latest_attempt: null,
  };
}

let PayPage: React.ComponentType<{ params: { purchaseId: string } }>;
let SuccessRoute: React.ComponentType;
let FailureRoute: React.ComponentType;
let PayTRFrame: typeof import("./PayTRFrame").PayTRFrame;

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
        if (url.includes("acceptance-status")) {
          return { data: { requires_tutor_acceptance: false, acceptance: null } };
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

  ({ default: PayPage } = await import("@/app/(checkout)/package-purchases/[purchaseId]/pay/page"));
  ({ default: SuccessRoute } = await import("@/app/(checkout)/odeme/basarili/page"));
  ({ default: FailureRoute } = await import("@/app/(checkout)/odeme/basarisiz/page"));
  ({ PayTRFrame } = await import("./PayTRFrame"));
});

const capture = process.env.FE2_CAPTURE === "1";
const captured: Record<string, string> = {};
const expected: Record<string, string> = capture
  ? {}
  : JSON.parse(readFileSync(FIXTURE, "utf8"));

const clients: QueryClient[] = [];

function withClient(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

function rememberAttempt() {
  window.sessionStorage.setItem(
    RECOVERY_KEY,
    JSON.stringify({
      schemaVersion: 1, purchaseId: "purchase-1", merchantOid: "HOCAM-OID-1",
      tutorId: "tutor-1", startedAt: Date.now(),
    })
  );
}

async function settle(container: HTMLElement, text: string) {
  await waitFor(() => assert.ok(container.textContent?.includes(text), text));
  await new Promise((resolve) => setTimeout(resolve, 20));
}

function check(name: string, html: string) {
  if (capture) {
    captured[name] = html;
    writeFileSync(FIXTURE, JSON.stringify(captured, null, 2) + "\n");
    return;
  }
  assert.equal(html, expected[name], `${name} drifted from main's flag-off markup`);
}

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

describe("FE-2 screens with PayTR off (production build)", () => {
  it("keeps the payment page that offers no new payment", async () => {
    const { container } = withClient(<PayPage params={{ purchaseId: "purchase-1" }} />);
    await settle(container, "Ödeme şu anda kullanılamıyor");
    check("pay-unavailable", container.innerHTML);
    assert.deepEqual(postCalls, []);
    assert.equal(getCalls.filter((url) => url.includes("payment-status")).length, 1);
  });

  it("keeps the payment page that verifies an attempt already started", async () => {
    rememberAttempt();
    const { container } = withClient(<PayPage params={{ purchaseId: "purchase-1" }} />);
    await settle(container, "Durumu kontrol et");
    check("pay-known-attempt", container.innerHTML);
    assert.deepEqual(postCalls, []);
  });

  it("keeps the return screen that claims nothing without a breadcrumb", async () => {
    const { container } = withClient(<SuccessRoute />);
    await settle(container, "Ödeme sonucu burada doğrulanamıyor");
    check("return-no-breadcrumb", container.innerHTML);
    assert.deepEqual(getCalls, []);
  });

  it("keeps the return screen that is still verifying", async () => {
    rememberAttempt();
    const { container } = withClient(<FailureRoute />);
    await settle(container, "Durumu kontrol et");
    check("return-verifying", container.innerHTML);
    assert.deepEqual(postCalls, []);
  });

  it("keeps the return screen for a paid purchase", async () => {
    purchaseStatus = "paid";
    rememberAttempt();
    const { container } = withClient(<SuccessRoute />);
    await settle(container, "ders kredin kullanıma açıldı");
    check("return-paid", container.innerHTML);
  });

  it("keeps the PayTR frame and its refusal markup", () => {
    const frame = render(
      <PayTRFrame iframeUrl="https://www.paytr.com/odeme/guvenli/abc123token" />
    );
    check("frame", frame.container.innerHTML);
    cleanup();
    const refused = render(<PayTRFrame iframeUrl="https://evil.example/odeme" />);
    check("frame-refused", refused.container.innerHTML);
    assert.equal(document.querySelectorAll("script").length, 0, "no third-party script");
  });
});

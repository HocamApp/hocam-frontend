import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";
const routerCalls: string[] = [];
const postCalls: unknown[] = [];

let purchaseStatus: PackagePurchase["status"] = "pending";
let purchasesResponse: () => unknown = () => [purchase()];
let authenticated = true;
let pathname = "/odeme/basarili";

function purchase(): PackagePurchase {
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
    status: purchaseStatus,
    total_credits: 12,
    remaining_credits: purchaseStatus === "paid" ? 12 : 0,
    unit_price: 400,
    subtotal_price: 4800,
    discount_amount: 480,
    promo_discount_amount: 0,
    total_price: 4320,
    created_at: "2026-09-17T09:00:00Z",
    paid_at: purchaseStatus === "paid" ? "2026-09-17T09:20:00Z" : null,
    promotion_code: null,
  };
}

let SuccessRoute: React.ComponentType;
let FailureRoute: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: (href: string) => routerCalls.push(href),
        back: () => {},
      }),
      usePathname: () => pathname,
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
        if (url.includes("acceptance-status")) {
          return { data: { requires_tutor_acceptance: false, acceptance: null } };
        }
        return { data: purchasesResponse() };
      },
      post: async (url: string, body: unknown) => {
        postCalls.push({ url, body });
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ default: SuccessRoute } = await import("@/app/(checkout)/odeme/basarili/page"));
  ({ default: FailureRoute } = await import("@/app/(checkout)/odeme/basarisiz/page"));
});

function renderRoute(Route: React.ComponentType) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Route />
    </QueryClientProvider>
  );
}

function rememberAttempt() {
  window.sessionStorage.setItem(
    RECOVERY_KEY,
    JSON.stringify({
      schemaVersion: 1,
      purchaseId: "purchase-1",
      merchantOid: "HOCAM-OID-1",
      tutorId: "tutor-1",
      startedAt: Date.now(),
    })
  );
}

beforeEach(() => {
  routerCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  purchasesResponse = () => [purchase()];
  authenticated = true;
  pathname = "/odeme/basarili";
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

describe("return pages — the route name decides nothing", () => {
  it("verifies, on both routes, while the callback has not arrived", async () => {
    rememberAttempt();
    renderRoute(SuccessRoute);
    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    cleanup();

    pathname = "/odeme/basarisiz";
    rememberAttempt();
    renderRoute(FailureRoute);

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
  });

  it("renders success on the failure route when the server already said paid", async () => {
    purchaseStatus = "paid";
    pathname = "/odeme/basarisiz";
    rememberAttempt();
    renderRoute(FailureRoute);

    await waitFor(() => screen.getByText("Ödemen onaylandı"));
    assert.equal(screen.queryByText("Ödeme tamamlanamadı"), null);
  });

  it("shows the package and the credits the purchase now carries", async () => {
    purchaseStatus = "paid";
    rememberAttempt();
    renderRoute(SuccessRoute);

    await waitFor(() => screen.getByText("Ödemen onaylandı"));
    assert.ok(screen.getByText("Haftada 3 ders · 30 gün"));
    assert.ok(screen.getByText("4.320 ₺"));
    assert.match(document.body.textContent ?? "", /12 ders kredin kullanıma açıldı/);
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime git" }).getAttribute("href"),
      "/profile/payments"
    );
  });
});

describe("return pages — claims never made", () => {
  it("claims nothing at all when this tab remembers no attempt", async () => {
    renderRoute(FailureRoute);

    await waitFor(() =>
      screen.getByText("Ödeme sonucu burada doğrulanamıyor")
    );
    assert.equal(screen.queryByText("Ödemen onaylandı"), null);
    assert.equal(screen.queryByText("Ödeme tamamlanamadı"), null);
    assert.ok(screen.getByRole("link", { name: "Paketlerime git" }));
  });

  it("never says the card was untouched, nor offers to pay again", async () => {
    pathname = "/odeme/basarisiz";
    rememberAttempt();
    renderRoute(FailureRoute);

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    assert.doesNotMatch(document.body.textContent ?? "", /çekilmedi/i);
    assert.equal(screen.queryByRole("button", { name: /Yeniden ödeme|Tekrar öde/ }), null);
    assert.equal(postCalls.length, 0);
  });

  it("reads a cancelled or refunded purchase as neither success nor failure", async () => {
    purchaseStatus = "cancelled";
    rememberAttempt();
    renderRoute(SuccessRoute);
    await waitFor(() => screen.getByText("Paket iptal edildi"));
    assert.equal(screen.queryByText("Ödemen onaylandı"), null);
    cleanup();

    purchaseStatus = "refunded";
    rememberAttempt();
    renderRoute(SuccessRoute);

    await waitFor(() => screen.getByText("Paket iade durumunda"));
  });

  it("says a purchase it cannot read is unavailable, not failed", async () => {
    purchasesResponse = () => [];
    rememberAttempt();
    renderRoute(SuccessRoute);

    await waitFor(() => screen.getByText("Paket görüntülenemiyor"));
    assert.equal(screen.queryByText("Ödeme tamamlanamadı"), null);
  });
});

describe("return pages — the breadcrumb", () => {
  it("keeps it while the result is still unresolved", async () => {
    rememberAttempt();
    renderRoute(SuccessRoute);

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    assert.ok(window.sessionStorage.getItem(RECOVERY_KEY));
  });

  it("drops it once the server settles the purchase", async () => {
    purchaseStatus = "paid";
    rememberAttempt();
    renderRoute(SuccessRoute);

    await waitFor(() => screen.getByText("Ödemen onaylandı"));
    await waitFor(() => assert.equal(window.sessionStorage.getItem(RECOVERY_KEY), null));
  });

  it("picks up a late callback without a reload", async () => {
    rememberAttempt();
    renderRoute(SuccessRoute);
    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));

    purchaseStatus = "paid";
    fireEvent.click(screen.getByRole("button", { name: "Durumu kontrol et" }));

    await waitFor(() => screen.getByText("Ödemen onaylandı"));
  });

  it("survives a session that expired: log in, come back, keep verifying", async () => {
    authenticated = false;
    pathname = "/odeme/basarisiz";
    rememberAttempt();
    renderRoute(FailureRoute);

    await waitFor(() =>
      assert.deepEqual(routerCalls, [
        `/login?returnUrl=${encodeURIComponent("/odeme/basarisiz")}`,
      ])
    );
    assert.ok(window.sessionStorage.getItem(RECOVERY_KEY));
  });
});

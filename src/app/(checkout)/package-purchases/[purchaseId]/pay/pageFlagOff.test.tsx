import "@/test/setupDom";

// No NEXT_PUBLIC_PAYTR_ENABLED: this file is the build where payments are off.
import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const postCalls: unknown[] = [];

let PayPage: React.ComponentType<{ params: { purchaseId: string } }>;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {} }),
      usePathname: () => "/package-purchases/purchase-1/pay",
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
        if (url.includes("acceptance-status")) {
          return { data: { requires_tutor_acceptance: false, acceptance: null } };
        }
        return {
          data: [
            {
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
              created_at: "2026-09-17T09:00:00Z",
              paid_at: null,
              promotion_code: null,
            },
          ],
        };
      },
      post: async (url: string, body: unknown) => {
        postCalls.push({ url, body });
        return { data: {} };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ default: PayPage } = await import("./page"));
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PayPage params={{ purchaseId: "purchase-1" }} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  postCalls.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

describe("payment page with the flag off", () => {
  it("offers no new payment", async () => {
    renderPage();

    await waitFor(() => screen.getByText("Ödeme şu anda kullanılamıyor"));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    assert.equal(postCalls.length, 0);
  });

  it("still lets an attempt that already started be verified", async () => {
    window.sessionStorage.setItem(
      "hocam:paytr-attempt:v1:student-1",
      JSON.stringify({
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: "HOCAM-OID-1",
        tutorId: "tutor-1",
        startedAt: Date.now(),
      })
    );
    renderPage();

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    assert.equal(postCalls.length, 0);
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { paidPurchase } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let search = "purchase=purchase-1";
let purchases: () => unknown = () => ({ data: [paidPurchase({ remaining_credits: 4 })] });

let Page: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/profile/payments/place",
      useSearchParams: () => new URLSearchParams(search),
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
        user: { id: "student-1", role: "student", email: "deniz@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  // The flow has its own tests; this page decides which package it is shown for.
  mock.module("@/components/payments/place/PlaceLessonsFlow", {
    namedExports: {
      PlaceLessonsFlow: ({ purchase }: { purchase: { id: string; remaining_credits: number } }) => (
        <p>
          yerleştirme {purchase.id} / {purchase.remaining_credits}
        </p>
      ),
    },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/package-purchases/") return purchases();
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = "purchase=purchase-1";
  purchases = () => ({ data: [paidPurchase({ remaining_credits: 4 })] });
});

afterEach(() => cleanup());

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
}

describe("the page that puts a package's credits on the calendar", () => {
  it("opens the flow for the package in the link", async () => {
    renderPage();

    await waitFor(() => screen.getByText("yerleştirme purchase-1 / 4"));
    assert.ok(screen.getByRole("heading", { level: 1, name: "Ders haklarını yerleştir" }));
  });

  it("says so, and sends the student back, when the package has no credit left to place", async () => {
    purchases = () => ({ data: [paidPurchase({ remaining_credits: 0 })] });
    renderPage();

    await waitFor(() => screen.getByText("Paket bulunamadı"));
    assert.equal(screen.queryByText(/yerleştirme purchase-1/), null);
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime dön" }).getAttribute("href"),
      "/profile/payments"
    );
  });

  it("says so when the package is not the student's", async () => {
    search = "purchase=someone-elses";
    renderPage();
    await waitFor(() => screen.getByText("Paket bulunamadı"));
  });

  it("says so when the package is not paid", async () => {
    purchases = () => ({ data: [paidPurchase({ status: "pending", paid_at: null })] });
    renderPage();
    await waitFor(() => screen.getByText("Paket bulunamadı"));
  });

  it("reports a package list that cannot be read, instead of a blank page", async () => {
    purchases = () => Promise.reject(new Error("Network Error"));
    renderPage();
    await waitFor(() => screen.getByText(/Paketlerin yüklenemedi/));
  });
});

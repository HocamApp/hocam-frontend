import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { paidPurchase } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let search = "purchase=purchase-1";
let purchases: () => unknown = () => ({ data: [paidPurchase()] });

let Page: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/profile/payments/refunds/new",
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
  mock.module("sonner", { namedExports: { toast: { success() {} } } });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/package-purchases/") return purchases();
        if (url === "/payments/refund-requests/") return { data: [] };
        throw new Error(`unexpected GET ${url}`);
      },
      post: async () => ({ data: {} }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = "purchase=purchase-1";
  purchases = () => ({ data: [paidPurchase()] });
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

describe("the page that starts a refund", () => {
  it("opens the flow for the package in the link", async () => {
    renderPage();

    await waitFor(() => screen.getByRole("radio", { name: /Paketten vazgeçtim/ }));
    assert.ok(screen.getByRole("heading", { level: 1, name: "İade talebi" }));
    assert.ok(screen.getByText("Ada Lovelace"));
  });

  it("hands the reason in the link to the flow", async () => {
    search = "purchase=purchase-1&reason=slot_conflict";
    renderPage();

    await waitFor(() => screen.getByRole("radio", { name: /Seçtiğim saatler doldu/ }));
  });

  it("says so when the package is not the student's, and sends them back", async () => {
    search = "purchase=someone-elses";
    renderPage();

    await waitFor(() => screen.getByText("Paket bulunamadı"));
    assert.equal(screen.queryAllByRole("radio").length, 0);
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime dön" }).getAttribute("href"),
      "/profile/payments"
    );
  });

  it("says so when the link names no package at all", async () => {
    search = "";
    renderPage();
    await waitFor(() => screen.getByText("Paket bulunamadı"));
  });

  it("reports a package list that cannot be read, instead of a blank page", async () => {
    purchases = () => Promise.reject(new Error("Network Error"));
    renderPage();
    await waitFor(() => screen.getByText(/Paket bilgilerin yüklenemedi/));
  });
});

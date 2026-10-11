import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";
import { paidPurchase, refundRequest } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let purchases: () => PackagePurchase[] = () => [paidPurchase()];
let refunds: () => unknown = () => ({ data: [] });

let Page: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/profile/payments",
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
  // The acceptance and PayTR status of a package are not what this page test is about.
  mock.module("@/components/payments/PackageRequestStatus", {
    namedExports: { PackageRequestStatus: () => null },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/package-purchases/") return { data: purchases() };
        if (url === "/payments/history/") return { data: [] };
        if (url === "/payments/refund-requests/") return refunds();
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  purchases = () => [paidPurchase()];
  refunds = () => ({ data: [] });
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

async function openPackage() {
  const toggle = await waitFor(() => {
    const button = screen
      .getAllByRole("button")
      .find((candidate) => candidate.getAttribute("aria-expanded") === "false");
    assert.ok(button, "the package card toggle");
    return button;
  });
  fireEvent.click(toggle);
}

describe("refunds on the payments page", () => {
  it("offers a refund inside the details of a paid package", async () => {
    renderPage();
    await openPackage();

    const link = await screen.findByRole("link", { name: "İade talep et" });
    assert.equal(link.getAttribute("href"), "/profile/payments/refunds/new?purchase=purchase-1");
    assert.equal(screen.queryByText("İade taleplerin"), null);
  });

  it("lists the requests and points the package to the one that is open", async () => {
    refunds = () => ({
      data: [refundRequest({ id: "open-1", purchase: "purchase-1", status: "requested" })],
    });
    renderPage();

    await screen.findByText("İade taleplerin");
    await openPackage();

    await screen.findByRole("link", { name: "Talebini gör" });
    assert.equal(screen.queryByRole("link", { name: "İade talep et" }), null);
    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    assert.ok(hrefs.includes("/profile/payments/refunds/open-1"));
  });

  it("keeps the packages and the entry when the list of requests cannot be read", async () => {
    refunds = () => Promise.reject(new Error("Network Error"));
    renderPage();
    await openPackage();

    await screen.findByRole("link", { name: "İade talep et" });
    assert.equal(screen.queryByText("İade taleplerin"), null);
    assert.equal(screen.queryByText(/yüklenemedi/), null);
  });

  it("offers no refund on a package that is waiting for its payment", async () => {
    purchases = () => [paidPurchase({ status: "pending", paid_at: null })];
    renderPage();
    await openPackage();

    await screen.findByText(/Bu pakette henüz ders hakkı hareketi yok/);
    assert.equal(screen.queryByRole("link", { name: "İade talep et" }), null);
  });
});

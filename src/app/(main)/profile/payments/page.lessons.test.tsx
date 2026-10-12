import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Booking, PackagePurchase } from "@/types";
import { bookingsFixture, purchaseFixture } from "@/test/packageFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let purchases: PackagePurchase[] = [];
let bookings: () => unknown = () => ({ data: [] as Booking[] });

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
        user: { id: "student-1", role: "student", email: "ayse@example.com" },
        isAuthenticated: true,
        isStudent: true,
        isTutor: false,
        isAdmin: false,
        isImpersonating: false,
        isLoading: false,
      }),
    },
  });
  mock.module("@/components/payments/PackageRequestStatus", {
    namedExports: { PackageRequestStatus: () => null },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/payments/package-purchases/") return { data: purchases };
        if (url === "/payments/history/") return { data: [] };
        if (url === "/payments/refund-requests/") return { data: [] };
        if (url === "/bookings/") return bookings();
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  purchases = [];
  bookings = () => ({ data: [] });
});

afterEach(cleanup);

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  );
}

describe("which packages count as running", () => {
  it("lists a package paid for a minute ago as active, not under past packages", async () => {
    // Every lesson is on the calendar, no credit is left unscheduled.
    purchases = [purchaseFixture({ remaining_credits: 0 })];
    bookings = () => ({ data: bookingsFixture("confirmed", 8) });
    renderPage();

    await screen.findByText("Ders hakkı");
    assert.ok(screen.getByText("8 / 8"));
    assert.equal(screen.queryByText("Aktif paketin yok."), null);
    assert.equal(screen.queryByText("Geçmiş paketler"), null);
  });

  it("moves a package to the past once every lesson has been taught", async () => {
    purchases = [purchaseFixture({ remaining_credits: 0 })];
    bookings = () => ({ data: bookingsFixture("completed", 8) });
    renderPage();

    await screen.findByText("Geçmiş paketler");
    assert.ok(screen.getByText("Aktif paketin yok."));
  });

  it("says how many lessons have no day yet", async () => {
    purchases = [purchaseFixture({ remaining_credits: 2 })];
    bookings = () => ({ data: bookingsFixture("confirmed", 6) });
    renderPage();

    await screen.findByText("2 ders planlanmadı");
    assert.ok(screen.getByText("8 / 8"));
  });

  it("goes by the credits alone when the lessons cannot be read", async () => {
    purchases = [purchaseFixture({ remaining_credits: 3 })];
    bookings = () => Promise.reject(new Error("Network Error"));
    renderPage();

    await screen.findByText("Ders hakkı");
    assert.ok(screen.getByText("3 / 8"));
    assert.equal(screen.queryByText("Geçmiş paketler"), null);
  });
});

describe("a lessons list that is slow", () => {
  it("does not hold the packages back for as long as it takes to fail", async () => {
    purchases = [purchaseFixture({ remaining_credits: 3 })];
    bookings = () => new Promise(() => {});
    renderPage();

    // The lessons never arrive; the list shows from the credits after a short wait.
    await screen.findByText("Ders hakkı", {}, { timeout: 5000 });
    assert.ok(screen.getByText("3 / 8"));
  });

  it("settles when the lessons do arrive late", async () => {
    purchases = [purchaseFixture({ remaining_credits: 0 })];
    let arrive: (value: unknown) => void = () => {};
    bookings = () => new Promise((resolve) => { arrive = resolve; });
    renderPage();

    // From the credits alone the package looks used up and is filed as past.
    await screen.findByText("Geçmiş paketler", {}, { timeout: 5000 });
    arrive({ data: bookingsFixture("confirmed", 8) });

    await screen.findByText("8 / 8", {}, { timeout: 3000 });
    assert.equal(screen.queryByText("Geçmiş paketler"), null);
  });
});

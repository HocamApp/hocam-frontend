import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { refundRequest } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const requested: string[] = [];
let detail: (id: string) => unknown = () => ({ data: refundRequest({ due_at: "2099-01-01T09:00:00+00:00" }) });
let params: { id: string | string[] } = { id: "refund-1" };

let Page: React.ComponentType;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push() {}, replace() {}, back() {} }),
      usePathname: () => "/profile/payments/refunds/refund-1",
      useSearchParams: () => new URLSearchParams(),
      useParams: () => params,
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
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        requested.push(url);
        const match = url.match(/^\/payments\/refund-requests\/([^/]+)\/$/);
        if (match) return detail(match[1]);
        throw new Error(`unexpected GET ${url}`);
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  requested.length = 0;
  params = { id: "refund-1" };
  detail = () => ({ data: refundRequest({ due_at: "2099-01-01T09:00:00+00:00" }) });
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

describe("the page that follows a refund", () => {
  it("reads the request in the address and shows it", async () => {
    renderPage();

    await waitFor(() => screen.getByRole("list", { name: "İade sürecinin aşamaları" }));
    assert.deepEqual(requested, ["/payments/refund-requests/refund-1/"]);
    assert.ok(screen.getByRole("heading", { level: 1, name: "İade talebin" }));
  });

  it("reads the first part of an address that arrives as a list", async () => {
    params = { id: ["refund-1", "extra"] };
    renderPage();
    await waitFor(() => screen.getByRole("list", { name: "İade sürecinin aşamaları" }));
    assert.deepEqual(requested, ["/payments/refund-requests/refund-1/"]);
  });

  it("says a request that is not theirs does not exist, once, without retrying", async () => {
    detail = () => Promise.reject({ isAxiosError: true, response: { status: 404, data: {} } });
    renderPage();

    await waitFor(() => screen.getByText("İade talebi bulunamadı"));
    assert.equal(requested.length, 1);
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime dön" }).getAttribute("href"),
      "/profile/payments"
    );
  });

  it("reports any other failure plainly", async () => {
    detail = () => Promise.reject({ isAxiosError: true, response: { status: 500, data: {} } });
    renderPage();
    await waitFor(() => screen.getByText(/İade talebi yüklenemedi/), { timeout: 8000 });
  });
});

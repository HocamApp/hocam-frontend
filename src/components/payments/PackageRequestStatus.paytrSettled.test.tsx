import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchaseStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * A settled purchase offers no payment control.
 *
 * Its own file on purpose: run alongside the other PackageRequestStatus cases
 * the node test process died with no diagnostics, while the same scenario
 * passes on its own. The behaviour is the product rule worth pinning, so it is
 * pinned here rather than dropped.
 */

const ACCEPTED: PurchaseAcceptanceState = {
  requires_tutor_acceptance: true,
  acceptance: {
    id: "acceptance-1",
    status: "accepted",
    expires_at: "2099-09-19T09:00:00Z",
    responded_at: "2026-09-17T10:00:00Z",
    includes_coaching: false,
  },
  can_withdraw: false,
  // Deliberately stale: the server can answer a moment before the purchase
  // settles, and the UI must not outlive that answer.
  can_cancel_unpaid: true,
};

let PackageRequestStatus: typeof import("./PackageRequestStatus").PackageRequestStatus;

before(async () => {
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
      get: async () => ({ data: ACCEPTED }),
      post: async () => ({ data: ACCEPTED }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ PackageRequestStatus } = await import("./PackageRequestStatus"));
});

afterEach(() => cleanup());

function renderStatus(purchaseStatus: PackagePurchaseStatus) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <PackageRequestStatus purchaseId="purchase-1" purchaseStatus={purchaseStatus} />
    </QueryClientProvider>
  );
  return client;
}

describe("PackageRequestStatus on a settled purchase", () => {
  it("offers neither payment nor unpaid cancellation once the purchase is paid", async () => {
    renderStatus("paid");

    await waitFor(() =>
      screen.getByText("Öğretmen kabul etti. Ödeme aktivasyonu bekleniyor.")
    );
    assert.equal(screen.queryByRole("link", { name: "Ödemeye devam et" }), null);
    assert.equal(
      screen.queryByRole("link", { name: "Ödeme durumunu kontrol et" }),
      null
    );
    assert.equal(screen.queryByRole("button", { name: "Paketi iptal et" }), null);
    assert.equal(
      screen.queryByText("Öğretmenin kabul etti. Paket ödeme bekliyor."),
      null
    );
  });
});

import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchaseStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";

let acceptanceResponse: PurchaseAcceptanceState = {
  requires_tutor_acceptance: false,
  acceptance: null,
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
      get: async () => ({ data: acceptanceResponse }),
      post: async () => ({ data: acceptanceResponse }),
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ PackageRequestStatus } = await import("./PackageRequestStatus"));
});

const clients: QueryClient[] = [];

function renderStatus(purchaseStatus: PackagePurchaseStatus = "pending") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <PackageRequestStatus purchaseId="purchase-1" purchaseStatus={purchaseStatus} />
    </QueryClientProvider>
  );
}

function acceptance(
  status: NonNullable<PurchaseAcceptanceState["acceptance"]>["status"],
  extra: Partial<PurchaseAcceptanceState> = {}
): PurchaseAcceptanceState {
  return {
    requires_tutor_acceptance: true,
    acceptance: {
      id: "acceptance-1",
      status,
      expires_at: "2099-09-19T09:00:00Z",
      responded_at: status === "pending" ? null : "2026-09-17T10:00:00Z",
      includes_coaching: false,
    },
    can_withdraw: status === "pending",
    can_cancel_unpaid: status === "accepted",
    ...extra,
  };
}

beforeEach(() => {
  acceptanceResponse = { requires_tutor_acceptance: false, acceptance: null };
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  // Each render gets its own client; unmounting alone leaves its cache and
  // subscribers behind, and by the sixth test the file stopped finishing.
  while (clients.length) clients.pop()?.clear();
});

describe("PackageRequestStatus with PayTR on", () => {
  it("offers payment on a package that needs no tutor decision", async () => {
    renderStatus();

    await waitFor(() => screen.getByRole("link", { name: "Ödemeye devam et" }));
    assert.equal(
      screen.getByRole("link", { name: "Ödemeye devam et" }).getAttribute("href"),
      "/package-purchases/purchase-1/pay"
    );
  });

  it("offers payment once the tutor has accepted", async () => {
    acceptanceResponse = acceptance("accepted");
    renderStatus();

    await waitFor(() => screen.getByRole("link", { name: "Ödemeye devam et" }));
  });

  it("waits, without a payment link, while the tutor decides", async () => {
    acceptanceResponse = acceptance("pending");
    renderStatus();

    await waitFor(() => screen.getByRole("button", { name: "Talebi geri çek" }));
    assert.equal(screen.queryByRole("link", { name: "Ödemeye devam et" }), null);
  });

  it("asks about a known attempt instead of offering to pay again", async () => {
    acceptanceResponse = acceptance("accepted");
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
    renderStatus();

    await waitFor(() =>
      screen.getByRole("link", { name: "Ödeme durumunu kontrol et" })
    );
    assert.equal(screen.queryByRole("link", { name: "Ödemeye devam et" }), null);
  });

  it("offers unpaid cancellation while nothing is in flight", async () => {
    acceptanceResponse = acceptance("accepted");
    renderStatus();

    await waitFor(() => screen.getByRole("button", { name: "Paketi iptal et" }));
  });

  it("stops offering to cancel a purchase whose payment may be in flight", async () => {
    acceptanceResponse = acceptance("accepted");
    window.sessionStorage.setItem(
      RECOVERY_KEY,
      JSON.stringify({
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: null,
        tutorId: "tutor-1",
        startedAt: Date.now(),
      })
    );
    renderStatus();

    await waitFor(() =>
      screen.getByRole("link", { name: "Ödeme durumunu kontrol et" })
    );
    assert.equal(screen.queryByRole("button", { name: "Paketi iptal et" }), null);
  });

  it("drops the claim that no charge can happen once payment is live", async () => {
    acceptanceResponse = acceptance("accepted");
    renderStatus();

    await waitFor(() => screen.getByRole("link", { name: "Ödemeye devam et" }));
    assert.doesNotMatch(document.body.textContent ?? "", /hiçbir tahsilat yapılmadı/);
  });
});

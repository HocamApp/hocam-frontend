import "@/test/setupDom";

// No NEXT_PUBLIC_PAYTR_ENABLED: this file is the production build, where
// payments are off. The response deadline below renders in the runner's zone,
// so pin it — CI runs in UTC, a laptop in Istanbul.
process.env.TZ = "UTC";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchaseStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * With the PayTR flag off the package card must stay exactly what main ships:
 * the same markup, the same buttons, and not one request to the payment-status
 * endpoint. The expected markup below was captured from the component before
 * FE-1 changed it, so any drift in the flag-off build fails here.
 */

const RECOVERY_KEY = "hocam:paytr-attempt:v1:student-1";

const getCalls: string[] = [];
const postCalls: string[] = [];

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
      get: async (url: string) => {
        getCalls.push(url);
        return { data: acceptanceResponse };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: { status: "cancelled" } };
      },
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
  const view = render(
    <QueryClientProvider client={client}>
      <PackageRequestStatus
        purchaseId="purchase-1"
        purchaseStatus={purchaseStatus}
        totalPrice={4320}
      />
    </QueryClientProvider>
  );
  return { client, container: view.container };
}

async function settledMarkup(purchaseStatus: PackagePurchaseStatus = "pending") {
  const { client, container } = renderStatus(purchaseStatus);
  await waitFor(() =>
    assert.equal(
      client.getQueryState(["purchase-acceptance", "purchase-1"])?.status,
      "success"
    )
  );
  // One more turn so the breadcrumb effect has rendered too.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return { client, html: container.innerHTML };
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

function assertNoPaymentStatusRead() {
  assert.deepEqual(
    getCalls.filter((url) => url.includes("payment-status")),
    [],
    "the flag-off build must not ask for payment status"
  );
}

beforeEach(() => {
  acceptanceResponse = { requires_tutor_acceptance: false, acceptance: null };
  getCalls.length = 0;
  postCalls.length = 0;
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  while (clients.length) clients.pop()?.clear();
});

// Captured from origin/main b34438a (PackageRequestStatus before FE-1).
const EXPECTED_PENDING_TITLE = "Öğretmen yanıtı bekleniyor";
const EXPECTED_ACCEPTED_TITLE = "Öğretmen kabul etti. Ödeme aktivasyonu bekleniyor.";
const EXPECTED_REJECTED_TITLE = "Öğretmen talebi kabul etmedi";
const EXPECTED_DEADLINE = "19 Eyl 09:00";

const CARD = 'class="mt-3 space-y-2 rounded-md border bg-muted/30 p-3"';
const BUTTON_BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-pill font-medium ring-offset-background transition-colors duration-[--duration-state] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-line disabled:text-ink-mid";
const OUTLINE_SM = `${BUTTON_BASE} border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper h-9 px-[22px] text-[0.875rem]`;
const PRIMARY_SM = `${BUTTON_BASE} bg-pink text-white hover:bg-pink-deep h-9 px-[22px] text-[0.875rem]`;

describe("PackageRequestStatus with PayTR off (production build)", () => {
  it("renders nothing for a purchase without a tutor request", async () => {
    const { html } = await settledMarkup();
    assert.equal(html, "");
    assertNoPaymentStatusRead();
  });

  it("keeps the waiting card with only the withdraw button", async () => {
    acceptanceResponse = acceptance("pending");
    const { html } = await settledMarkup();
    assert.equal(
      html,
      `<div ${CARD}><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">${EXPECTED_PENDING_TITLE}</p></div><p class="text-xs text-muted-foreground">Yanıt süresi ${EXPECTED_DEADLINE}'e kadar. Bu aşamada kartından ödeme alınmaz.</p><div class="flex flex-wrap gap-2"><button class="${OUTLINE_SM}">Talebi geri çek</button></div></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("keeps the accepted card: no payment link, the no-charge line and unpaid cancel", async () => {
    acceptanceResponse = acceptance("accepted");
    const { html } = await settledMarkup();
    assert.equal(
      html,
      `<div ${CARD}><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">${EXPECTED_ACCEPTED_TITLE}</p></div><p class="text-xs text-muted-foreground">Öğretmenin kabul etti. Paket henüz ödeme aktivasyonu bekliyor — hiçbir tahsilat yapılmadı.</p><div class="flex flex-wrap gap-2"><button class="${OUTLINE_SM}">Paketi iptal et</button></div></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("keeps the status link and hides cancel when this tab knows an attempt", async () => {
    acceptanceResponse = acceptance("accepted");
    rememberAttempt();
    const { html } = await settledMarkup();
    assert.equal(
      html,
      `<div ${CARD}><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">${EXPECTED_ACCEPTED_TITLE}</p></div><p class="text-xs text-muted-foreground">Öğretmenin kabul etti. Paket henüz ödeme aktivasyonu bekliyor — hiçbir tahsilat yapılmadı.</p><div class="flex flex-wrap gap-2"><a href="/package-purchases/purchase-1/pay" class="${PRIMARY_SM}">Ödeme durumunu kontrol et</a></div></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("keeps the bare status link on a purchase without a tutor request", async () => {
    rememberAttempt();
    const { html } = await settledMarkup();
    assert.equal(
      html,
      `<div class="mt-3"><a href="/package-purchases/purchase-1/pay" class="${PRIMARY_SM}">Ödeme durumunu kontrol et</a></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("keeps the ended card for a declined request", async () => {
    acceptanceResponse = acceptance("rejected");
    const { html } = await settledMarkup();
    assert.equal(
      html,
      `<div ${CARD}><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">${EXPECTED_REJECTED_TITLE}</p></div><div class="flex flex-wrap gap-2"></div></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("keeps a paid purchase free of payment and cancel controls", async () => {
    acceptanceResponse = acceptance("accepted");
    const { html } = await settledMarkup("paid");
    assert.equal(
      html,
      `<div ${CARD}><div class="flex flex-wrap items-center gap-2"><p class="text-sm font-medium">${EXPECTED_ACCEPTED_TITLE}</p></div><div class="flex flex-wrap gap-2"></div></div>`
    );
    assertNoPaymentStatusRead();
  });

  it("cancels with a single POST and no payment-status read", async () => {
    acceptanceResponse = acceptance("accepted");
    renderStatus();

    fireEvent.click(await screen.findByRole("button", { name: "Paketi iptal et" }));
    fireEvent.click(await screen.findByRole("button", { name: "Paketi iptal et" }));

    await waitFor(() => assert.equal(postCalls.length, 1));
    assert.match(postCalls[0], /purchase-1\/cancel-unpaid\/$/);
    assertNoPaymentStatusRead();
  });

  it("creates no payment-status cache entry when the status link is followed", async () => {
    acceptanceResponse = acceptance("accepted");
    rememberAttempt();
    const { client } = renderStatus();

    fireEvent.click(
      await screen.findByRole("link", { name: "Ödeme durumunu kontrol et" })
    );
    assert.equal(
      client.getQueryCache().find({ queryKey: ["paytr-payment-status", "purchase-1"] }),
      undefined
    );
    assertNoPaymentStatusRead();
  });
});

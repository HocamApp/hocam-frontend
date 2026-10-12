import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

/**
 * The payment page for a purchase that holds hours: what is held, how long is
 * left, what happens at zero, and the ways out of a purchase nobody has paid
 * for yet. The harness is the one page.test.tsx uses (the real payments API
 * modules over a fake transport) with a purchase that carries a deadline and
 * weekly hours.
 */

const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: string[] = [];

let deadline: string | null = null;
let statusOverrides: Partial<PayTRPaymentStatus> = {};
let acceptance: unknown = { requires_tutor_acceptance: false, acceptance: null };

const minutesFromNow = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function paymentStatus(): PayTRPaymentStatus {
  return {
    purchase_id: "purchase-1",
    purchase_status: "pending",
    paid_at: null,
    provider: "",
    provider_reference: "",
    amount_minor: 432000,
    currency: "TL",
    checkout_enabled: true,
    has_active_attempt: false,
    manual_review: false,
    requires_reconciliation: false,
    can_start_checkout: true,
    can_resume_checkout: false,
    can_retry_checkout: false,
    can_cancel_unpaid: true,
    checkout_blocked_reason: "",
    latest_attempt: null,
    ...statusOverrides,
  };
}

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
    payment_deadline: deadline,
    recurring_slots: [
      { slot_index: 1, day_of_week: 2, start_time: "10:00", subject: { id: "s1", name: "Matematik" } },
      { slot_index: 0, day_of_week: 0, start_time: "10:00", subject: { id: "s1", name: "Matematik" } },
    ],
  };
}

let PayPage: React.ComponentType<{ params: { purchaseId: string } }>;

before(async () => {
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
        replace: (href: string) => routerCalls.push(href),
        back: () => {},
      }),
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
        getCalls.push(url);
        if (url.includes("payment-status")) return { data: paymentStatus() };
        if (url.includes("acceptance-status")) return { data: acceptance };
        return { data: [purchase()] };
      },
      post: async (url: string) => {
        postCalls.push(url);
        return { data: { requires_tutor_acceptance: false, acceptance: null } };
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ default: PayPage } = await import("./page"));
});

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  deadline = minutesFromNow(25);
  statusOverrides = {};
  acceptance = { requires_tutor_acceptance: false, acceptance: null };
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

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

const text = () => document.body.textContent ?? "";

describe("the hours the purchase holds", () => {
  it("shows the weekly hours in the summary, sorted, with the lesson length", async () => {
    renderPage();

    await screen.findByText("Ders programın");
    const rows = screen.getAllByRole("listitem").map((item) => item.textContent);
    assert.deepEqual(
      rows.filter((row) => /^Her /.test(row ?? "")),
      ["Her Pazartesi10:00 – 10:40", "Her Çarşamba10:00 – 10:40"]
    );
    assert.ok(screen.getByText("Matematik"));
    assert.match(text(), /Bu saatler paket boyunca her hafta tekrar eder/);
  });

  it("counts down to the server's deadline above the form", async () => {
    renderPage();

    const timer = await screen.findByRole("timer");
    assert.match(timer.textContent ?? "", /^(24|25):\d\d$/);
    assert.ok(screen.getByText("Saatlerin senin için ayrıldı"));
    assert.ok(await screen.findByLabelText("Ad soyad"), "the form is there while the hold lasts");
  });

  it("shows no countdown for a purchase that holds no hours", async () => {
    deadline = null;
    renderPage();

    await screen.findByLabelText("Ad soyad");
    assert.equal(screen.queryByRole("timer"), null);
    assert.equal(screen.queryByText("Saatlerin senin için ayrıldı"), null);
  });
});

describe("when the hold has run out", () => {
  beforeEach(() => {
    deadline = minutesFromNow(-1);
  });

  it("says so, takes the form away, and offers to start again with the same plan", async () => {
    renderPage();

    const heading = await screen.findByRole("heading", { name: "Saatlerin süresi doldu" });
    const notice = within(heading.closest("section") as HTMLElement);
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    assert.equal(screen.queryByRole("button", { name: "Güvenli ödemeye geç" }), null);
    assert.equal(
      notice.getByRole("link", { name: "Yeniden başla" }).getAttribute("href"),
      "/tutors/tutor-1/checkout/schedule?per_week=3&duration=30"
    );
    assert.equal(notice.getByRole("link", { name: "Paketlerim" }).getAttribute("href"), "/profile/payments");
  });

  it("says the hold ran out, not that payment is unavailable, once the server has closed the payment", async () => {
    // After the deadline the server stops issuing payment pages.
    statusOverrides = { can_start_checkout: false };
    renderPage();

    await screen.findByRole("heading", { name: "Saatlerin süresi doldu" });
    assert.equal(screen.queryByText("Ödeme şu anda kullanılamıyor"), null);
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
  });

  it("does not offer to cancel what has already ended", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Saatlerin süresi doldu" });
    assert.equal(screen.queryByRole("button", { name: "Satın almayı iptal et" }), null);
  });

  it("leaves a payment that is already in flight alone", async () => {
    statusOverrides = { has_active_attempt: true, can_start_checkout: false, can_cancel_unpaid: false };
    renderPage();

    await waitFor(() => assert.ok(getCalls.some((url) => url.includes("payment-status"))));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(screen.queryByRole("heading", { name: "Saatlerin süresi doldu" }), null);
  });
});

describe("leaving a purchase nobody has paid for", () => {
  it("offers to change the plan or give it up, and asks before doing either", async () => {
    renderPage();

    const cancel = await screen.findByRole("button", { name: "Satın almayı iptal et" });
    assert.ok(screen.getByRole("button", { name: "Planı değiştir" }));
    fireEvent.click(cancel);

    assert.match(text(), /ayırdığımız saatler yeniden herkese açılır/);
    assert.deepEqual(postCalls, []);
  });

  it("gives it up: reads the status again, cancels, and goes to the packages", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Satın almayı iptal et" }));

    const reads = getCalls.filter((url) => url.includes("payment-status")).length;
    fireEvent.click(screen.getAllByRole("button", { name: "Satın almayı iptal et" })[0]);

    await waitFor(() => assert.deepEqual(routerCalls, ["/profile/payments"]));
    assert.deepEqual(postCalls, ["/payments/package-purchases/purchase-1/cancel-unpaid/"]);
    assert.ok(
      getCalls.filter((url) => url.includes("payment-status")).length > reads,
      "the status was read again right before the cancel"
    );
  });

  it("changes the plan: cancels, then goes to the hours of the same tutor and plan", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Planı değiştir" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Planı değiştir" })[0]);

    await waitFor(() =>
      assert.deepEqual(routerCalls, ["/tutors/tutor-1/checkout/schedule?per_week=3&duration=30"])
    );
    assert.equal(postCalls.length, 1);
  });

  it("does not cancel when a payment started in another tab: the fresh read stops it", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Satın almayı iptal et" }));

    // The status the page holds is a few seconds old; the server now says a
    // payment is in flight.
    statusOverrides = { has_active_attempt: true, can_start_checkout: false, can_cancel_unpaid: false };
    fireEvent.click(screen.getAllByRole("button", { name: "Satın almayı iptal et" })[0]);

    // The fresh read replaces the screen with the verification of that payment,
    // so the offer to cancel is gone and nothing was cancelled.
    await screen.findByText("Ödeme sonucu doğrulanıyor");
    assert.equal(screen.queryByRole("button", { name: "Satın almayı iptal et" }), null);
    assert.deepEqual(postCalls, []);
    assert.deepEqual(routerCalls, []);
  });

  it("is not offered while a payment is in flight", async () => {
    statusOverrides = { has_active_attempt: true, can_start_checkout: false, can_cancel_unpaid: false };
    renderPage();

    await waitFor(() => assert.ok(getCalls.some((url) => url.includes("payment-status"))));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(screen.queryByRole("button", { name: "Satın almayı iptal et" }), null);
  });

  it("is not offered for a bundle with coaching, which has a tutor's answer behind it", async () => {
    acceptance = {
      requires_tutor_acceptance: true,
      acceptance: { status: "accepted", includes_coaching: true, expires_at: "2026-10-20T00:00:00Z" },
      can_withdraw: false,
      can_cancel_unpaid: true,
    };
    renderPage();

    await waitFor(() => assert.ok(getCalls.some((url) => url.includes("acceptance-status"))));
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(screen.queryByRole("button", { name: "Satın almayı iptal et" }), null);
    assert.equal(screen.queryByRole("button", { name: "Planı değiştir" }), null);
  });
});

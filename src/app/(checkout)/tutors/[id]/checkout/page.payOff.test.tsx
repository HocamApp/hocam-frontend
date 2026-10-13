/**
 * The checkout with online payment closed in this build (NEXT_PUBLIC_PAYTR_ENABLED
 * off). A lesson package is bought and paid for on this screen with nobody to
 * answer in between, so with payment closed there is nothing to buy: a purchase
 * would hold a tutor's hours for nothing. The same harness as page.payNow.test.tsx
 * with the switch off.
 */
import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PolicyCopy } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

type Json = Record<string, unknown>;

const SUBJECT = "7";
const SCHEDULE = `${SUBJECT}~0:10:00,2:10:00`;

let search = `per_week=2&duration=90&schedule=${encodeURIComponent(SCHEDULE)}`;
const pushed: string[] = [];
const posts: { url: string; body: Json; headers?: Record<string, string> }[] = [];
let policyReads = 0;

const tutor = {
  id: "tutor-1",
  user: "tutor-user-1",
  name: "Ada",
  surname: "Lovelace",
  hourly_price: 1000,
  profile_picture: "",
  subjects: [{ id: 7, name: "Matematik", exam_type: "TYT" }],
  trial_lesson_eligible: false,
  trial_lessons_remaining: 0,
};

function plan(days: number, credits: number, discount: number) {
  return {
    id: `plan-${days}`,
    name: `Haftada 2 · ${days} gün`,
    code: `weekly_2_${days}d`,
    lesson_count: credits,
    lesson_duration_minutes: 40,
    lessons_per_week: 2,
    duration_days: days,
    discount_percent: discount,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  };
}

const plans = [plan(14, 4, 1), plan(30, 8, 6), plan(90, 24, 16), plan(180, 48, 26)];

const policy: PolicyCopy = {
  version: "p-current01",
  status: "draft",
  acceptance_required: true,
  sections: [{ id: "payment", title: "Ödeme", body: "Ödemeye geçtiğinde paketin tutarını ödemekle yükümlü olursun." }],
  consent_label: "Ön bilgilendirme koşullarını okudum ve kabul ediyorum.",
  pay_button_label: "Ödeme yükümlülüğü ile devam et",
  links: [{ label: "İptal ve iade koşulları", href: "/iptal-ve-iade" }],
};

const createdPurchase = {
  id: "purchase-9",
  student: { id: "student-1", name: "Deniz", surname: "Kaya" },
  tutor: { id: "tutor-1", name: "Ada", surname: "Lovelace" },
  plan: plans[2],
  status: "pending",
  total_credits: 24,
  remaining_credits: 0,
  unit_price: 840,
  subtotal_price: 24000,
  discount_amount: 3840,
  promo_discount_amount: 0,
  total_price: 20160,
  created_at: "2026-10-12T09:00:00Z",
  paid_at: null,
  promotion_code: null,
};

let purchasesList: unknown[] = [];
let postResponse: () => unknown = () => ({ data: createdPurchase });

function failure(status: number, data: unknown) {
  return Promise.reject({ isAxiosError: true, response: { status, data } });
}

let Page: React.ComponentType<{ params: { id: string } }>;

before(async () => {
  mock.module("@/lib/featureFlags", { namedExports: { PAYTR_ENABLED: false } });
  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({ push: (href: string) => pushed.push(href), replace() {}, back() {} }),
      usePathname: () => "/tutors/tutor-1/checkout",
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
  mock.module("sonner", { namedExports: { toast: { success() {}, error() {} } } });
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
  mock.module("@/components/lessons/BookingModal", {
    namedExports: { BookingModal: () => null },
  });
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        if (url === "/tutors/tutor-1/") return { data: tutor };
        if (url === "/payments/tutors/tutor-1/offered-plans/") return { data: plans };
        if (url === "/payments/package-purchases/") return { data: purchasesList };
        if (url === "/payments/policy-copy/") {
          policyReads += 1;
          return { data: policy };
        }
        if (url.endsWith("/acceptance-status/")) {
          return { data: { requires_tutor_acceptance: false, acceptance: null } };
        }
        if (url.endsWith("/payment-status/")) {
          return {
            data: {
              purchase_id: "purchase-9",
              purchase_status: "pending",
              paid_at: null,
              provider: "",
              provider_reference: "",
              amount_minor: 2016000,
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
            },
          };
        }
        throw new Error(`unexpected GET ${url}`);
      },
      post: async (url: string, body: Json, config?: { headers?: Record<string, string> }) => {
        posts.push({ url, body, headers: config?.headers });
        return postResponse();
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });
  ({ default: Page } = await import("./page"));
});

beforeEach(() => {
  search = `per_week=2&duration=90&schedule=${encodeURIComponent(SCHEDULE)}`;
  pushed.length = 0;
  posts.length = 0;
  policyReads = 0;
  purchasesList = [];
  postResponse = () => ({ data: createdPurchase });
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <Page params={{ id: "tutor-1" }} />
    </QueryClientProvider>
  );
}

/** The summary renders its button twice (desktop and the mobile bar); either is the button. */
const payButtons = (name: string | RegExp) => screen.getAllByRole("button", { name });
const checkbox = () => screen.getByRole("checkbox");
const text = () => document.body.textContent ?? "";

async function untilSummaryShown() {
  await screen.findByText("Ders programı");
}

describe("while online payment is closed in this build", () => {
  it("offers nothing to buy: the button says payment is coming and is disabled", async () => {
    renderPage();
    await untilSummaryShown();

    const buttons = payButtons("Ödeme sistemi yakında") as HTMLButtonElement[];
    assert.ok(buttons.length >= 1);
    assert.ok(buttons.every((button) => button.disabled));
    assert.equal(screen.queryByText("Paket talebi oluştur"), null);
  });

  it("shows no rules to accept, and asks the server nothing about them", async () => {
    renderPage();
    await untilSummaryShown();

    assert.equal(screen.queryByRole("checkbox"), null);
    assert.equal(policyReads, 0);
  });

  it("creates nothing, however the button is pressed", async () => {
    renderPage();
    await untilSummaryShown();

    for (const button of payButtons("Ödeme sistemi yakında")) fireEvent.click(button);

    assert.deepEqual(posts, []);
  });

  it("says payment is not open yet, and promises no request that would be answered later", async () => {
    renderPage();
    await untilSummaryShown();

    assert.match(text(), /Online ödeme henüz açılmadı/);
    assert.doesNotMatch(text(), /Talebinin durumunu/);
    assert.doesNotMatch(text(), /Ödeme PayTR/);
  });
});

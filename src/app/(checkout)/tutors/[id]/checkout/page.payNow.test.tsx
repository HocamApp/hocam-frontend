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
  mock.module("@/lib/featureFlags", { namedExports: { PAYTR_ENABLED: true } });
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

async function untilConsentShown() {
  await screen.findByRole("checkbox");
}

describe("paying for a lesson package here", () => {
  it("opens the payment with a button that states the obligation, and the rules unticked", async () => {
    renderPage();
    await untilConsentShown();

    assert.equal((checkbox() as HTMLInputElement).checked, false);
    assert.ok(payButtons("Ödeme yükümlülüğü ile devam et").length >= 1);
    assert.match(text(), /Ödeme PayTR'nin güvenli sayfasında yapılır/);
    assert.doesNotMatch(text(), /ücret alınmaz/);
  });

  it("will not go on without the box, says why, and moves focus to it", async () => {
    renderPage();
    await untilConsentShown();

    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);

    await screen.findByText("Ödemeye geçmek için koşulları onaylaman gerekiyor.");
    assert.equal(document.activeElement, checkbox());
    assert.deepEqual(posts, []);
  });

  it("sends the hours, the version it showed and a key that makes a retry the same purchase", async () => {
    renderPage();
    await untilConsentShown();
    fireEvent.click(checkbox());

    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);

    await waitFor(() => assert.equal(posts.length, 1));
    const [post] = posts;
    assert.equal(post.url, "/payments/package-purchases/");
    assert.equal(post.body.plan, "plan-90");
    assert.equal(post.body.policy_accepted_version, "p-current01");
    assert.deepEqual(post.body.schedule, {
      subject: SUBJECT,
      slots: [
        { slot_index: 0, day_of_week: 0, start_time: "10:00" },
        { slot_index: 1, day_of_week: 2, start_time: "10:00" },
      ],
    });
    assert.match(post.headers?.["Idempotency-Key"] ?? "", /^[A-Za-z0-9._:-]{1,128}$/);
  });

  it("holds the hours, says so, and goes to the payment page when it can be paid", async () => {
    renderPage();
    await untilConsentShown();
    fireEvent.click(checkbox());
    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);

    await screen.findByRole("heading", { name: "Saatlerin senin için ayrıldı" });
    await waitFor(() => assert.deepEqual(pushed, ["/package-purchases/purchase-9/pay"]));
    assert.doesNotMatch(text(), /Paket talebin oluşturuldu/);
  });

  it("forgets the key once the purchase is made, so buying again is a new purchase", async () => {
    renderPage();
    await untilConsentShown();
    fireEvent.click(checkbox());
    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);
    await screen.findByRole("heading", { name: "Saatlerin senin için ayrıldı" });

    const keys = Object.keys(window.sessionStorage).filter((key) => key.startsWith("hocam:purchase-key:"));
    assert.deepEqual(keys, []);
  });
});

describe("when the purchase is refused", () => {
  async function buyAndFailWith(status: number, data: unknown) {
    postResponse = () => failure(status, data);
    renderPage();
    await untilConsentShown();
    fireEvent.click(checkbox());
    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);
  }

  it("says the places are held by other checkouts, inline, and offers another tutor", async () => {
    await buyAndFailWith(409, { code: "capacity_full", reserved_by_others: true, detail: "x" });

    await screen.findByText(/Birkaç dakika sonra tekrar dene/);
    assert.equal(screen.getByRole("link", { name: "Başka hoca bul" }).getAttribute("href"), "/tutors");
    assert.deepEqual(pushed, []);
    assert.equal(Object.keys(window.sessionStorage).some((key) => key.startsWith("hocam:purchase-key:")), false);
  });

  it("sends the student back to the hours when one was taken, without moving them by itself", async () => {
    await buyAndFailWith(409, { code: "schedule_taken", detail: "x" });

    await screen.findByText(/Ders saatlerini yeniden seç/);
    const link = screen.getByRole("link", { name: "Saatlerimi yeniden seç" });
    assert.match(link.getAttribute("href") ?? "", /^\/tutors\/tutor-1\/checkout\/schedule\?/);
    assert.deepEqual(pushed, []);
  });

  it("points to the purchase that is already waiting for its payment", async () => {
    await buyAndFailWith(409, { code: "pending_purchase_exists", purchase_id: "purchase-5", detail: "x" });

    await screen.findByText(/Onu tamamla ya da iptal et/);
    assert.equal(
      screen.getByRole("link", { name: "Ödemeye devam et" }).getAttribute("href"),
      "/package-purchases/purchase-5/pay"
    );
  });

  it("clears the box and reads the rules again when they changed while the student read them", async () => {
    await buyAndFailWith(409, { code: "policy_version_changed", policy_version: "p-newer", detail: "x" });

    await screen.findByText(/Koşullar güncellendi/);
    await waitFor(() => assert.equal((checkbox() as HTMLInputElement).checked, false));
    await waitFor(() => assert.ok(policyReads >= 2, `policy read ${policyReads} times`));
  });

  it("keeps its key after a lost answer, so pressing again is the same purchase", async () => {
    postResponse = () => Promise.reject(new Error("Network Error"));
    renderPage();
    await untilConsentShown();
    fireEvent.click(checkbox());
    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);
    await screen.findByText(/Yeniden denemeden önce Paketlerim sayfasında/);
    const first = posts[0].headers?.["Idempotency-Key"];

    postResponse = () => ({ data: createdPurchase });
    fireEvent.click(payButtons("Ödeme yükümlülüğü ile devam et")[0]);

    await waitFor(() => assert.equal(posts.length, 2));
    assert.ok(first);
    assert.equal(posts[1].headers?.["Idempotency-Key"], first);
  });
});

describe("before there is anything to pay for", () => {
  it("asks for the hours first, and buys nothing without them", async () => {
    search = "per_week=2&duration=90";
    renderPage();
    await untilConsentShown();

    const buttons = payButtons("Önce ders programını seç") as HTMLButtonElement[];
    assert.ok(buttons.length >= 1);
    assert.ok(buttons.every((button) => button.disabled));
    assert.match(text(), /Ödemeye geçmeden önce ders programını seçmelisin/);
    assert.deepEqual(posts, []);
  });

  it("offers to continue paying when a purchase for this plan already waits for its payment", async () => {
    purchasesList = [{ ...createdPurchase, id: "purchase-5" }];
    renderPage();

    await screen.findByText("Ödemesi bekleyen bir satın alman var");
    assert.equal(
      screen.getByRole("link", { name: "Ödemeye devam et" }).getAttribute("href"),
      "/package-purchases/purchase-5/pay"
    );
  });
});

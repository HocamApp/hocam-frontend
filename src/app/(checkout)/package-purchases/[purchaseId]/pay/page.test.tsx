import "@/test/setupDom";

process.env.NEXT_PUBLIC_PAYTR_ENABLED = "true";

import assert from "node:assert/strict";
import { afterEach, before, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const routerCalls: string[] = [];
const getCalls: string[] = [];
const postCalls: Array<{ url: string; body: unknown }> = [];

type PostResult = { data: unknown } | { reject: unknown };

let purchaseStatus: PackagePurchase["status"] = "pending";
let purchasesResponse: () => unknown = () => [purchase()];
let acceptanceResponse: () => unknown = () => ({
  requires_tutor_acceptance: false,
  acceptance: null,
});
let postResult: () => PostResult = () => ({
  data: {
    merchant_oid: "HOCAM-OID-1",
    iframe_url: "https://www.paytr.com/odeme/guvenli/abc123token",
  },
});

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
    status: purchaseStatus,
    total_credits: 12,
    remaining_credits: purchaseStatus === "paid" ? 12 : 0,
    unit_price: 400,
    subtotal_price: 4800,
    discount_amount: 480,
    promo_discount_amount: 0,
    total_price: 4320,
    created_at: "2026-09-17T09:00:00Z",
    paid_at: purchaseStatus === "paid" ? "2026-09-17T09:20:00Z" : null,
    promotion_code: null,
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
  // The real payments/coaching API modules run against this fake transport, so
  // the URLs, payload shape and error mapping under test are the real ones.
  mock.module("@/lib/api", {
    defaultExport: {
      get: async (url: string) => {
        getCalls.push(url);
        if (url.includes("acceptance-status")) {
          return { data: await acceptanceResponse() };
        }
        return { data: await purchasesResponse() };
      },
      post: async (url: string, body: unknown) => {
        postCalls.push({ url, body });
        const result = postResult();
        if ("reject" in result) throw result.reject;
        return result;
      },
    },
    namedExports: { API_BASE_URL: "http://localhost:8000/api" },
  });

  ({ default: PayPage } = await import("./page"));
});

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

async function fillAndSubmit() {
  await waitFor(() => screen.getByLabelText("Ad soyad"));
  fireEvent.change(screen.getByLabelText("Ad soyad"), {
    target: { value: "Ada Yılmaz" },
  });
  fireEvent.change(screen.getByLabelText("Telefon"), {
    target: { value: "0555 111 22 33" },
  });
  fireEvent.change(screen.getByLabelText("Adres"), {
    target: { value: "Bağdat Caddesi 1, Kadıköy" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Güvenli ödemeye geç" }));
}

beforeEach(() => {
  routerCalls.length = 0;
  getCalls.length = 0;
  postCalls.length = 0;
  purchaseStatus = "pending";
  purchasesResponse = () => [purchase()];
  acceptanceResponse = () => ({
    requires_tutor_acceptance: false,
    acceptance: null,
  });
  postResult = () => ({
    data: {
      merchant_oid: "HOCAM-OID-1",
      iframe_url: "https://www.paytr.com/odeme/guvenli/abc123token",
    },
  });
  window.sessionStorage.clear();
});

afterEach(() => cleanup());

describe("payment page — before anything is submitted", () => {
  it("shows the form and the server's total, and asks for no token", async () => {
    renderPage();

    await waitFor(() => screen.getByLabelText("Ad soyad"));
    assert.ok(screen.getByText("4.320 ₺"));
    assert.equal(postCalls.length, 0);
  });

  it("does not open the form while the tutor has not answered", async () => {
    acceptanceResponse = () => ({
      requires_tutor_acceptance: true,
      acceptance: {
        id: "a-1",
        status: "pending",
        expires_at: "2026-09-19T09:00:00Z",
        responded_at: null,
        includes_coaching: false,
      },
    });
    renderPage();

    await waitFor(() => screen.getByText("Hoca onayı bekleniyor"));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
  });

  it("says nothing about a purchase that is not this student's", async () => {
    purchasesResponse = () => [];
    renderPage();

    await waitFor(() => screen.getByText("Paket görüntülenemiyor"));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
  });
});

describe("payment page — starting one attempt", () => {
  it("posts the customer fields once and embeds the returned form", async () => {
    renderPage();
    await fillAndSubmit();

    await waitFor(() => {
      assert.equal(
        document.querySelector("iframe")?.getAttribute("src"),
        "https://www.paytr.com/odeme/guvenli/abc123token"
      );
    });
    assert.deepEqual(postCalls, [
      {
        url: "/payments/package-purchases/purchase-1/paytr-checkout/",
        body: {
          user_name: "Ada Yılmaz",
          user_phone: "05551112233",
          user_address: "Bağdat Caddesi 1, Kadıköy",
        },
      },
    ]);
  });

  it("remembers the attempt without writing anything personal down", async () => {
    renderPage();
    await fillAndSubmit();

    await waitFor(() => assert.ok(document.querySelector("iframe")));
    const stored = Object.entries({ ...window.sessionStorage })
      .filter(([key]) => key.includes("paytr"))
      .map(([, value]) => value)
      .join("");
    assert.match(stored, /purchase-1/);
    assert.match(stored, /HOCAM-OID-1/);
    assert.doesNotMatch(stored, /Ada|05551112233|Bağdat|abc123token/);
  });

  it("buys one attempt however fast the button is clicked", async () => {
    renderPage();
    await fillAndSubmit();
    fireEvent.click(screen.getByRole("button", { name: /Güvenli ödemeye geç|Ödeme ekranı/ }));

    await waitFor(() => assert.ok(document.querySelector("iframe")));
    assert.equal(postCalls.length, 1);
  });

  it("refuses to embed an address it cannot verify", async () => {
    postResult = () => ({
      data: {
        merchant_oid: "HOCAM-OID-1",
        iframe_url: "https://paytr.example/odeme/guvenli/abc123token",
      },
    });
    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      screen.getByText("Ödeme ekranı güvenli şekilde açılamadı.")
    );
    assert.equal(document.querySelector("iframe"), null);
    assert.equal(postCalls.length, 1);
  });
});

describe("payment page — when the token request fails", () => {
  it("puts a field error back on the form and keeps it usable", async () => {
    postResult = () => ({
      reject: { response: { status: 400, data: { user_phone: "This field is required." } } },
    });
    renderPage();
    await fillAndSubmit();

    await waitFor(() => screen.getByText("Telefon numarası gerekli."));
    assert.equal(document.querySelector("iframe"), null);
    assert.ok(screen.getByRole("button", { name: "Güvenli ödemeye geç" }));
  });

  it("re-reads the server state on a 409 instead of arguing with it", async () => {
    let finish!: (value: unknown) => void;
    const delayed = new Promise((resolve) => { finish = resolve; });
    postResult = () => ({
      reject: {
        response: {
          status: 409,
          data: { detail: "Tutor acceptance is required before payment." },
        },
      },
    });
    renderPage();
    await waitFor(() => screen.getByLabelText("Ad soyad"));
    acceptanceResponse = () => delayed;
    await fillAndSubmit();

    await waitFor(() => assert.equal(postCalls.length, 1));
    const readsAfterFailure = getCalls.filter((url) =>
      url.includes("acceptance-status")
    ).length;
    await waitFor(() => {
      assert.ok(
        getCalls.filter((url) => url.includes("acceptance-status")).length >=
          readsAfterFailure
      );
    });
    assert.ok(screen.getByText("Paketin güncel durumu kontrol ediliyor."));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    assert.equal(postCalls.length, 1);
    finish({ requires_tutor_acceptance: false, acceptance: null });
    await waitFor(() => screen.getByLabelText("Ad soyad"));
  });

  it("offers a service outage a manual retry, not an automatic one", async () => {
    postResult = () => ({
      reject: { response: { status: 503, data: { detail: "PAYTR_MERCHANT_SALT missing" } } },
    });
    renderPage();
    await fillAndSubmit();

    await waitFor(() =>
      screen.getByText("Ödeme hizmeti şu anda kullanılamıyor.")
    );
    assert.equal(postCalls.length, 1);
    assert.doesNotMatch(document.body.textContent ?? "", /SALT/);
    assert.equal(screen.queryByRole("button", { name: "Güvenli ödemeye geç" }), null);
    fireEvent.click(screen.getByRole("button", { name: "Durumu kontrol et" }));
    await waitFor(() => screen.getByLabelText("Ad soyad"));
    assert.equal(postCalls.length, 1);
  });

  it("keeps a failed conflict refresh locked until a successful GET", async () => {
    postResult = () => {
      purchasesResponse = () => { throw new Error("offline"); };
      return { reject: { response: { status: 409 } } };
    };
    renderPage();
    await fillAndSubmit();
    await waitFor(() => screen.getByRole("button", { name: "Durumu kontrol et" }));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    purchasesResponse = () => [purchase()];
    fireEvent.click(screen.getByRole("button", { name: "Durumu kontrol et" }));
    await waitFor(() => screen.getByLabelText("Ad soyad"));
    assert.equal(postCalls.length, 1);
  });

  it("removes the form after a token 404 despite cached purchase data", async () => {
    postResult = () => ({ reject: { response: { status: 404 } } });
    renderPage();
    await fillAndSubmit();
    await waitFor(() => screen.getByText("Paket görüntülenemiyor"));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    assert.equal(postCalls.length, 1);
  });

  it("treats a lost response as unresolved and stops offering to pay", async () => {
    postResult = () => ({ reject: new Error("Network Error") });
    renderPage();
    await fillAndSubmit();

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    assert.equal(screen.queryByRole("button", { name: "Güvenli ödemeye geç" }), null);
    assert.equal(postCalls.length, 1);
  });
});

describe("payment page — coming back to an attempt", () => {
  it("does not restart fast polling for an old recovery after reload", async () => {
    window.sessionStorage.setItem("hocam:paytr-attempt:v1:student-1", JSON.stringify({
      schemaVersion: 1, purchaseId: "purchase-1", merchantOid: "HOCAM-OID-1",
      tutorId: "tutor-1", startedAt: Date.now() - 60_000,
    }));
    renderPage();
    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    const reads = getCalls.filter((url) => !url.includes("acceptance-status")).length;
    await new Promise((resolve) => setTimeout(resolve, 2200));
    assert.equal(getCalls.filter((url) => !url.includes("acceptance-status")).length, reads);
    assert.equal(postCalls.length, 0);
  });
  it("verifies a remembered attempt instead of starting another", async () => {
    window.sessionStorage.setItem(
      "hocam:paytr-attempt:v1:student-1",
      JSON.stringify({
        schemaVersion: 1,
        purchaseId: "purchase-1",
        merchantOid: "HOCAM-OID-1",
        tutorId: "tutor-1",
        startedAt: Date.now(),
      })
    );
    renderPage();

    await waitFor(() => screen.getByText("Ödeme sonucu doğrulanıyor"));
    assert.equal(screen.queryByLabelText("Ad soyad"), null);
    assert.equal(postCalls.length, 0);
  });

  it("replaces the frame with success once the backend says paid", async () => {
    renderPage();
    await fillAndSubmit();
    await waitFor(() => assert.ok(document.querySelector("iframe")));

    purchaseStatus = "paid";
    fireEvent.focus(window);

    await waitFor(() => screen.getByText("Ödemen onaylandı"), { timeout: 4000 });
    assert.equal(document.querySelector("iframe"), null);
  });
});

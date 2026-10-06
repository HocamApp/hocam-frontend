import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import type { PackagePurchase } from "@/types";

let CheckoutPurchaseSuccess: typeof import("./CheckoutSuccess").CheckoutPurchaseSuccess;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ CheckoutPurchaseSuccess } = await import("./CheckoutSuccess"));
});

afterEach(() => cleanup());

const purchase: PackagePurchase = {
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
};

describe("CheckoutPurchaseSuccess without a payment check (PayTR off)", () => {
  it("renders exactly what main renders", () => {
    const { container } = render(
      <CheckoutPurchaseSuccess purchase={purchase} tutorId="tutor-1" />
    );
    assert.equal(container.innerHTML, MAIN_MARKUP);
  });
});

// Captured from origin/main b34438a (CheckoutPurchaseSuccess before FE-1).
const MAIN_MARKUP =
  "<div class=\"rounded-card border text-card-foreground mx-auto max-w-lg rounded-card border-[var(--checkout-soft-line)] bg-[var(--checkout-card-surface)] shadow-none\"><div class=\"p-6 space-y-4 pt-6 text-center\"><div class=\"mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-[var(--checkout-advantage)] text-[var(--checkout-advantage-ink)]\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1em\" height=\"1em\" fill=\"currentColor\" viewBox=\"0 0 256 256\" class=\"h-6 w-6\" aria-hidden=\"true\"><path d=\"M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z\"></path></svg></div><div><h2 class=\"text-lg font-semibold\">Paket talebin oluşturuldu</h2><p class=\"mt-1 text-sm text-muted-foreground\">12 derslik talebini aldık. Güncel durumunu Paketlerim alanından takip edebilirsin.</p></div><dl class=\"space-y-2 text-left text-sm\"><div class=\"flex justify-between gap-4\"><dt class=\"text-muted-foreground\">Paket</dt><dd class=\"text-right\">Haftada 3 ders · 30 gün</dd></div><div class=\"flex justify-between gap-4\"><dt class=\"text-muted-foreground\">Toplam ders</dt><dd>12 ders</dd></div><div class=\"flex justify-between gap-4\"><dt class=\"text-muted-foreground\">Ders başına</dt><dd>400 ₺</dd></div><div class=\"flex justify-between gap-4\"><dt class=\"text-muted-foreground\">Ara toplam</dt><dd>4.800 ₺</dd></div><div class=\"flex justify-between gap-4\"><dt class=\"text-muted-foreground\">İndirim</dt><dd class=\"text-green-700 dark:text-green-400\">-480 ₺</dd></div><div data-orientation=\"horizontal\" role=\"none\" class=\"shrink-0 bg-border h-[1px] w-full !my-3\"></div><div class=\"flex justify-between gap-4 text-base font-semibold text-foreground\"><dt>Paket toplamı</dt><dd>4.320 ₺</dd></div></dl><p class=\"text-xs text-muted-foreground\">Tek seferlik ödeme. Paket otomatik yenilenmez. Kartından anlık ödeme alınmaz.</p><div class=\"grid gap-2 sm:grid-cols-2\"><a href=\"/profile/payments\" class=\"inline-flex items-center justify-center whitespace-nowrap rounded-pill font-medium ring-offset-background transition-colors duration-[--duration-state] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-line disabled:text-ink-mid h-10 px-7 text-[0.9375rem] rounded-pill bg-[var(--checkout-cta)] text-[var(--checkout-on-cta)] hover:bg-[var(--checkout-cta-hover)]\">Paketlerimi görüntüle</a><a href=\"/tutors/tutor-1\" class=\"inline-flex items-center justify-center whitespace-nowrap rounded-pill font-medium ring-offset-background transition-colors duration-[--duration-state] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-line disabled:text-ink-mid border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper h-10 px-7 text-[0.9375rem] rounded-pill\">Hoca profiline dön</a></div></div></div>";

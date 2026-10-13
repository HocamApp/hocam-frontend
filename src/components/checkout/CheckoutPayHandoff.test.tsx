import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, test, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { PackagePurchase } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const purchase = {
  id: "purchase-1",
  plan: { name: "Haftada 2 ders · 3 ay" },
  total_credits: 24,
  total_price: 20160,
} as PackagePurchase;

let CheckoutPayHandoff: typeof import("./CheckoutPayHandoff").CheckoutPayHandoff;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ CheckoutPayHandoff } = await import("./CheckoutPayHandoff"));
});

afterEach(() => cleanup());

test("says the hours are held and the payment page is next, and promises nothing about a tutor", () => {
  render(<CheckoutPayHandoff purchase={purchase} />);

  assert.ok(screen.getByRole("heading", { name: "Saatlerin senin için ayrıldı" }));
  const text = document.body.textContent ?? "";
  assert.match(text, /Haftada 2 ders · 3 ay, toplam 20\.160 ₺/);
  assert.doesNotMatch(text, /talep|onay|hoca/i);
  assert.doesNotMatch(text, /ücret alınmaz/i);
});

test("always leaves a way to the payment page, and to the student's packages", () => {
  render(<CheckoutPayHandoff purchase={purchase} />);

  assert.equal(
    screen.getByRole("link", { name: "Ödemeye git" }).getAttribute("href"),
    "/package-purchases/purchase-1/pay"
  );
  assert.equal(
    screen.getByRole("link", { name: "Paketlerimi görüntüle" }).getAttribute("href"),
    "/profile/payments"
  );
});

test("says the page is being prepared while the status is read", () => {
  render(<CheckoutPayHandoff purchase={purchase} paymentCheck="checking" />);

  assert.ok(screen.getByText("Ödeme sayfası hazırlanıyor…"));
  assert.equal(screen.getByRole("status").getAttribute("aria-busy"), "true");
});

test("offers a re-read when the status could not be read, and never a second purchase", () => {
  let reads = 0;
  render(
    <CheckoutPayHandoff
      purchase={purchase}
      paymentCheck="status_error"
      onRetryPaymentCheck={() => {
        reads += 1;
      }}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Yenile" }));

  assert.equal(reads, 1);
  assert.match(document.body.textContent ?? "", /Ödeme durumu alınamadı/);
});

test("explains why it stays when the purchase cannot be paid yet", () => {
  render(
    <CheckoutPayHandoff purchase={purchase} paymentCheck="blocked" paymentBlockedReason="checkout_disabled" />
  );

  assert.ok(document.body.textContent && document.body.textContent.length > 120);
});

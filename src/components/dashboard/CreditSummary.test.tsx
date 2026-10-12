import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { bookingsFixture, purchaseFixture } from "@/test/packageFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let CreditSummary: typeof import("./CreditSummary").CreditSummary;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ CreditSummary } = await import("./CreditSummary"));
});

afterEach(cleanup);

const IN_MINUTES = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function renderSummary(
  props: Partial<React.ComponentProps<typeof CreditSummary>> & {
    activePackage?: ReturnType<typeof purchaseFixture>;
  } = {}
) {
  const onSelect = mock.fn();
  const onRetry = mock.fn();
  render(
    <CreditSummary
      loading={false}
      error={false}
      onRetry={onRetry}
      onSelect={onSelect}
      bookings={[]}
      {...props}
    />
  );
  return { onSelect, onRetry };
}

describe("a package that is running", () => {
  it("is shown as active the minute it is paid for, with every lesson still ahead", () => {
    // Every lesson is on the calendar and no credit is left unscheduled: the
    // raw credits say 0, the lessons say 8.
    renderSummary({
      activePackage: purchaseFixture({ remaining_credits: 0 }),
      bookings: bookingsFixture("confirmed", 8),
    });

    assert.ok(screen.getByText("ders kaldı").parentElement?.textContent?.includes("8"));
    assert.ok(screen.getByText("0 / 8 kullanıldı"));
    assert.ok(screen.getByText("8 ders planlandı"));
    assert.equal(screen.queryByText(/henüz planlanmadı/), null);
  });

  it("counts the lessons already taken as used, and only those", () => {
    renderSummary({
      activePackage: purchaseFixture({ remaining_credits: 0 }),
      bookings: [...bookingsFixture("completed", 3), ...bookingsFixture("confirmed", 5)],
    });

    assert.ok(screen.getByText("3 / 8 kullanıldı"));
    assert.ok(screen.getByText("5 ders planlandı"));
    assert.ok(screen.getByLabelText("Paketin yüzde 38 kadarı kullanıldı"));
  });

  it("says how many lessons are not on a day yet", () => {
    renderSummary({
      activePackage: purchaseFixture({ remaining_credits: 2 }),
      bookings: bookingsFixture("confirmed", 6),
    });

    assert.ok(screen.getByText("6 ders planlandı · 2 ders henüz planlanmadı"));
    assert.ok(screen.getByText("0 / 8 kullanıldı"));
  });

  it("asks for a renewal when two lessons are left, not before", () => {
    renderSummary({
      activePackage: purchaseFixture({ remaining_credits: 0 }),
      bookings: [...bookingsFixture("completed", 6), ...bookingsFixture("confirmed", 2)],
    });
    assert.ok(screen.getByText("Paketin yakında yenilenmeli."));

    cleanup();
    renderSummary({
      activePackage: purchaseFixture({ remaining_credits: 0 }),
      bookings: [...bookingsFixture("completed", 5), ...bookingsFixture("confirmed", 3)],
    });
    assert.equal(screen.queryByText("Paketin yakında yenilenmeli."), null);
  });

  it("opens the package's details when it is pressed", () => {
    const active = purchaseFixture({ remaining_credits: 0 });
    const { onSelect } = renderSummary({ activePackage: active, bookings: bookingsFixture("confirmed", 8) });

    fireEvent.click(screen.getByRole("button", { name: /Paket detayları/ }));

    assert.equal(onSelect.mock.callCount(), 1);
    assert.equal(onSelect.mock.calls[0].arguments[0], active);
  });
});

describe("a package waiting for its payment", () => {
  it("sends the student to the payment page while the hours are held", () => {
    const deadline = IN_MINUTES(20);
    renderSummary({
      pendingPackage: purchaseFixture({ status: "pending", paid_at: null, payment_deadline: deadline }),
    });

    assert.ok(screen.getByText("Ödemeni tamamla"));
    assert.ok(screen.getByText(/Saatlerin senin için ayrıldı\. Son ödeme saati: \d{2}:\d{2}\./));
    assert.equal(
      screen.getByRole("link", { name: /Ödemeye devam et/ }).getAttribute("href"),
      "/package-purchases/purchase-1/pay"
    );
    assert.equal(screen.queryByText(/inceleniyor/), null);
  });

  it("gives the hours back and offers a fresh start once the deadline has passed", () => {
    renderSummary({
      pendingPackage: purchaseFixture({
        status: "pending",
        paid_at: null,
        payment_deadline: IN_MINUTES(-1),
      }),
    });

    assert.ok(screen.getByText("Ödeme süresi doldu"));
    assert.ok(screen.getByText(/yeniden herkese açıldı/));
    assert.equal(
      screen.getByRole("link", { name: /Yeniden başla/ }).getAttribute("href"),
      "/tutors/tutor-1/checkout/schedule?per_week=2&duration=28"
    );
  });

  it("keeps saying a request is under review when it waits for a tutor, not a payment", () => {
    renderSummary({
      pendingPackage: purchaseFixture({ status: "pending", paid_at: null, payment_deadline: null }),
    });

    assert.ok(screen.getByText("Paket talebin inceleniyor"));
    assert.equal(screen.queryByText("Ödemeni tamamla"), null);
  });
});

describe("while it loads or fails", () => {
  it("shows nothing but a placeholder while the packages load", () => {
    renderSummary({ loading: true });

    assert.equal(screen.queryByText(/ders kaldı/), null);
  });

  it("says the packages could not be loaded and lets the student try again", () => {
    const { onRetry } = renderSummary({ error: true });

    fireEvent.click(screen.getByRole("button", { name: "Tekrar dene" }));

    assert.ok(screen.getByText("Ders hakların yüklenemedi."));
    assert.equal(onRetry.mock.callCount(), 1);
  });

  it("is absent when there is no package at all", () => {
    renderSummary();

    assert.equal(document.body.textContent, "");
  });
});

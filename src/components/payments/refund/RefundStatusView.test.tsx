import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";

import type { RefundRequest } from "@/types";
import { calculation, refundRequest } from "@/test/refundFixtures";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let RefundStatusView: typeof import("./RefundStatusView").RefundStatusView;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ RefundStatusView } = await import("./RefundStatusView"));
});

afterEach(() => cleanup());

// A date far enough ahead that the answer is never "late" when the suite runs.
const FUTURE = "2099-01-01T09:00:00+00:00";

function show(refund: RefundRequest) {
  return render(<RefundStatusView refund={refund} />);
}

const text = () => document.body.textContent ?? "";

describe("a request waiting for an answer", () => {
  it("shows where it is, what was asked, and what would be cancelled", () => {
    show(refundRequest({ due_at: FUTURE }));

    assert.ok(screen.getByText("İnceleniyor", { selector: "div" }));
    const steps = screen.getByRole("list", { name: "İade sürecinin aşamaları" });
    assert.equal(within(steps).getAllByRole("listitem").length, 4);
    assert.equal(
      steps.querySelector('[aria-current="step"]')?.textContent?.startsWith("İnceleniyor"),
      true
    );
    assert.match(text(), /En geç 1 Ocak 2099 tarihine kadar yanıt alırsın/);

    assert.ok(screen.getByText("Talep ettiğin iade tutarı"));
    assert.ok(screen.getByText("6.800 ₺"));
    assert.ok(screen.getByText("8.500 ₺"));
    assert.match(text(), /Tutar, karar verilene kadar yapılan derslere göre değişebilir/);

    assert.ok(screen.getByRole("heading", { name: /İptal edilecek dersler/ }));
    assert.ok(screen.getByText("14 Ekim Çarşamba 18:00"));
    assert.ok(screen.getByRole("heading", { name: /Kullanılmış sayılan dersler/ }));
  });

  it("says the answer is late once its date has passed", () => {
    show(refundRequest({ due_at: "2020-01-01T09:00:00+00:00" }));
    assert.match(text(), /Yanıt için belirtilen tarih geçti/);
  });

  it("shows what the student wrote, and the reason in words", () => {
    show(
      refundRequest({
        due_at: FUTURE,
        reason: "tutor_issue",
        student_note: "Üç ders yapılmadı.\nHocaya ulaşamadım.",
      })
    );
    assert.ok(screen.getByText("Hocayla ilgili bir sorun var", { selector: "dd" }));
    assert.match(text(), /Üç ders yapılmadı\.\s*Hocaya ulaşamadım\./);
    assert.ok(screen.getByText("Ada Lovelace"));
  });
});

describe("a request that was approved or settled", () => {
  it("talks about the lessons in the past tense, and promises no day", () => {
    show(
      refundRequest({
        status: "approved",
        decided_at: "2026-10-12T07:00:00+00:00",
        due_at: FUTURE,
      })
    );

    assert.ok(screen.getByRole("heading", { name: /İptal edilen dersler/ }));
    assert.equal(screen.queryByText(/karar verilene kadar yapılan derslere göre/), null);
    assert.ok(screen.getByText("İade tutarı"));
    assert.match(text(), /İade ödeme yöntemine gönderilecek/);
    assert.match(text(), /bankana göre değişir/);
  });

  it("shows the date the money was sent", () => {
    show(
      refundRequest({
        status: "processed",
        decided_at: "2026-10-12T07:00:00+00:00",
        provider_refunded_at: "2026-10-13T10:00:00+00:00",
      })
    );
    assert.ok(screen.getByText("İade edildi", { selector: "div" }));
    assert.match(text(), /13 Ekim 2026 tarihinde iade ödeme yöntemine gönderildi/);
  });
});

describe("a refused request", () => {
  const refused = () =>
    refundRequest({
      status: "rejected",
      rejection_reason: "Dersler sürüyor, iade koşulları oluşmadı.",
      decided_at: "2026-10-12T07:00:00+00:00",
    });

  it("gives the reason staff wrote for the student, and what to do next", () => {
    show(refused());

    assert.ok(screen.getByRole("heading", { name: "Talebin kabul edilmedi" }));
    assert.match(text(), /Gerekçe: Dersler sürüyor, iade koşulları oluşmadı\./);
    assert.match(text(), /Paketin ve derslerin olduğu gibi devam ediyor/);
    assert.equal(
      screen.getByRole("link", { name: "Destek ekibine yaz" }).getAttribute("href"),
      "/support"
    );
  });

  it("shows no amount and no lessons for something that will not happen", () => {
    show(refused());

    assert.equal(screen.queryByText("Talep ettiğin iade tutarı"), null);
    assert.equal(screen.queryByText("6.800 ₺"), null);
    assert.equal(screen.queryByRole("heading", { name: /İptal edilecek dersler/ }), null);
    assert.equal(screen.queryByRole("heading", { name: /Kullanılmış sayılan dersler/ }), null);
  });
});

describe("what a student never sees", () => {
  it("does not draw staff's notes even if the data carried them", () => {
    const leaky = {
      ...refundRequest({ due_at: FUTURE }),
      admin_note: "ESKİ GİZLİ NOT",
      internal_note: "GİZLİ NOT",
      provider_reference: "PANEL-9",
      fault_party: "tutor",
    } as RefundRequest;
    show(leaky);

    assert.doesNotMatch(text(), /GİZLİ NOT|PANEL-9|fault/);
  });

  it("draws no booking identifier", () => {
    const withIds = refundRequest({
      due_at: FUTURE,
      calculation: calculation({
        cancelled_lessons: [
          { starts_at: "2026-10-14T15:00:00+00:00", why: "still_to_come", booking_id: "b-123" } as never,
        ],
      }),
    });
    show(withIds);
    assert.doesNotMatch(text(), /b-123/);
  });
});

describe("other shapes of request", () => {
  it("still shows the row's own numbers for a request without a stored working", () => {
    show(refundRequest({ due_at: FUTURE, calculation: null }));

    assert.ok(screen.getByText("6.800 ₺"));
    assert.match(text(), /hesaplama dökümü saklanmadan önce oluşturulmuştu/);
    assert.equal(screen.queryByRole("heading", { name: /İptal edilecek dersler/ }), null);
  });

  it("says the platform opened a request it opened", () => {
    show(refundRequest({ due_at: FUTURE, initiated_by: "platform", reason: "tutor_left" }));
    assert.match(text(), /Bu talebi senin adına biz açtık/);
    assert.ok(screen.getByText("Hoca platformdan ayrıldı", { selector: "dd" }));
  });

  it("opens with a single package link back", () => {
    show(refundRequest({ due_at: FUTURE }));
    assert.equal(
      screen.getByRole("link", { name: "Paketlerime dön" }).getAttribute("href"),
      "/profile/payments"
    );
  });
});

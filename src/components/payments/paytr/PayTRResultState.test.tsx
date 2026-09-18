import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

mock.module("next/link", {
  defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
});

let PayTRResultState: typeof import("./PayTRResultState").PayTRResultState;
let PayTRProcessingState: typeof import("./PayTRProcessingState").PayTRProcessingState;

before(async () => {
  ({ PayTRResultState } = await import("./PayTRResultState"));
  ({ PayTRProcessingState } = await import("./PayTRProcessingState"));
});

afterEach(() => cleanup());

describe("PayTRProcessingState", () => {
  it("announces the wait politely and offers no payment action", () => {
    const { container } = render(
      <PayTRProcessingState state={{ name: "starting_payment" }} />
    );

    const status = screen.getByRole("status");
    assert.match(status.textContent ?? "", /Ödeme ekranı hazırlanıyor…/);
    assert.match(status.textContent ?? "", /Güvenli ödeme formu açılıyor\./);
    assert.equal(container.querySelectorAll("button").length, 0);
  });
});

describe("PayTRResultState", () => {
  it("says what happened in words, not only in colour", () => {
    const { container } = render(
      <PayTRResultState state={{ name: "payment_paid" }} />
    );

    assert.ok(screen.getByRole("heading", { name: "Ödemen onaylandı" }));
    assert.ok(screen.getByText("Paketinin güncel durumunu Paketlerim'de görebilirsin."));
    assert.ok(container.querySelector("[aria-hidden='true']"));
  });

  it("sends a paid purchase to the packages page", () => {
    render(<PayTRResultState state={{ name: "payment_paid" }} />);

    assert.equal(
      screen.getByRole("link", { name: "Paketlerime git" }).getAttribute("href"),
      "/profile/payments"
    );
  });

  it("offers a re-check, never a new payment, while the result is unresolved", () => {
    const rechecks: number[] = [];
    render(
      <PayTRResultState
        state={{ name: "callback_pending" }}
        onRecheck={() => rechecks.push(1)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Durumu kontrol et" }));

    assert.equal(rechecks.length, 1);
    assert.equal(screen.queryByRole("button", { name: /Yeniden ödeme/ }), null);
  });

  it("offers one retry on a verified failure", () => {
    const retries: number[] = [];
    render(
      <PayTRResultState
        state={{ name: "attempt_failed" }}
        onRetry={() => retries.push(1)}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Yeniden ödeme başlat" }));

    assert.equal(retries.length, 1);
  });

  it("starts nothing new under manual review", () => {
    render(
      <PayTRResultState
        state={{ name: "manual_review" }}
        onRetry={() => assert.fail("manual review must not offer a retry")}
        onRecheck={() => {}}
      />
    );

    assert.equal(screen.queryByRole("button", { name: /Yeniden ödeme/ }), null);
    assert.ok(screen.getByRole("button", { name: "Durumu kontrol et" }));
  });

  it("names the acceptance outcome the mapper reported", () => {
    render(
      <PayTRResultState
        state={{ name: "acceptance_rejected", acceptanceStatus: "expired" }}
      />
    );

    assert.ok(screen.getByRole("heading", { name: "Talebin süresi doldu" }));
  });

  it("leaves out an action the caller cannot handle", () => {
    render(<PayTRResultState state={{ name: "callback_pending" }} />);

    assert.equal(screen.queryByRole("button", { name: "Durumu kontrol et" }), null);
    assert.ok(screen.getByRole("link", { name: "Paketlerime git" }));
  });
});

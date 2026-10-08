import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CoachingConfirmDialog } from "./CoachingConfirmDialog";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

after(() => window.close());
afterEach(cleanup);

describe("CoachingConfirmDialog", () => {
  it("runs the action only after the explicit confirm button", () => {
    let confirmed = 0;
    let cancelled = 0;
    render(
      <CoachingConfirmDialog
        open
        title="Koçluğu sonlandırmak istiyor musun?"
        description="Bu işlem geri alınamaz."
        confirmLabel="Sonlandırmayı iste"
        onConfirm={() => { confirmed += 1; }}
        onCancel={() => { cancelled += 1; }}
        isPending={false}
      />,
    );

    assert.ok(screen.getByRole("dialog", { name: "Koçluğu sonlandırmak istiyor musun?" }));
    assert.equal(document.activeElement, screen.getByRole("button", { name: "Vazgeç" }));

    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));
    assert.equal(confirmed, 0);
    assert.equal(cancelled, 1);

    fireEvent.click(screen.getByRole("button", { name: "Sonlandırmayı iste" }));
    assert.equal(confirmed, 1);
  });

  it("locks both buttons while the request is in flight", () => {
    render(
      <CoachingConfirmDialog
        open
        title="Talebi reddet"
        description="Öğrenciye bildirilir."
        confirmLabel="Reddet"
        onConfirm={() => {}}
        onCancel={() => {}}
        isPending
      />,
    );
    assert.equal((screen.getByRole("button", { name: "Reddet" }) as HTMLButtonElement).disabled, true);
    assert.equal((screen.getByRole("button", { name: "Vazgeç" }) as HTMLButtonElement).disabled, true);
  });
});

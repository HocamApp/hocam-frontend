import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

const routerCalls: string[] = [];
const acceptCalls: number[] = [];
const openChangeCalls: boolean[] = [];
const declineCalls: number[] = [];

let RetentionOfferDialog: React.ComponentType<{
  open: boolean;
  discountPercent: number;
  validityHours: number;
  onOpenChange: (open: boolean) => void;
  onDecline: () => void;
}> | null = null;

async function loadDialog() {
  if (RetentionOfferDialog) return;

  mock.module("next/navigation", {
    namedExports: {
      useRouter: () => ({
        push: (href: string) => routerCalls.push(href),
      }),
    },
  });
  mock.module("@/lib/paymentsApi", {
    namedExports: {
      acceptRetentionOffer: async () => {
        acceptCalls.push(1);
        return {
          promotion_code: "GUVEN20",
          plan_code: "weekly_1_30",
          discount_percent: 20,
          valid_until: "2026-08-10T00:00:00Z",
        };
      },
    },
  });

  RetentionOfferDialog = (
    await import("./RetentionOfferDialog")
  ).RetentionOfferDialog;
}

function renderDialog() {
  const DialogComponent = RetentionOfferDialog as NonNullable<
    typeof RetentionOfferDialog
  >;
  return render(
    <DialogComponent
      open
      discountPercent={20}
      validityHours={48}
      onOpenChange={(open) => openChangeCalls.push(open)}
      onDecline={() => declineCalls.push(1)}
    />
  );
}

beforeEach(async () => {
  await loadDialog();
  routerCalls.length = 0;
  acceptCalls.length = 0;
  openChangeCalls.length = 0;
  declineCalls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe("RetentionOfferDialog", () => {
  it("kabul ve red butonlarını eşit görünürlükte, doğru varyantlarla gösterir", () => {
    renderDialog();

    const accept = screen.getByRole("button", {
      name: "İndirimi kullan ve devam et",
    });
    const decline = screen.getByRole("button", {
      name: "Teşekkürler, hesabımı silmek istiyorum",
    });

    // Primary: brand-filled; decline: outline — both flex-1 (equal prominence).
    assert.ok(accept.className.includes("bg-brand-600"));
    assert.ok(accept.className.includes("flex-1"));
    assert.ok(decline.className.includes("border"));
    assert.ok(decline.className.includes("flex-1"));
  });

  it("dialog hiçbir yerinde destructive (kırmızı) token kullanmaz", () => {
    renderDialog();
    assert.ok(
      !document.body.innerHTML.includes("destructive"),
      "offer dialog must not contain destructive styling"
    );
  });

  it("kabul: API'yi çağırır ve hoca listesine yönlendirir", async () => {
    renderDialog();

    fireEvent.click(
      screen.getByRole("button", { name: "İndirimi kullan ve devam et" })
    );

    await waitFor(() => assert.equal(acceptCalls.length, 1));
    await waitFor(() =>
      assert.ok(
        routerCalls.includes("/tutors?offer=retention"),
        `expected routing to /tutors?offer=retention, got ${JSON.stringify(routerCalls)}`
      )
    );
    assert.equal(declineCalls.length, 0);
  });

  it("red: silme akışına devam eder, accept API'si çağrılmaz", async () => {
    renderDialog();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Teşekkürler, hesabımı silmek istiyorum",
      })
    );

    await waitFor(() => assert.equal(declineCalls.length, 1));
    assert.equal(acceptCalls.length, 0);
    assert.equal(routerCalls.length, 0);
  });

  it("X ile kapatma nötrdür: hiçbir API çağrısı yapılmaz, red sayılmaz", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() =>
      assert.ok(
        openChangeCalls.includes(false),
        "expected onOpenChange(false) on close"
      )
    );
    assert.equal(acceptCalls.length, 0);
    assert.equal(declineCalls.length, 0);
    assert.equal(routerCalls.length, 0);
  });
});

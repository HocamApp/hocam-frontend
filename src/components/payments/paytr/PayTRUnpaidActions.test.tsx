import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PayTRUnpaidActions } from "./PayTRUnpaidActions";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

afterEach(() => cleanup());

function renderActions(props: Partial<React.ComponentProps<typeof PayTRUnpaidActions>> = {}) {
  const intents: string[] = [];
  render(
    <PayTRUnpaidActions
      onConfirm={(intent) => intents.push(intent)}
      pending={null}
      error={null}
      {...props}
    />
  );
  return intents;
}

describe("changing the plan or giving up a purchase nobody has paid for", () => {
  it("offers both, and does nothing until one is confirmed", () => {
    const intents = renderActions();

    assert.ok(screen.getByRole("button", { name: "Planı değiştir" }));
    assert.ok(screen.getByRole("button", { name: "Satın almayı iptal et" }));
    assert.deepEqual(intents, []);
  });

  it("says what changing the plan does before it does it", () => {
    const intents = renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Planı değiştir" }));

    assert.match(document.body.textContent ?? "", /ayırdığımız saatler serbest kalır/);
    assert.deepEqual(intents, []);
    fireEvent.click(screen.getByRole("button", { name: "Planı değiştir" }));
    assert.deepEqual(intents, ["change"]);
  });

  it("says what giving up does before it does it", () => {
    const intents = renderActions();

    fireEvent.click(screen.getByRole("button", { name: "Satın almayı iptal et" }));

    assert.match(document.body.textContent ?? "", /ayırdığımız saatler yeniden herkese açılır/);
    fireEvent.click(screen.getByRole("button", { name: "Satın almayı iptal et" }));
    assert.deepEqual(intents, ["cancel"]);
  });

  it("lets the student back out", () => {
    const intents = renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Satın almayı iptal et" }));

    fireEvent.click(screen.getByRole("button", { name: "Vazgeç" }));

    assert.deepEqual(intents, []);
    assert.ok(screen.getByRole("button", { name: "Planı değiştir" }), "the two choices are back");
  });

  it("blocks a second press while one is being sent", () => {
    renderActions({ pending: "cancel" });

    const sending = screen.getByRole("button", { name: "İşleniyor" }) as HTMLButtonElement;
    assert.equal(sending.disabled, true);
    assert.equal(sending.getAttribute("aria-busy"), "true");
    assert.equal((screen.getByRole("button", { name: "Vazgeç" }) as HTMLButtonElement).disabled, true);
  });

  it("shows why it could not be done", () => {
    renderActions({ error: "Ödeme sürüyor, satın alma şu anda iptal edilemez." });

    assert.equal(screen.getByRole("alert").textContent, "Ödeme sürüyor, satın alma şu anda iptal edilemez.");
  });
});

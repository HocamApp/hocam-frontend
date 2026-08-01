import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CheckoutShell } from "./CheckoutShell";

afterEach(() => cleanup());

test("renders exploration and pricing as direct sibling panels without a hero", () => {
  render(
    <CheckoutShell
      palette="10"
      header={<header>Checkout header</header>}
      exploration={<div>Plan selection</div>}
      decision={<div>Pricing decision</div>}
    />
  );

  const exploration = screen.getByRole("region", { name: "Ders planı" });
  const decision = screen.getByRole("complementary", { name: "Paket kararı" });
  assert.equal(exploration.parentElement, decision.parentElement);
  assert.equal(exploration.closest("[data-checkout-palette]")?.getAttribute("data-checkout-palette"), "10");
  assert.equal(screen.queryByRole("heading", { name: "Ders planını oluştur" }), null);
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingOfferCard } from "./CoachingOfferCard";

after(() => window.close());
afterEach(cleanup);

describe("CoachingOfferCard", () => {
  it("keeps bundle context and canonical offer details visible", () => {
    render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "Haftada 1",
          sessionDurationMinutes: 30,
          priceDisplay: "250,00 ₺",
          isFree: false,
          examTypes: ["YKS", "DGS"],
          description: "Haftalık program takibi.",
          capacityAvailable: true,
        }}
        action={<button>Ders paketiyle koçluk al</button>}
      />
    );

    assert.ok(screen.getByText("Haftada 1 · 30 dakika"));
    assert.ok(screen.getByText("250,00 ₺"));
    assert.ok(screen.getByText("YKS"));
    assert.ok(screen.getByRole("button", { name: "Ders paketiyle koçluk al" }));
    assert.ok(screen.getByText(/yalnız ders paketiyle birlikte/i));
  });

  it("labels full capacity without inventing availability", () => {
    render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "İki haftada 1",
          sessionDurationMinutes: 30,
          priceDisplay: "0,00 ₺",
          isFree: true,
          examTypes: ["KPSS"],
          description: "",
          capacityAvailable: false,
        }}
      />
    );
    assert.ok(screen.getByText("Kontenjan dolu"));
    assert.ok(screen.getByText("Ders paketinle ücretsiz"));
  });
});

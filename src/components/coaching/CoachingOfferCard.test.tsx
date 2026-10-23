import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CoachingOfferCard } from "./CoachingOfferCard";

after(() => window.close());
afterEach(cleanup);

describe("CoachingOfferCard", () => {
  it("keeps the package relationship and canonical offer details visible", () => {
    render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "Haftada 1",
          sessionDurationMinutes: 30,
          priceMinor: 25000,
          isFree: false,
          examTypes: ["YKS", "DGS"],
          description: "Haftalık program takibi.",
          capacityAvailable: true,
        }}
        action={<button>Ders paketiyle koçluk al</button>}
      />
    );

    assert.ok(screen.getByText("Haftada 1"));
    assert.ok(screen.getByText("30 dakika"));
    assert.ok(screen.getByText("250,00 ₺"));
    assert.ok(screen.getByText("YKS"));
    assert.ok(screen.getByText("DGS"));
    assert.ok(screen.getByRole("heading", { name: "Planlı çalış, ilerlemeni görünür kıl" }));
    assert.ok(screen.getByRole("region", { name: "Koçluk ücret özeti" }));
    assert.ok(screen.getByText("Ders paketine ek hizmet"));
    assert.ok(screen.getByRole("button", { name: "Ders paketiyle koçluk al" }));
    assert.ok(screen.getByText(/yalnız ders paketiyle birlikte/i));
  });

  it("labels full capacity without inventing availability", () => {
    render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "İki haftada 1",
          sessionDurationMinutes: 30,
          priceMinor: 0,
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

  it("sets the price large in white on the pink band, inside the fee region", () => {
    render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "Haftada 1",
          sessionDurationMinutes: 30,
          priceMinor: 30000,
          isFree: false,
          examTypes: ["DGS"],
          description: "",
          capacityAvailable: true,
        }}
      />
    );

    const region = screen.getByRole("region", { name: "Koçluk ücret özeti" });
    const price = screen.getByText("300,00 ₺");
    assert.ok(region.contains(price));
    assert.ok(region.textContent?.includes("görüşme başına"));
    // Gold is a surface and never text, so the number is white, not yellow.
    assert.doesNotMatch(region.innerHTML, /gold/);
    assert.match(price.className, /\bfont-bold\b/);
    assert.match(price.className, /\btext-h2/);
    const band = screen.getByRole("heading", { name: "Çalışma Koçluğu" }).closest("div[class*='bg-pink']");
    assert.ok(band, "the heading sits on the pink band");
    assert.match(band!.className, /\btext-primary-foreground\b/);
    assert.ok(band!.contains(region), "the price lives on the band");
  });

  it("lists what is included in a bordered box with dash markers, no tick icons, sparkle or shadow", () => {
    const { container } = render(
      <CoachingOfferCard
        offer={{
          frequencyLabel: "Haftada 1",
          sessionDurationMinutes: 30,
          priceMinor: 30000,
          isFree: false,
          examTypes: ["DGS"],
          description: "",
          capacityAvailable: true,
        }}
      />
    );

    assert.ok(screen.getByText("Koçluğa dahil"));
    for (const item of ["Çalışma programı", "Deneme değerlendirmesi", "İlerleme raporu", "Kaynak takibi ve önerileri"]) {
      assert.ok(screen.getByText(item));
    }
    const card = container.firstElementChild as HTMLElement;
    assert.doesNotMatch(card.className, /shadow/);
    // The only icons left are the ones that carry meaning (the accordion caret).
    assert.equal(container.querySelectorAll("li svg").length, 0);
  });
});

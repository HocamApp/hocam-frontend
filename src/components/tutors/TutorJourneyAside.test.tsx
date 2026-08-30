import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { TutorJourneyAside } from "./TutorJourneyAside";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

after(() => window.close());
afterEach(cleanup);

describe("TutorJourneyAside", () => {
  it("presents progress without the unrelated duck mascot", () => {
    render(
      <TutorJourneyAside
        eyebrow="Profil yolculuğu"
        title="Profilin adım adım şekilleniyor."
        description="Her tamamlanan alan ilerlemeni artırır."
        progress={60}
        progressLabel="3/5 bölüm hazır"
        fact="Bilgilerini daha sonra güncelleyebilirsin."
      />,
    );

    assert.ok(screen.getByRole("progressbar", { name: "Profil ilerlemesi" }));
    assert.equal(
      screen.getByRole("progressbar", { name: "Profil ilerlemesi" }).getAttribute("aria-valuenow"),
      "60",
    );
    assert.ok(
      screen.getByRole("img", {
        name: "Öğretmen yolculuğunu anlatan çizim",
      }),
    );
    assert.equal(screen.queryByAltText(/ördek|maskot/i), null);
  });

  it("uses the pink journey hero and follows the desktop scroll without affecting mobile flow", () => {
    render(
      <TutorJourneyAside
        eyebrow="Profil kurulumu"
        title="Profilin adım adım şekilleniyor."
        description="Temel bilgilerini, verdiğin dersleri ve anlatım tarzını tek seferde ekle."
        progress={40}
        progressLabel="2/5 bölüm hazır"
        fact="Bilgilerini daha sonra güncelleyebilirsin."
      />,
    );

    const aside = screen.getByRole("complementary");
    assert.match(aside.className, /self-start/);
    assert.match(aside.className, /lg:sticky/);
    assert.match(aside.className, /lg:top-\[calc\(var\(--app-header-h\)\+24px\)\]/);

    const hero = screen.getByRole("heading", {
      name: "Profilin adım adım şekilleniyor.",
    }).parentElement;
    assert.ok(hero);
    assert.match(hero.className, /bg-pink/);
    assert.match(hero.className, /text-white/);
    assert.doesNotMatch(hero.className, /bg-ink/);
  });

  it("treats the gold-band sentence as a heading, not small helper copy", () => {
    render(
      <TutorJourneyAside
        eyebrow="Profil kurulumu"
        title="Profilin adım adım şekilleniyor."
        description="Temel bilgilerini ekle."
        progress={20}
        progressLabel="1/5 bölüm hazır"
        fact="Bilgilerini daha sonra güncelleyebilirsin."
      />,
    );

    const message = screen.getByText(
      "Her adım, öğrencinin seni daha doğru tanımasına yardım eder.",
    );
    assert.match(message.className, /text-xl/);
    assert.match(message.className, /font-bold/);
    assert.match(message.className, /text-gold-ink/);
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";

import { YsHowItWorks } from "./YsHowItWorks";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({
    matches: true,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => true,
  }),
});

class VisibleIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  constructor(_callback: IntersectionObserverCallback) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
  observe(_target: Element) {}
}

Object.defineProperty(globalThis, "IntersectionObserver", {
  value: VisibleIntersectionObserver,
  configurable: true,
});

afterEach(() => act(() => cleanup()));
after(() => window.close());

describe("YsHowItWorks", () => {
  it("presents the four-step Hocam journey with the approved copy", () => {
    render(<YsHowItWorks />);

    assert.ok(screen.getByRole("heading", { name: "Hocanı bul. Gerisi kolay." }));
    assert.ok(
      screen.getByText(
        "Sana uygun hocayı filtrele, ücretsiz deneme dersiyle tanış, paketini seç. Hocam’ın platformu üzerinden, tek tıkla derse katıl.",
      ),
    );

    for (const title of [
      "Hocanı bul",
      "Deneme dersiyle tanış",
      "Paketini seç",
      "Platformdan derse gir",
    ]) {
      assert.ok(screen.getByRole("tab", { name: new RegExp(title) }));
    }

    assert.ok(
      screen.getByText(
        "İstediğin dersi ve üniversite ile filtrele, hocaları karşılaştır, sana uygun olanı seç.",
      ),
    );
  });

  it("keeps the heading upright and on the design-system H2 scale", () => {
    render(<YsHowItWorks />);

    const heading = screen.getByRole("heading", { level: 2 });
    assert.equal(heading.querySelector(".italic"), null);
    assert.equal(heading.classList.contains("text-2xl"), true);
    assert.equal(heading.classList.contains("lg:text-[32px]"), true);
  });

  it("keeps the approved free-trial promise verbatim", () => {
    render(<YsHowItWorks />);

    act(() => fireEvent.click(screen.getByRole("tab", { name: /Deneme dersiyle tanış/ })));

    assert.ok(
      screen.getByText("İlk dersi ücretsiz dene, tarzını beğendiğinden emin ol."),
    );
  });

  it("maps every step to the intended real product screenshot", () => {
    render(<YsHowItWorks />);

    const expected = [
      ["Hocanı bul", "Hoca listesindeki filtreler ve hoca kartları", "01-tutor-list.png"],
      ["Deneme dersiyle tanış", "Nazlı Koç'un hoca profili", "02-nazli-profile.png"],
      ["Paketini seç", "Ders paketi ve paket süresi seçim ekranı", "03-package-selection.png"],
      ["Platformdan derse gir", "Öğrenci panelindeki derse katılma alanı", "04-lesson-dashboard.png"],
    ] as const;

    for (const [tabName, alt, filename] of expected) {
      act(() => fireEvent.click(screen.getByRole("tab", { name: new RegExp(tabName) })));
      const image = within(screen.getByRole("tabpanel")).getByRole("img", { name: alt });
      assert.ok(image.getAttribute("src")?.includes(filename));
    }
  });
});

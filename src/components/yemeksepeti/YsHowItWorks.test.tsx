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

    assert.ok(
      screen.getByRole("heading", {
        name: /Sen sadece seç, gün belirle, derse gir, öğren\./,
      }),
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
        "İstediğin dersi veya üniversiteyi filtrele, hocaları karşılaştır, sana uygun olanı seç.",
      ),
    );
  });

  it("keeps the heading upright and on the design-system display scale", () => {
    render(<YsHowItWorks />);

    const heading = screen.getByRole("heading", { level: 2 });
    assert.equal(heading.querySelector(".italic"), null);
    // The rotating word carries the four steps in the order the tablist
    // below repeats them, and one stable sentence covers all four for
    // assistive tech rather than a heading that rewrites itself.
    assert.match(
      heading.querySelector(".sr-only")?.textContent ?? "",
      /^Sen sadece seç, gün belirle, derse gir, öğren\.$/,
    );
    assert.equal(heading.classList.contains("text-[36px]"), true);
    assert.equal(heading.classList.contains("lg:text-[56px]"), true);
    // Display size without the tightening is the clearest "nobody adjusted
    // this" signal Poppins can give.
    assert.equal(heading.classList.contains("tracking-[-0.03em]"), true);
    assert.equal(heading.classList.contains("leading-[0.95]"), true);
  });

  it("keeps the rotating mobile heading in one stable two-row layout", () => {
    render(<YsHowItWorks />);

    const heading = screen.getByRole("heading", { level: 2 });
    const visualLayout = heading.querySelector(
      "span[aria-hidden='true'] > span",
    );
    const rotatingPill = visualLayout?.querySelector(".bg-pink");

    assert.ok(visualLayout);
    assert.equal(visualLayout.classList.contains("flex-col"), true);
    assert.equal(visualLayout.classList.contains("md:flex-row"), true);
    assert.equal(visualLayout.classList.contains("flex-wrap"), false);
    assert.ok(rotatingPill);
    assert.equal(rotatingPill.classList.contains("w-[17rem]"), true);
    assert.equal(rotatingPill.classList.contains("md:w-auto"), true);
  });

  it("keeps the approved free-trial promise verbatim", () => {
    render(<YsHowItWorks />);

    act(() => fireEvent.click(screen.getByRole("tab", { name: /Deneme dersiyle tanış/ })));

    assert.ok(
      screen.getByText("İlk dersini ücretsiz dene, hocanı beğendiğinden emin ol."),
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

  it("preloads every product screenshot before the first transition", () => {
    render(<YsHowItWorks />);

    const preloadImages = document.querySelectorAll(
      "[data-vertical-tabs-preload] img[loading='eager']",
    );
    assert.equal(preloadImages.length, 4);
  });
});

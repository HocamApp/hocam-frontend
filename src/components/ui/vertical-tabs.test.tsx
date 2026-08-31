import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, beforeEach, describe, it } from "node:test";
import React from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import { VerticalTabs, type VerticalTabItem } from "./vertical-tabs";

const ITEMS: VerticalTabItem[] = [
  {
    id: "01",
    title: "Birinci adım",
    description: "Birinci açıklama",
    imageSrc: "/first.png",
    imageAlt: "Birinci ekran",
  },
  {
    id: "02",
    title: "İkinci adım",
    description: "İkinci açıklama",
    imageSrc: "/second.png",
    imageAlt: "İkinci ekran",
  },
  {
    id: "03",
    title: "Üçüncü adım",
    description: "Üçüncü açıklama",
    imageSrc: "/third.png",
    imageAlt: "Üçüncü ekran",
  },
];

let reduceMotion = false;
let documentHidden = false;
let intersectionCallback: IntersectionObserverCallback | null = null;

class TestIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
  observe(_target: Element) {}
}

Object.defineProperties(globalThis, {
  IntersectionObserver: {
    value: TestIntersectionObserver,
    configurable: true,
  },
});

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: () => ({
    matches: reduceMotion,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => true,
  }),
});

Object.defineProperty(document, "hidden", {
  configurable: true,
  get: () => documentHidden,
});

function renderTabs(autoplayMs = 1_000) {
  return render(
    <VerticalTabs
      heading={<span>Nasıl işler</span>}
      intro="Kısa tanıtım"
      items={ITEMS}
      autoplayMs={autoplayMs}
    />,
  );
}

function activeTab() {
  return screen.getAllByRole("tab").find((tab) => tab.getAttribute("aria-selected") === "true");
}

function observerEntry(
  target: Element,
  isIntersecting: boolean,
): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();
  return {
    boundingClientRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: isIntersecting ? rect : new window.DOMRect(),
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

beforeEach(() => {
  reduceMotion = false;
  documentHidden = false;
  intersectionCallback = null;
});

afterEach(() => act(() => cleanup()));
after(() => window.close());

describe("VerticalTabs", () => {
  it("renders the first item as an accessible tab panel", () => {
    renderTabs();

    assert.equal(screen.getAllByRole("tab").length, 3);
    assert.ok(screen.getByRole("tab", { name: "01. Birinci adım" }));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);

    const panel = screen.getByRole("tabpanel");
    assert.equal(panel.getAttribute("aria-labelledby"), screen.getAllByRole("tab")[0].id);
    assert.ok(within(panel).getByRole("img", { name: "Birinci ekran" }));
  });

  it("activates a clicked tab and resets the visible panel", () => {
    renderTabs();

    act(() => fireEvent.click(screen.getByRole("tab", { name: /İkinci adım/ })));

    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);
    assert.ok(within(screen.getByRole("tabpanel")).getByRole("img", { name: "İkinci ekran" }));
    assert.ok(screen.getByText("İkinci açıklama"));
  });

  it("supports arrow, Home and End keys with automatic tab activation", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");

    act(() => tabs[0].focus());
    act(() => fireEvent.keyDown(tabs[0], { key: "ArrowDown" }));
    assert.equal(document.activeElement, tabs[1]);
    assert.equal(activeTab(), tabs[1]);

    act(() => fireEvent.keyDown(tabs[1], { key: "End" }));
    assert.equal(document.activeElement, tabs[2]);
    assert.equal(activeTab(), tabs[2]);

    act(() => fireEvent.keyDown(tabs[2], { key: "Home" }));
    assert.equal(document.activeElement, tabs[0]);
    assert.equal(activeTab(), tabs[0]);

    act(() => fireEvent.keyDown(tabs[0], { key: "ArrowUp" }));
    assert.equal(activeTab(), tabs[2]);
    assert.equal(screen.getByRole("tabpanel").firstElementChild?.getAttribute("data-direction"), "backward");

    act(() => fireEvent.keyDown(tabs[2], { key: "ArrowDown" }));
    assert.equal(activeTab(), tabs[0]);
    assert.equal(screen.getByRole("tabpanel").firstElementChild?.getAttribute("data-direction"), "forward");
  });

  it("advances on the autoplay interval and wraps to the first item", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    renderTabs();

    act(() => context.mock.timers.tick(1_000));
    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);

    act(() => context.mock.timers.tick(2_000));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);
    act(() => cleanup());
  });

  it("restarts a full autoplay interval after a manual selection", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    renderTabs();

    act(() => context.mock.timers.tick(800));
    act(() => fireEvent.click(screen.getByRole("tab", { name: /İkinci adım/ })));
    act(() => context.mock.timers.tick(800));
    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);

    act(() => context.mock.timers.tick(200));
    assert.equal(activeTab()?.textContent?.includes("Üçüncü adım"), true);
    act(() => cleanup());
  });

  it("restarts autoplay when the active tab is selected again", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    renderTabs();

    act(() => context.mock.timers.tick(800));
    act(() => fireEvent.click(screen.getByRole("tab", { name: /Birinci adım/ })));
    act(() => context.mock.timers.tick(800));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);

    act(() => context.mock.timers.tick(200));
    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);
    act(() => cleanup());
  });

  it("pauses autoplay while hovered or keyboard focus is inside", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    renderTabs();
    const region = screen.getByRole("region", { name: "Nasıl işler" });

    act(() => fireEvent.mouseEnter(region));
    act(() => context.mock.timers.tick(2_000));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);

    act(() => fireEvent.mouseLeave(region));
    act(() => context.mock.timers.tick(1_000));
    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);

    act(() => fireEvent.focusIn(region));
    act(() => context.mock.timers.tick(2_000));
    assert.equal(activeTab()?.textContent?.includes("İkinci adım"), true);
    act(() => cleanup());
  });

  it("pauses autoplay while off-screen or the document is hidden", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    renderTabs();
    const region = screen.getByRole("region", { name: "Nasıl işler" });

    act(() => {
      intersectionCallback?.(
        [observerEntry(region, false)],
        {} as IntersectionObserver,
      );
    });
    act(() => context.mock.timers.tick(2_000));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);

    act(() => {
      intersectionCallback?.(
        [observerEntry(region, true)],
        {} as IntersectionObserver,
      );
    });
    documentHidden = true;
    act(() => fireEvent(document, new window.Event("visibilitychange")));
    act(() => context.mock.timers.tick(2_000));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);
    act(() => cleanup());
  });

  it("disables autoplay when reduced motion is requested", (context) => {
    context.mock.timers.enable({ apis: ["setInterval"] });
    reduceMotion = true;
    renderTabs();

    act(() => context.mock.timers.tick(5_000));
    assert.equal(activeTab()?.textContent?.includes("Birinci adım"), true);

    act(() => fireEvent.click(screen.getByRole("tab", { name: /İkinci adım/ })));
    assert.ok(within(screen.getByRole("tabpanel")).getByRole("img", { name: "İkinci ekran" }));
    act(() => cleanup());
  });
});

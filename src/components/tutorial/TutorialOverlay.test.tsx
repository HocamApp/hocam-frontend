import "@/test/setupDom";

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { TutorialOverlay } from "./TutorialOverlay";

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

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

after(() => window.close());
afterEach(cleanup);

describe("TutorialOverlay", () => {
  it("uses theme-owned overlay and spotlight colors instead of literal black", () => {
    const { container } = render(
      <TutorialOverlay
        rects={[{ x: 10, y: 20, width: 100, height: 40 }]}
        shielded={false}
      />,
    );

    const overlay = container.querySelector("svg > rect[mask]");
    const ring = container.querySelector('svg > rect[fill="none"]');
    assert.equal(overlay?.getAttribute("fill"), "var(--tutorial-overlay)");
    assert.equal(overlay?.hasAttribute("opacity"), false);
    assert.equal(ring?.getAttribute("stroke"), "var(--tutorial-spotlight-ring)");
  });

  it("uses one calm focus ring around adjacent targets instead of overlapping rings", () => {
    const { container } = render(
      <TutorialOverlay
        rects={[
          { x: 10, y: 20, width: 100, height: 40 },
          { x: 106, y: 20, width: 160, height: 40 },
        ]}
        shielded={false}
      />,
    );

    const rings = container.querySelectorAll('svg > rect[fill="none"]');
    assert.equal(rings.length, 1);
    assert.equal(rings[0]?.getAttribute("x"), "10");
    assert.equal(rings[0]?.getAttribute("width"), "256");
  });

  it("dims with a translucent ink veil instead of washing the lesson out", () => {
    const css = readFileSync(
      new URL("../../app/globals.css", import.meta.url),
      "utf8",
    );

    assert.match(css, /--tutorial-overlay:\s*rgb\(2 23 26 \/ 34%\)/);
    assert.match(css, /\.dark[\s\S]*--tutorial-overlay:\s*rgb\(2 8 10 \/ 46%\)/);
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";

import { HomeRail } from "./HomeRail";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

// jsdom has no layout engine, so ResizeObserver never fires and every element
// reports zero size. That is exactly the "nothing to scroll" case, which is
// what the bounds assertions below pin down.
class NoopResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, "ResizeObserver", {
  value: NoopResizeObserver,
  configurable: true,
});
Object.defineProperty(window, "ResizeObserver", {
  value: NoopResizeObserver,
  configurable: true,
});

afterEach(() => cleanup());

test("renders its children inside a labelled scroll region", () => {
  render(
    <HomeRail label="Öne çıkan hocalar">
      <div>Kart 1</div>
      <div>Kart 2</div>
    </HomeRail>
  );

  const region = screen.getByRole("group", { name: "Öne çıkan hocalar" });
  assert.ok(region);
  assert.ok(screen.getByText("Kart 1"));
  assert.ok(screen.getByText("Kart 2"));
});

test("both arrows are disabled when there is nothing to scroll", () => {
  render(
    <HomeRail label="Hedef kartları">
      <div>Kart</div>
    </HomeRail>
  );

  const prev = screen.getByRole("button", { name: "Önceki kartlar" }) as HTMLButtonElement;
  const next = screen.getByRole("button", { name: "Sonraki kartlar" }) as HTMLButtonElement;

  assert.equal(prev.disabled, true);
  assert.equal(next.disabled, true);
});

test("the next arrow enables once the content overflows", () => {
  render(
    <HomeRail label="Sınav hedefleri">
      <div>Kart</div>
    </HomeRail>
  );

  const region = screen.getByRole("group", { name: "Sınav hedefleri" });
  Object.defineProperty(region, "scrollWidth", { value: 900, configurable: true });
  Object.defineProperty(region, "clientWidth", { value: 300, configurable: true });
  act(() => {
    region.dispatchEvent(new window.Event("scroll", { bubbles: true }));
  });

  const next = screen.getByRole("button", { name: "Sonraki kartlar" }) as HTMLButtonElement;
  const prev = screen.getByRole("button", { name: "Önceki kartlar" }) as HTMLButtonElement;

  assert.equal(next.disabled, false, "next should enable when content overflows");
  assert.equal(prev.disabled, true, "prev stays disabled at scrollLeft 0");
});

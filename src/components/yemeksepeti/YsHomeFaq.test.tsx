import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render } from "@testing-library/react";

import { YS_HOME_FAQ_ITEMS, YsHomeFaq } from "./YsHomeFaq";

/* Globals this tree needs that the shared jsdom setup does not provide:
   `next/link` prefetches via `requestIdleCallback`, which reads `self`, and
   Radix Collapsible measures with `requestAnimationFrame`. Shimmed here rather
   than in `@/test/setupDom` so the one consumer carries its own cost. */
if (!("self" in globalThis)) {
  Object.defineProperty(globalThis, "self", { value: globalThis.window, configurable: true });
}
if (typeof globalThis.requestAnimationFrame !== "function") {
  Object.defineProperties(globalThis, {
    requestAnimationFrame: {
      value: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number,
      configurable: true,
    },
    cancelAnimationFrame: {
      value: (handle: number) => clearTimeout(handle as unknown as NodeJS.Timeout),
      configurable: true,
    },
  });
}

after(() => window.close());
afterEach(() => cleanup());

/**
 * These assertions are the cheap guard against the failure mode this copy is
 * most exposed to: someone edits an answer, or the product changes, and the
 * homepage quietly starts promising something Hocam does not do.
 */
describe("YsHomeFaq", () => {
  it("renders every question", () => {
    const { container } = render(<YsHomeFaq />);
    for (const item of YS_HOME_FAQ_ITEMS) {
      assert.ok(
        container.textContent?.includes(item.title),
        `missing question: ${item.title}`,
      );
    }
  });

  it("gives every item a unique id", () => {
    const ids = YS_HOME_FAQ_ITEMS.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  /* Radix keeps collapsed answers out of the DOM, so reading the rendered
     accordion would silently test almost nothing. Render the answer nodes
     directly instead — that is where the claims actually live. */
  const answersText = () => {
    const { container } = render(
      <div>
        {YS_HOME_FAQ_ITEMS.map((item) => (
          <div key={item.id}>
            {item.title}
            {item.content}
          </div>
        ))}
      </div>,
    );
    return container.textContent ?? "";
  };

  it("states the facts the backend actually enforces", () => {
    const text = answersText();
    for (const fact of ["20 dakika", "40 dakika", "%30", "12 saat", "14 gün", ".edu.tr"]) {
      assert.ok(text.includes(fact), `missing fact: ${fact}`);
    }
  });

  it("never claims something the codebase cannot back up", () => {
    const text = answersText().toLocaleLowerCase("tr");

    // No payment provider is connected, so nothing about money moving.
    // Coaching sits behind two flags that both default to off.
    // No SLA constant exists anywhere, so no turnaround promise.
    // Prices live on mutable tutor profiles, so no fixed figure.
    const forbidden = [
      "₺",
      "iade",
      "kredi kartı",
      "banka kartı",
      "havale",
      "iyzico",
      "koçluk",
      "garanti",
      "iş günü",
      "saat içinde",
      "mobil uygulama",
    ];

    for (const term of forbidden) {
      assert.ok(!text.includes(term), `FAQ must not mention "${term}"`);
    }
  });
});

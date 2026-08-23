import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";

import { useDelayedVisible } from "./useDelayedVisible";

after(() => window.close());
afterEach(() => cleanup());

function Probe({ active, delayMs }: { active: boolean; delayMs?: number }) {
  const visible = useDelayedVisible(active, delayMs);
  return <span data-testid="state">{visible ? "visible" : "hidden"}</span>;
}

const state = () => screen.getByTestId("state").textContent;

/** Advances fake time inside act() so React flushes the resulting state. */
async function advance(ms: number) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("useDelayedVisible", () => {
  it("stays hidden while inactive", async () => {
    render(<Probe active={false} delayMs={50} />);
    await advance(120);
    assert.equal(state(), "hidden");
  });

  it("holds the placeholder back for the whole delay, then shows it", async () => {
    const { rerender } = render(<Probe active={false} delayMs={80} />);

    rerender(<Probe active delayMs={80} />);
    assert.equal(state(), "hidden", "must not paint on the same tick as the request");

    await advance(40);
    assert.equal(state(), "hidden", "still inside the grace window");

    await advance(80);
    assert.equal(state(), "visible");
  });

  it("never shows when the wait resolves inside the grace window", async () => {
    const { rerender } = render(<Probe active={false} delayMs={80} />);

    // A fast response: active flips on and back off before the delay elapses.
    rerender(<Probe active delayMs={80} />);
    await advance(30);
    rerender(<Probe active={false} delayMs={80} />);

    await advance(120);
    assert.equal(state(), "hidden", "a sub-threshold wait must not flash a skeleton");
  });

  it("hides again as soon as the wait ends", async () => {
    const { rerender } = render(<Probe active delayMs={40} />);
    await advance(80);
    assert.equal(state(), "visible");

    rerender(<Probe active={false} delayMs={40} />);
    assert.equal(state(), "hidden", "placeholder must not outlive the data it stood in for");
  });
});

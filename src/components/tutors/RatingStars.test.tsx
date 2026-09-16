import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { RatingStars } from "./RatingStars";

after(() => window.close());
afterEach(cleanup);

/** Fraction of each star that is painted, left to right. */
function fills(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll("svg")).map(
    // Rounded: 4.3 - 4 is 0.2999999999999998 in binary floating point.
    (svg) => Math.round(Number(svg.getAttribute("data-fill")) * 100) / 100
  );
}

describe("RatingStars", () => {
  it("fills the last star by the leftover fraction instead of rounding", () => {
    // 4.3 used to render as four stars (a star it had earned, lost) and 4.8
    // as five (a perfect score it had not).
    const { container } = render(<RatingStars rating={4.3} />);
    assert.deepEqual(fills(container), [1, 1, 1, 1, 0.3]);
    cleanup();

    const high = render(<RatingStars rating={4.8} />);
    assert.deepEqual(fills(high.container), [1, 1, 1, 1, 0.8]);
    cleanup();

    const half = render(<RatingStars rating={4.5} />);
    assert.deepEqual(fills(half.container), [1, 1, 1, 1, 0.5]);
  });

  it("renders whole and empty ratings exactly", () => {
    const { container } = render(<RatingStars rating={5} />);
    assert.deepEqual(fills(container), [1, 1, 1, 1, 1]);
    cleanup();

    const none = render(<RatingStars rating={0} />);
    assert.deepEqual(fills(none.container), [0, 0, 0, 0, 0]);
  });

  it("always draws five outlined stars, so 4.0 does not read as a four-star scale", () => {
    const { container } = render(<RatingStars rating={4} />);
    const outlines = container.querySelectorAll('path[stroke="currentColor"]');
    assert.equal(outlines.length, 5);
    assert.match(container.querySelector("svg")?.getAttribute("class") ?? "", /text-pink/);
  });

  it("announces the score with a Turkish decimal comma", () => {
    render(<RatingStars rating={4.25} />);
    assert.ok(screen.getByRole("img", { name: "5 üzerinden 4,3" }));
  });

  it("clamps nonsense input rather than drawing six stars", () => {
    const { container } = render(<RatingStars rating={7} />);
    assert.deepEqual(fills(container), [1, 1, 1, 1, 1]);
    cleanup();

    const negative = render(<RatingStars rating={-2} />);
    assert.deepEqual(fills(negative.container), [0, 0, 0, 0, 0]);
    cleanup();

    const missing = render(<RatingStars rating={Number.NaN} />);
    assert.deepEqual(fills(missing.container), [0, 0, 0, 0, 0]);
  });

  it("offers three sizes", () => {
    const { container } = render(<RatingStars rating={3} size="lg" />);
    assert.equal(container.querySelector("svg")?.getAttribute("width"), "22");
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { StreakBadge } from "./streak-badge";

afterEach(() => cleanup());
after(() => window.close());

describe("StreakBadge", () => {
  it("names the streak once for assistive tech and hides the split-up parts", () => {
    render(<StreakBadge length={7} />);

    const badge = screen.getByRole("status");
    assert.equal(badge.getAttribute("aria-label"), "7 günlük çalışma serisi");
    // The number and the unit are two spans for typographic reasons; a screen
    // reader must not read them as separate facts.
    for (const child of Array.from(badge.querySelectorAll("span"))) {
      if (child.textContent?.trim()) {
        assert.equal(child.closest("[aria-hidden]") !== null, true);
      }
    }
  });

  it("does not pluralise the unit, because Turkish does not", () => {
    render(<StreakBadge length={1} />);
    assert.equal(screen.getByRole("status").textContent?.includes("gün"), true);
    assert.equal(screen.getByRole("status").textContent?.includes("günler"), false);
  });

  it("renders one line in the compact size and drops the subtitle", () => {
    render(<StreakBadge size="compact" length={12} subtitle="seri" />);

    const badge = screen.getByRole("status");
    assert.equal(badge.className.includes("rounded-pill"), true);
    assert.equal(badge.className.includes("flex-col"), false);
    assert.equal(badge.textContent?.includes("seri"), false);
  });

  it("keeps the stacked sizes on the card radius with a hairline and no shadow", () => {
    render(<StreakBadge length={3} subtitle="seri" />);

    const badge = screen.getByRole("status");
    assert.equal(badge.className.includes("rounded-card"), true);
    assert.equal(badge.className.includes("border-line"), true);
    assert.equal(badge.className.includes("shadow"), false);
    assert.equal(badge.textContent?.includes("seri"), true);
  });

  it("counts weeks and months when asked to", () => {
    render(<StreakBadge length={4} frequency="weekly" />);
    assert.equal(
      screen.getByRole("status").getAttribute("aria-label"),
      "4 haftalık çalışma serisi",
    );
  });

  it("uses tabular figures, since the number sits in a fixed navbar slot", () => {
    render(<StreakBadge size="compact" length={9} />);
    const value = screen.getByRole("status").querySelector(".tabular-nums");
    assert.ok(value);
  });
});

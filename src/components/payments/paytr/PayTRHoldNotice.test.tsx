import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";

import { formatCountdown, holdPhase, useHoldCountdown } from "./useHoldCountdown";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

let PayTRHoldNotice: typeof import("./PayTRHoldNotice").PayTRHoldNotice;

before(async () => {
  mock.module("next/link", {
    defaultExport: ({ href, children, ...props }: React.ComponentProps<"a">) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  });
  ({ PayTRHoldNotice } = await import("./PayTRHoldNotice"));
});

afterEach(() => {
  cleanup();
  mock.timers.reset();
});

const MINUTE = 60_000;

describe("how the time left is written", () => {
  it("is minutes and seconds, padded, and never negative", () => {
    assert.equal(formatCountdown(25 * MINUTE), "25:00");
    assert.equal(formatCountdown(7 * MINUTE + 42_000), "07:42");
    assert.equal(formatCountdown(9_001), "00:10", "a started second counts as a second");
    assert.equal(formatCountdown(0), "00:00");
    assert.equal(formatCountdown(-5_000), "00:00");
  });

  it("adds the hour for an hour or more", () => {
    assert.equal(formatCountdown(61 * MINUTE + 5_000), "1:01:05");
  });

  it("names how urgent it is", () => {
    assert.equal(holdPhase(25 * MINUTE), "normal");
    assert.equal(holdPhase(5 * MINUTE + 1), "normal");
    assert.equal(holdPhase(5 * MINUTE), "soon");
    assert.equal(holdPhase(61_000), "soon");
    assert.equal(holdPhase(60_000), "last");
    assert.equal(holdPhase(1), "last");
    assert.equal(holdPhase(0), "expired");
    assert.equal(holdPhase(-1), "expired");
  });
});

describe("the notice above the form", () => {
  it("shows nothing for a purchase that holds no hours", () => {
    const { container } = render(<PayTRHoldNotice msLeft={null} restartHref="/x" />);
    assert.equal(container.textContent, "");
  });

  it("says what is kept, how long is left, and what happens at zero", () => {
    render(<PayTRHoldNotice msLeft={12 * MINUTE + 3_000} restartHref="/x" />);

    assert.ok(screen.getByText("Saatlerin senin için ayrıldı"));
    assert.equal(screen.getByRole("timer").textContent, "12:03");
    assert.match(document.body.textContent ?? "", /Süre dolunca saatler yeniden herkese açılır/);
  });

  it("keeps the timer silent and speaks only when the time crosses five and one minutes", () => {
    const { rerender } = render(<PayTRHoldNotice msLeft={12 * MINUTE} restartHref="/x" />);
    assert.equal(screen.getByRole("timer").getAttribute("aria-live"), "off");
    assert.equal(screen.getByRole("status").textContent, "");

    rerender(<PayTRHoldNotice msLeft={4 * MINUTE} restartHref="/x" />);
    assert.equal(screen.getByRole("status").textContent, "Ödeme süresinin bitmesine 5 dakikadan az kaldı.");

    rerender(<PayTRHoldNotice msLeft={30_000} restartHref="/x" />);
    assert.equal(screen.getByRole("status").textContent, "Ödeme süresinin bitmesine 1 dakikadan az kaldı.");
  });

  it("at zero becomes the way back to choosing hours", () => {
    render(<PayTRHoldNotice msLeft={0} restartHref="/tutors/t1/checkout/schedule?per_week=2" />);

    assert.ok(screen.getByRole("heading", { name: "Saatlerin süresi doldu" }));
    assert.equal(screen.queryByRole("timer"), null);
    assert.equal(
      screen.getByRole("link", { name: "Yeniden başla" }).getAttribute("href"),
      "/tutors/t1/checkout/schedule?per_week=2"
    );
    assert.equal(screen.getByRole("link", { name: "Paketlerim" }).getAttribute("href"), "/profile/payments");
  });

  it("keeps to the house rules: no exclamation mark, no em dash, no emoji", () => {
    const emoji = new RegExp("\\p{Extended_Pictographic}", "u");
    for (const ms of [12 * MINUTE, 4 * MINUTE, 30_000, 0]) {
      const { container, unmount } = render(<PayTRHoldNotice msLeft={ms} restartHref="/x" />);
      const text = container.textContent ?? "";
      assert.doesNotMatch(text, /!/);
      assert.doesNotMatch(text, /—/);
      assert.doesNotMatch(text, emoji);
      unmount();
    }
  });
});

describe("the countdown", () => {
  function Probe({ deadline, now }: { deadline: number | null; now: () => number }) {
    const left = useHoldCountdown(deadline, now);
    return <p data-testid="left">{left === null ? "none" : String(left)}</p>;
  }

  it("counts down once a second against the clock it is given", () => {
    mock.timers.enable({ apis: ["setInterval"] });
    let clock = 1_000_000;
    render(<Probe deadline={clock + 10_000} now={() => clock} />);
    assert.equal(screen.getByTestId("left").textContent, "10000");

    act(() => {
      clock += 3_000;
      mock.timers.tick(1000);
    });
    assert.equal(screen.getByTestId("left").textContent, "7000");

    act(() => {
      clock += 8_000;
      mock.timers.tick(1000);
    });
    assert.equal(screen.getByTestId("left").textContent, "-1000", "it goes past zero; the page decides what that means");
  });

  it("is null without a deadline", () => {
    render(<Probe deadline={null} now={() => 0} />);
    assert.equal(screen.getByTestId("left").textContent, "none");
  });
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { TutorCheckoutCta } from "./TutorCheckoutCta";

afterEach(cleanup);

function renderCta(overrides: Partial<React.ComponentProps<typeof TutorCheckoutCta>> = {}) {
  const starts: string[] = [];
  render(
    <TutorCheckoutCta
      href="/tutors/tutor-1/checkout?learning_goal_id=goal-1&learning_milestone_id=milestone-1&learning_topic_id=topic-1"
      offersCoaching
      checkoutState="enabled"
      onStart={(href) => starts.push(href)}
      {...overrides}
    />
  );
  return starts;
}

test("blocks an eligible tutor reservation while the Coaching checkout flag is loading", () => {
  const starts = renderCta({ checkoutState: "loading" });
  const cta = screen.getByRole("button", { name: "Hazırlanıyor…" }) as HTMLButtonElement;

  assert.equal(cta.disabled, true);
  assert.equal(cta.getAttribute("aria-busy"), "true");
  fireEvent.click(cta);
  assert.deepEqual(starts, []);
});

test("starts the Coaching pre-step only after an eligible tutor resolves checkout as enabled", () => {
  const starts = renderCta({
    href: "/tutors/tutor-1/checkout/coaching?learning_goal_id=goal-1&learning_milestone_id=milestone-1&learning_topic_id=topic-1",
  });

  fireEvent.click(screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }));
  assert.deepEqual(starts, [
    "/tutors/tutor-1/checkout/coaching?learning_goal_id=goal-1&learning_milestone_id=milestone-1&learning_topic_id=topic-1",
  ]);
});

test("starts ordinary checkout after an eligible tutor resolves checkout as disabled", () => {
  const starts = renderCta({ checkoutState: "disabled" });

  fireEvent.click(screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }));
  assert.deepEqual(starts, [
    "/tutors/tutor-1/checkout?learning_goal_id=goal-1&learning_milestone_id=milestone-1&learning_topic_id=topic-1",
  ]);
});

test("does not wait for the Coaching flag when a tutor does not offer Coaching", () => {
  const starts = renderCta({ offersCoaching: false, checkoutState: "loading" });
  const cta = screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }) as HTMLButtonElement;

  assert.equal(cta.disabled, false);
  fireEvent.click(cta);
  assert.equal(starts.length, 1);
});

test("does not start discovery navigation when the runtime flag request has failed", () => {
  const starts = renderCta({ checkoutState: "error" });
  const cta = screen.getByRole("button", { name: "Koçluk bilgisi yüklenemedi" }) as HTMLButtonElement;

  assert.equal(cta.disabled, true);
  fireEvent.click(cta);
  assert.deepEqual(starts, []);
});

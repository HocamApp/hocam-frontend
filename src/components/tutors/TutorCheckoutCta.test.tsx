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

test("with online payment closed for this student, a lesson-only tutor shows coming soon and starts nothing", () => {
  const starts = renderCta({ offersCoaching: false, checkoutState: "disabled", lessonPayment: "closed" });
  const cta = screen.getByRole("button", { name: "Ders paketleri yakında" }) as HTMLButtonElement;

  assert.equal(cta.disabled, true);
  fireEvent.click(cta);
  assert.deepEqual(starts, []);
});

test("a visitor who is not signed in is in the same closed state, so sees coming soon", () => {
  // useCheckoutAvailability answers "closed" for a visitor while the build flag is on.
  renderCta({ offersCoaching: false, checkoutState: "disabled", lessonPayment: "closed" });

  assert.ok(screen.getByRole("button", { name: "Ders paketleri yakında" }));
  assert.equal(screen.queryByRole("button", { name: "Ders Rezervasyonu Yap" }), null);
});

test("while the answer about online payment is on its way, a lesson-only tutor waits", () => {
  const starts = renderCta({ offersCoaching: false, checkoutState: "disabled", lessonPayment: "loading" });
  const cta = screen.getByRole("button", { name: "Hazırlanıyor…" }) as HTMLButtonElement;

  assert.equal(cta.disabled, true);
  fireEvent.click(cta);
  assert.deepEqual(starts, []);
});

test("with online payment open for this student, a lesson-only tutor starts the reservation", () => {
  const starts = renderCta({ offersCoaching: false, checkoutState: "disabled", lessonPayment: "open" });

  fireEvent.click(screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }));
  assert.equal(starts.length, 1);
});

test("with the build flag off the button is what it always was", () => {
  const starts = renderCta({ offersCoaching: false, checkoutState: "disabled", lessonPayment: "off" });

  fireEvent.click(screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }));
  assert.equal(starts.length, 1);
});

test("a tutor who offers Coaching is not held up by the lesson payment answer", () => {
  const starts = renderCta({ offersCoaching: true, checkoutState: "enabled", lessonPayment: "closed" });

  fireEvent.click(screen.getByRole("button", { name: "Ders Rezervasyonu Yap" }));
  assert.equal(starts.length, 1);
});


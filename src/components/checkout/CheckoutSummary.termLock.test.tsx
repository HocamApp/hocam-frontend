import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CheckoutSummary } from "./CheckoutSummary";
import { calculatePackagePricing } from "@/lib/lessonPricing";
import type { PackagePlan, TutorProfile } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

const tutor = {
  id: "tutor-1",
  name: "İbrahim",
  surname: "Koç",
  hourly_price: 1000,
  profile_picture: "",
} as TutorProfile;

const plans: PackagePlan[] = [14, 30, 90, 180].map((durationDays) => ({
  id: `plan-${durationDays}`,
  name: `${durationDays} günlük paket`,
  code: `weekly_2_${durationDays}d`,
  lesson_count: durationDays === 14 ? 4 : durationDays === 30 ? 8 : durationDays === 90 ? 24 : 48,
  lesson_duration_minutes: 40,
  lessons_per_week: 2,
  duration_days: durationDays,
  discount_percent: durationDays === 14 ? 1 : durationDays === 30 ? 6 : durationDays === 90 ? 16 : 26,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
}));

afterEach(() => cleanup());

function renderSummary(termEditHref?: string) {
  const changes: number[] = [];
  render(
    <CheckoutSummary
      tutor={tutor}
      lessonsPerWeek={2}
      durationDays={90}
      pricing={calculatePackagePricing(1000, 24, 16)}
      planAvailable
      promoCode=""
      onPromoCodeChange={() => {}}
      onPurchaseCta={() => {}}
      purchasePending={false}
      pendingForSelectedPlan={false}
      otherPendingPlanName={null}
      weeklyPlans={plans}
      onDurationDaysChange={(days: number) => changes.push(days)}
      onApplyPromo={() => {}}
      promoStatus="idle"
      promoMessage={null}
      promoPricing={null}
      onRemovePromo={() => {}}
      paidRemainingCredits={null}
      onUseCredits={() => {}}
      termEditHref={termEditHref}
    />
  );
  return changes;
}

test("a term chosen on the schedule step is shown, once, and cannot be changed here", () => {
  renderSummary("/tutors/tutor-1/checkout/schedule?per_week=2&duration=90");

  // One option, not four, and it is not a radio: nothing here can be re-chosen.
  assert.equal(screen.queryAllByRole("radio").length, 0);
  const group = screen.getByRole("group", { name: "Paket süresi" });
  assert.match(group.textContent ?? "", /3 Ay/);
  assert.doesNotMatch(group.textContent ?? "", /6 Ay|1 Ay|2 Hafta/);

  const change = screen.getByRole("link", { name: "Süreyi değiştir" });
  assert.equal(change.getAttribute("href"), "/tutors/tutor-1/checkout/schedule?per_week=2&duration=90");
});

test("the price breakdown of the fixed term is still there", () => {
  renderSummary("/tutors/tutor-1/checkout/schedule?duration=90");

  assert.ok(screen.getByText("Toplam ders"));
  assert.ok(screen.getByText("24 ders"));
});

test("without the link the choice stays open, as it is for a student with no hours yet", () => {
  renderSummary();

  assert.equal(screen.getAllByRole("radio").length, 4);
  assert.equal(screen.queryByRole("link", { name: "Süreyi değiştir" }), null);
});

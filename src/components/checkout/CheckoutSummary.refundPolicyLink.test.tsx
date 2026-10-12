import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { CheckoutSummary } from "./CheckoutSummary";
import { calculatePackagePricing } from "@/lib/lessonPricing";
import type { PackagePlan, TutorProfile } from "@/types";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});

const tutor = {
  id: "tutor-1",
  name: "İbrahim",
  surname: "Koç",
  hourly_price: 1000,
  profile_picture: "",
} as TutorProfile;

const plans: PackagePlan[] = [90].map((durationDays) => ({
  id: `plan-${durationDays}`,
  name: `${durationDays} günlük paket`,
  code: `weekly_2_${durationDays}d`,
  lesson_count: 24,
  lesson_duration_minutes: 40,
  lessons_per_week: 2,
  duration_days: durationDays,
  discount_percent: 16,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
}));

afterEach(() => cleanup());

test("the refund policy link opens the published policy, not a section of the help centre", () => {
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
      onDurationDaysChange={() => {}}
      onApplyPromo={() => {}}
      promoStatus="idle"
      promoMessage={null}
      promoPricing={null}
      onRemovePromo={() => {}}
      paidRemainingCredits={null}
      onUseCredits={() => {}}
    />
  );

  assert.equal(
    screen.getByRole("link", { name: "İade politikası" }).getAttribute("href"),
    "/iptal-ve-iade"
  );
});

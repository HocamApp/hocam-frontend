import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

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

test("renders duration choices as a single-select accordion in the decision rail", () => {
  const selections: number[] = [];
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
      onDurationDaysChange={(days: number) => selections.push(days)}
      onApplyPromo={() => {}}
      promoStatus="idle"
      promoMessage={null}
      promoPricing={null}
      onRemovePromo={() => {}}
      paidRemainingCredits={null}
      onUseCredits={() => {}}
    />
  );

  assert.ok(screen.getByRole("radiogroup", { name: "Paket süresi" }));
  const selected = screen.getByRole("radio", { name: /3 Ay/ }) as HTMLButtonElement;
  assert.equal(selected.getAttribute("aria-checked"), "true");
  const selectedDetailsId = selected.getAttribute("aria-describedby");
  assert.ok(selectedDetailsId);
  assert.ok(!document.getElementById(selectedDetailsId)?.textContent?.includes("Paket toplamı"));
  const advantage = selected.querySelector(".checkout-duration-advantage");
  assert.ok(advantage, "duration advantage should use the dedicated yellow label");
  selected.focus();
  fireEvent.keyDown(selected, { key: "ArrowRight" });
  assert.equal(document.activeElement, screen.getByRole("radio", { name: /6 Ay/ }));
  fireEvent.click(screen.getByRole("radio", { name: /6 Ay/ }));
  assert.deepEqual(selections, [180, 180]);
});

test("applies and removes a promotion with inline status", () => {
  let applyCount = 0;
  let removeCount = 0;
  render(
    <CheckoutSummary
      tutor={tutor}
      lessonsPerWeek={2}
      durationDays={90}
      pricing={calculatePackagePricing(1000, 24, 16)}
      planAvailable
      promoCode="SINAV20"
      onPromoCodeChange={() => {}}
      onPurchaseCta={() => {}}
      purchasePending={false}
      pendingForSelectedPlan={false}
      otherPendingPlanName={null}
      weeklyPlans={plans}
      onDurationDaysChange={() => {}}
      onApplyPromo={() => applyCount++}
      promoStatus="applied"
      promoMessage="İndirim kodu uygulandı."
      promoPricing={{
        promotion_code: "SINAV20",
        total_credits: 24,
        unit_price: 672,
        subtotal_price: 24000,
        discount_amount: 3840,
        promo_discount_amount: 4032,
        total_price: 16128,
      }}
      onRemovePromo={() => removeCount++}
      paidRemainingCredits={null}
      onUseCredits={() => {}}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Uygula" }));
  fireEvent.click(screen.getByRole("button", { name: "Kodu kaldır" }));
  assert.equal(applyCount, 1);
  assert.equal(removeCount, 1);
  assert.ok(screen.getByRole("status").textContent?.includes("uygulandı"));
  assert.ok(screen.getByText("-₺4.032"));
});

test("places the primary decision before trust copy and promotion controls", () => {
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

  const cta = screen.getAllByRole("button", { name: "Paket talebi oluştur" })[0];
  const trust = screen.getByText(/Bu adımda kartından ücret alınmaz/);
  const promo = screen.getByRole("heading", { name: "İndirim kodu" });
  assert.ok(cta.compareDocumentPosition(trust) & Node.DOCUMENT_POSITION_FOLLOWING);
  assert.ok(trust.compareDocumentPosition(promo) & Node.DOCUMENT_POSITION_FOLLOWING);
});

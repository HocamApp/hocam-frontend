import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CheckoutProductPicker } from "./CheckoutProductPicker";
import { ComparePlansDialog } from "./ComparePlansDialog";
import type { PackagePlan } from "@/types";

Object.defineProperty(globalThis, "self", {
  value: window,
  configurable: true,
});
Object.defineProperty(globalThis, "requestAnimationFrame", {
  value: (callback: FrameRequestCallback) => setTimeout(() => callback(Date.now()), 0),
  configurable: true,
});
Object.defineProperty(globalThis, "cancelAnimationFrame", {
  value: (handle: number) => clearTimeout(handle),
  configurable: true,
});

const plans: PackagePlan[] = [2, 3, 4, 5, 6].map((lessonsPerWeek) => ({
  id: `plan-${lessonsPerWeek}`,
  name: `Haftada ${lessonsPerWeek} Ders`,
  code: `weekly_${lessonsPerWeek}_90d`,
  lesson_count: lessonsPerWeek * 12,
  lesson_duration_minutes: 40,
  lessons_per_week: lessonsPerWeek,
  duration_days: 90,
  discount_percent: 15,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
}));

afterEach(() => cleanup());

test("shows only the active private plan while future products are hidden", () => {
  render(
    <CheckoutProductPicker
      basePrice={1000}
      weeklyPlans={plans}
      lessonsPerWeek={2}
      durationDays={90}
      onLessonsPerWeekChange={() => {}}
      onDurationDaysChange={() => {}}
      trialLessonsRemaining={1}
      paidRemainingCredits={3}
      onBookTrial={() => {}}
      onUseCredits={() => {}}
    />
  );

  assert.ok(screen.getByText("Birebir Özel Ders"));
  assert.ok(!screen.queryByText("Küçük Grup"));
  assert.ok(!screen.queryByText("Hocam Pro"));
  assert.ok(!screen.queryByText("Planları karşılaştır"));
  assert.ok(!screen.queryByText("Yakında"));
  assert.equal(document.querySelectorAll("svg.lucide").length, 0);

  const planButtons = screen.getAllByRole("button").filter((button) =>
    /Küçük Grup|Birebir Özel Ders|Hocam Pro/.test(button.getAttribute("aria-label") ?? button.textContent ?? "")
  );
  assert.equal(planButtons.length, 1);
  assert.match(planButtons[0]?.textContent ?? "", /Birebir Özel Ders/);
});

test("expands private package controls and benefits inside the selected plan", () => {
  let creditUses = 0;
  render(
    <CheckoutProductPicker
      basePrice={1000}
      weeklyPlans={plans}
      lessonsPerWeek={2}
      durationDays={90}
      onLessonsPerWeekChange={() => {}}
      onDurationDaysChange={() => {}}
      trialLessonsRemaining={1}
      paidRemainingCredits={3}
      onBookTrial={() => {}}
      onUseCredits={() => creditUses++}
    />
  );

  const privatePlan = screen.getByRole("button", { name: /Birebir Özel Ders/ }).closest("section");
  assert.ok(privatePlan);
  assert.ok(privatePlan.textContent?.includes("Haftalık ders sayısını seç"));
  assert.ok(privatePlan.textContent?.includes("BİREBİR PAKET ÖZELLİKLERİ"));
  assert.ok(privatePlan.textContent?.includes("Seçtiğin hocayla canlı birebir ders"));
  const featureList = privatePlan.querySelector('[aria-labelledby="private-features-title"] ul');
  assert.equal(featureList?.querySelectorAll("li").length, 4);
  assert.equal(featureList?.querySelectorAll("svg").length, 0);
  assert.ok(!privatePlan.textContent?.includes("2 hafta–6 ay paket süresi"));
  assert.ok(!privatePlan.textContent?.includes("Toplam ders hakkı"));
  assert.ok(!privatePlan.textContent?.includes("Paket süresine göre ders başına fiyat avantajı"));
  assert.ok(privatePlan.textContent?.includes("3 ders hakkın kullanılabilir"));
  fireEvent.click(screen.getByRole("button", { name: "Mevcut ders hakkını kullan" }));
  assert.equal(creditUses, 1);

  const trialButton = screen.getByRole("button", { name: "Dersi planla" });
  assert.ok(trialButton.className.includes("hover:bg-[var(--checkout-control)]"));
  assert.ok(trialButton.className.includes("hover:text-[var(--checkout-on-control)]"));

  for (const count of [2, 3, 4, 5, 6]) {
    assert.ok(screen.getByRole("button", { name: `${count} ders` }));
  }
  assert.equal(screen.queryByRole("button", { name: "1 ders" }), null);
});

test("keeps the full comparison table inside a bounded scroll area", () => {
  render(
    <ComparePlansDialog>
      <button type="button">Planları karşılaştır</button>
    </ComparePlansDialog>
  );

  fireEvent.click(screen.getByRole("button", { name: "Planları karşılaştır" }));
  const dialog = screen.getByRole("dialog", { name: "Planları karşılaştır" });
  assert.ok(dialog.className.includes("flex"));
  assert.ok(dialog.className.includes("flex-col"));
  assert.ok(dialog.querySelector(".min-h-0.overflow-y-auto"));
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CheckoutProductPicker } from "./CheckoutProductPicker";
import type { PackagePlan } from "@/types";

Object.defineProperty(globalThis, "self", {
  value: window,
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

test("shows the active private plan and readable disabled future plans", () => {
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
  const group = screen.getByRole("button", { name: /Küçük Grup/ }) as HTMLButtonElement;
  const pro = screen.getByRole("button", { name: /Hocam Pro/ }) as HTMLButtonElement;
  assert.equal(group.getAttribute("aria-disabled"), "true");
  assert.equal(pro.getAttribute("aria-disabled"), "true");
  assert.equal(screen.getAllByText("Yakında").length, 2);

  const planButtons = screen.getAllByRole("button").filter((button) =>
    /Küçük Grup|Birebir Özel Ders|Hocam Pro/.test(button.getAttribute("aria-label") ?? button.textContent ?? "")
  );
  assert.match(planButtons[0]?.textContent ?? "", /Küçük Grup/);
  assert.match(planButtons[1]?.textContent ?? "", /Birebir Özel Ders/);
  assert.match(planButtons[2]?.textContent ?? "", /Hocam Pro/);
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
  assert.ok(!privatePlan.textContent?.includes("2 hafta–6 ay paket süresi"));
  assert.ok(!privatePlan.textContent?.includes("Toplam ders hakkı"));
  assert.ok(!privatePlan.textContent?.includes("Paket süresine göre ders başına fiyat avantajı"));
  assert.ok(privatePlan.textContent?.includes("3 ders hakkın kullanılabilir"));
  fireEvent.click(screen.getByRole("button", { name: "Mevcut ders hakkını kullan" }));
  assert.equal(creditUses, 1);

  assert.ok(screen.getByRole("button", { name: "Planları karşılaştır" }));
  for (const count of [2, 3, 4, 5, 6]) {
    assert.ok(screen.getByRole("button", { name: `${count} ders` }));
  }
  assert.equal(screen.queryByRole("button", { name: "1 ders" }), null);
});

test("uses the approved concise descriptions for future plans", () => {
  render(
    <CheckoutProductPicker
      basePrice={1000}
      weeklyPlans={plans}
      lessonsPerWeek={2}
      durationDays={90}
      onLessonsPerWeekChange={() => {}}
      onDurationDaysChange={() => {}}
    />
  );

  assert.ok(screen.getByText("2–4 öğrenciyle, kişi başı daha avantajlı canlı dersler."));
  assert.ok(
    screen.getByText(
      "Soru desteği, haftalık koçluk ve gelişim takibiyle güçlendirilmiş birebir plan."
    )
  );
});

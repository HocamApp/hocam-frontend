import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

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
    />
  );

  assert.ok(screen.getByText("Birebir Özel Ders"));
  const group = screen.getByRole("button", { name: /Küçük Grup/ }) as HTMLButtonElement;
  const pro = screen.getByRole("button", { name: /Hocam Pro/ }) as HTMLButtonElement;
  assert.equal(group.getAttribute("aria-disabled"), "true");
  assert.equal(pro.getAttribute("aria-disabled"), "true");
  assert.equal(screen.getAllByText("Yakında").length, 2);
});

test("keeps package duration out of the exploration panel and exposes comparison", () => {
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

  assert.equal(screen.queryByText("Paket süresi"), null);
  assert.ok(screen.getByRole("button", { name: "Planları karşılaştır" }));
  for (const count of [2, 3, 4, 5, 6]) {
    assert.ok(screen.getByRole("button", { name: `${count} ders` }));
  }
  assert.equal(screen.queryByRole("button", { name: "1 ders" }), null);
});

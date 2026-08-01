import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { PackagePlan } from "@/types";
import {
  WEEKLY_LESSON_OPTIONS,
  normalizeWeeklyLessonOption,
  type WeeklyLessonOption,
} from "@/lib/lessonPricing";
import { CheckoutProductPicker } from "./CheckoutProductPicker";

afterEach(() => cleanup());

const plans: PackagePlan[] = WEEKLY_LESSON_OPTIONS.map((count) => ({
  id: `plan-${count}`,
  name: `${count} ders`,
  code: `weekly_${count}_90d`,
  lesson_count: count * 12,
  lesson_duration_minutes: 40,
  lessons_per_week: count,
  duration_days: 90,
  discount_percent: 0,
  is_active: true,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
}));

function PickerHarness() {
  const [count, setCount] = useState<WeeklyLessonOption>(2);
  return (
    <CheckoutProductPicker
      basePrice={100}
      weeklyPlans={plans}
      lessonsPerWeek={count}
      durationDays={90}
      onLessonsPerWeekChange={setCount}
      onDurationDaysChange={() => {}}
    />
  );
}

test("offers only 2 through 6 lessons and allows every option to be selected", () => {
  render(<PickerHarness />);

  const group = screen.getByRole("group", { name: "Haftada ders sayısı" });
  assert.deepEqual(
    Array.from(group.querySelectorAll("button")).map((button) => button.textContent),
    ["2 ders", "3 ders", "4 ders", "5 ders", "6 ders"]
  );
  assert.equal(screen.queryByRole("button", { name: "1 ders" }), null);

  for (const count of WEEKLY_LESSON_OPTIONS) {
    const button = screen.getByRole("button", { name: `${count} ders` });
    fireEvent.click(button);
    assert.equal(button.getAttribute("aria-pressed"), "true");
  }
});

test("changing the lesson count updates the displayed package total", () => {
  render(<PickerHarness />);
  assert.ok(screen.getByText("24 ders"));

  fireEvent.click(screen.getByRole("button", { name: "6 ders" }));

  assert.ok(screen.getByText("72 ders"));
  assert.equal(screen.queryByText("24 ders"), null);
});

test("normalizes stale or tampered package counts to 2", () => {
  assert.equal(normalizeWeeklyLessonOption("1"), 2);
  assert.equal(normalizeWeeklyLessonOption("7"), 2);
  assert.equal(normalizeWeeklyLessonOption("-1"), 2);
  assert.equal(normalizeWeeklyLessonOption(null), 2);
  assert.equal(normalizeWeeklyLessonOption("6"), 6);
});

import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { PackageTermChoice } from "./PackageTermChoice";
import type { PackagePlan } from "@/types";

Object.defineProperty(globalThis, "self", { value: window, configurable: true });

function plan(durationDays: number, lessonCount: number, discount: number): PackagePlan {
  return {
    id: `plan-${durationDays}`,
    name: `${durationDays} günlük paket`,
    code: `weekly_2_${durationDays}d`,
    lesson_count: lessonCount,
    lesson_duration_minutes: 40,
    lessons_per_week: 2,
    duration_days: durationDays,
    discount_percent: discount,
    is_active: true,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  };
}

// Deliberately out of order: the list sorts itself by term.
const plans = [plan(90, 24, 16), plan(14, 4, 1), plan(180, 48, 26), plan(30, 8, 6)];

afterEach(() => cleanup());

test("lists every term shortest first, with its lessons and what it costs", () => {
  render(<PackageTermChoice plans={plans} hourlyPrice={1000} value={90} onChange={() => {}} />);

  const radios = screen.getAllByRole("radio");
  assert.deepEqual(
    radios.map((radio) => radio.textContent?.match(/^\d+ (Hafta|Ay)/)?.[0]),
    ["2 Hafta", "1 Ay", "3 Ay", "6 Ay"]
  );
  const threeMonths = screen.getByRole("radio", { name: /3 Ay/ });
  // 24 lessons at 1.000 ₺ with 16% off: 840 ₺ a lesson, 20.160 ₺ in all.
  assert.match(threeMonths.textContent ?? "", /24 ders/);
  assert.match(threeMonths.textContent ?? "", /20\.160 ₺/);
  assert.match(threeMonths.textContent ?? "", /ders başına 840 ₺/);
});

test("marks the chosen term and the popular one, and nothing else", () => {
  render(<PackageTermChoice plans={plans} hourlyPrice={1000} value={30} onChange={() => {}} />);

  assert.equal(screen.getByRole("radio", { name: /1 Ay/ }).getAttribute("aria-checked"), "true");
  assert.equal(screen.getByRole("radio", { name: /3 Ay/ }).getAttribute("aria-checked"), "false");
  assert.equal(screen.getAllByText("En popüler").length, 1);
  assert.ok(screen.getByRole("radio", { name: /3 Ay/ }).textContent?.includes("En popüler"));
  assert.ok(screen.getByRole("radio", { name: /6 Ay/ }).textContent?.includes("%26 avantaj"));
});

test("choosing a term reports its days", () => {
  const chosen: number[] = [];
  render(<PackageTermChoice plans={plans} hourlyPrice={1000} value={null} onChange={(days) => chosen.push(days)} />);

  fireEvent.click(screen.getByRole("radio", { name: /6 Ay/ }));

  assert.deepEqual(chosen, [180]);
});

test("the arrow keys move the choice, wrapping round, and focus follows it", () => {
  const chosen: number[] = [];
  render(<PackageTermChoice plans={plans} hourlyPrice={1000} value={14} onChange={(days) => chosen.push(days)} />);

  const first = screen.getByRole("radio", { name: /2 Hafta/ });
  first.focus();
  fireEvent.keyDown(first, { key: "ArrowUp" });
  assert.deepEqual(chosen, [180], "up from the first wraps to the last");
  assert.equal(document.activeElement, screen.getByRole("radio", { name: /6 Ay/ }));

  fireEvent.keyDown(first, { key: "ArrowDown" });
  assert.deepEqual(chosen, [180, 30]);
  fireEvent.keyDown(first, { key: "End" });
  assert.deepEqual(chosen, [180, 30, 180]);
  fireEvent.keyDown(first, { key: "Home" });
  assert.deepEqual(chosen, [180, 30, 180, 14]);
});

test("with nothing chosen the group is still reachable by keyboard", () => {
  render(<PackageTermChoice plans={plans} hourlyPrice={1000} value={null} onChange={() => {}} />);

  const tabbable = screen.getAllByRole("radio").filter((radio) => radio.getAttribute("tabindex") === "0");
  assert.equal(tabbable.length, 1);
  assert.match(tabbable[0].textContent ?? "", /2 Hafta/);
});

test("says so when the tutor offers no term for this weekly count", () => {
  render(<PackageTermChoice plans={[]} hourlyPrice={1000} value={null} onChange={() => {}} />);

  assert.equal(screen.queryAllByRole("radio").length, 0);
  assert.ok(screen.getByText(/sunulan bir paket süresi yok/));
});

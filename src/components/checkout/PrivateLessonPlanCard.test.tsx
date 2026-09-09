import "@/test/setupDom";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  PrivateLessonPlanCard,
  type WeeklyOptionState,
} from "./PrivateLessonPlanCard";

afterEach(() => act(() => cleanup()));

function states(entries: Record<number, Partial<WeeklyOptionState>>) {
  const all: Record<number, WeeklyOptionState> = {};
  for (const count of [2, 3, 4, 5, 6]) {
    all[count] = {
      offered: entries[count]?.offered ?? true,
      schedulable: entries[count]?.schedulable ?? true,
    };
  }
  return all;
}

function renderCard(
  optionState: Record<number, WeeklyOptionState>,
  onChange: (count: number) => void = () => undefined,
) {
  render(
    <PrivateLessonPlanCard
      value={2 as never}
      onChange={onChange as never}
      optionState={optionState}
      lessonDurationMinutes={40}
    />,
  );
}

test("offers every weekly count the tutor actually sells", () => {
  renderCard(states({}));
  for (const count of [2, 3, 4, 5, 6]) {
    const button = screen.getByRole("button", { name: `${count} ders` }) as HTMLButtonElement;
    assert.equal(button.disabled, false);
  }
  assert.equal(screen.queryByRole("button", { name: "1 ders" }), null);
});

test("a count the tutor does not sell cannot be chosen", () => {
  // Otherwise the student picks 5 hours for a package that does not exist, and
  // the checkout screen silently re-snaps the cadence and drops the schedule.
  const clicks: number[] = [];
  renderCard(states({ 5: { offered: false } }), (count) => clicks.push(count));

  const five = screen.getByRole("button", { name: "5 ders" }) as HTMLButtonElement;
  assert.equal(five.disabled, true);
  fireEvent.click(five);
  assert.deepEqual(clicks, []);
  assert.ok(screen.getByText(/yalnız işaretli ders sayılarında paket sunuyor/i));
});

test("a count the tutor cannot staff says so, and says it differently", () => {
  renderCard(states({ 6: { schedulable: false } }));

  assert.equal((screen.getByRole("button", { name: "6 ders" }) as HTMLButtonElement).disabled, true);
  assert.ok(screen.getByText(/haftada bu kadar boş saati yok/i));
});

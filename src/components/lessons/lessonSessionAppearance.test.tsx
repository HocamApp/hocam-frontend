import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, test } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import { LeaveConfirmDialog } from "./LeaveConfirmDialog";
import { LessonTimerControl } from "./LessonTimerControl";
import { MockQualityDialog } from "../tutorial/MockQualityDialog";

after(() => window.close());
afterEach(() => cleanup());

test("lesson timer uses the branded pill treatment while keeping its time toggle accessible", () => {
  render(
    <LessonTimerControl
      bookingId="booking-1"
      remainingMs={30 * 60_000}
      elapsedMs={10 * 60_000}
      isLowTime={false}
      isOvertime={false}
    />
  );

  const timer = screen.getByRole("button", { name: /Kalan süre/ });
  assert.match(timer.className, /rounded-pill/);
  assert.match(timer.className, /border-line/);
  assert.match(timer.className, /text-ink/);
  assert.doesNotMatch(timer.className, /slate|amber|red-/);
});

test("leave confirmation keeps both actions and uses the floating modal surface", () => {
  render(
    <LeaveConfirmDialog
      open
      onConfirm={() => {}}
      onCancel={() => {}}
      isLeaving={false}
    />
  );

  assert.ok(screen.getByRole("button", { name: "Vazgeç" }));
  assert.ok(screen.getByRole("button", { name: "Görüşmeden ayrıl" }));
  const dialog = screen.getByRole("dialog");
  assert.match(dialog.className, /rounded-modal/);
  assert.match(dialog.className, /shadow-float/);
});

test("tutorial quality dialog mirrors the branded floating surface without losing options", () => {
  render(
    <MockQualityDialog
      open
      selected="balanced"
      onSelect={() => {}}
      onClose={() => {}}
    />
  );

  const dialog = screen.getByRole("dialog", { name: /Görüntü ayarı/ });
  assert.match(dialog.className, /rounded-modal/);
  assert.match(dialog.className, /shadow-float/);
  assert.equal(
    screen.getAllByRole("button").filter((button) => button.textContent !== "Kapat")
      .length,
    4
  );
});

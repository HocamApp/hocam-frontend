import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";
import { ScheduleMonthlyView } from "./ScheduleMonthlyView";

after(() => window.close());
afterEach(cleanup);

const AUGUST = new Date(2026, 7, 21);
const SEPTEMBER = new Date(2026, 8, 21);

function lesson(id: string, local_time: string, local_date = "2026-08-23"): ScheduleEvent {
  return {
    source: "booking",
    id,
    local_date,
    local_time,
    duration_minutes: 40,
    status: "confirmed",
    subject: { id: "s1", name: "Felsefe", exam_type: "AYT" },
    title: "Felsefe · Burak Çelik",
    block_type: null,
    completed: null,
    editable: false,
    room_url: "https://8x8.vc/room",
    occurrence_date: null,
    recurrence: null,
    block_title: null,
  };
}

const TIMES = ["10:00", "10:40", "11:20", "12:00", "12:40"];
const FIVE_ON_ONE_DAY = TIMES.map((time, index) => lesson(`lesson-${index}`, time));
// The 42-day grids of August and September both contain 31 August, so the same
// cell is on screen before and after paging — which is what makes a stale
// expansion observable at all.
const FIVE_ON_A_SHARED_DAY = TIMES.map((time, index) =>
  lesson(`shared-${index}`, time, "2026-08-31")
);

function renderMonth(
  events: ScheduleEvent[],
  anchor: Date = AUGUST,
  onSelectDay: (day: Date) => void = () => {}
) {
  return render(
    <ScheduleMonthlyView
      anchor={anchor}
      events={events}
      onSelectEvent={() => {}}
      onSelectDay={onSelectDay}
    />
  );
}

describe("month chips", () => {
  it("shows the time and the subject, not the composed title", () => {
    renderMonth([lesson("only", "10:00")]);

    assert.ok(screen.getByText("10:00"));
    assert.ok(screen.getByText("Felsefe"));
    // The composed title stays as the tooltip, not as the visible label.
    assert.equal(screen.queryByText("Felsefe · Burak Çelik"), null);
  });
});

describe("month overflow expands in place", () => {
  it("caps a busy day at three chips", () => {
    renderMonth(FIVE_ON_ONE_DAY);

    assert.equal(screen.getAllByText("Felsefe").length, 3);
    assert.ok(screen.getByText("+2 tane daha"));
  });

  it("reveals the rest of the day and collapses again", () => {
    renderMonth(FIVE_ON_ONE_DAY);

    fireEvent.click(screen.getByText("+2 tane daha"));
    assert.equal(screen.getAllByText("Felsefe").length, 5);

    const collapse = screen.getByText("Daha az göster");
    assert.equal(collapse.getAttribute("aria-expanded"), "true");

    fireEvent.click(collapse);
    assert.equal(screen.getAllByText("Felsefe").length, 3);
    assert.equal(screen.getByText("+2 tane daha").getAttribute("aria-expanded"), "false");
  });

  // The whole point of the change: expanding must not throw away the month the
  // student is reading by jumping the page to the daily view.
  it("does not navigate away from the month", () => {
    let jumped = false;
    renderMonth(FIVE_ON_ONE_DAY, AUGUST, () => {
      jumped = true;
    });

    fireEvent.click(screen.getByText("+2 tane daha"));
    assert.equal(jumped, false);
  });

  it("names the day it belongs to, so the button is not a bare '+2'", () => {
    renderMonth(FIVE_ON_ONE_DAY);

    const button = screen.getByText("+2 tane daha");
    assert.match(button.getAttribute("aria-label") ?? "", /2 etkinlik daha göster/);
    assert.match(button.getAttribute("aria-label") ?? "", /23/);
  });

  // The 42-day grid overlaps its neighbours, so an expanded day would otherwise
  // still be open after paging into the month that actually contains it.
  it("starts collapsed again after paging to another month", () => {
    const { rerender } = renderMonth(FIVE_ON_A_SHARED_DAY);

    fireEvent.click(screen.getByText("+2 tane daha"));
    assert.equal(screen.getAllByText("Felsefe").length, 5);

    rerender(
      <ScheduleMonthlyView
        anchor={SEPTEMBER}
        events={FIVE_ON_A_SHARED_DAY}
        onSelectEvent={() => {}}
        onSelectDay={() => {}}
      />
    );

    assert.equal(screen.getAllByText("Felsefe").length, 3);
    assert.ok(screen.getByText("+2 tane daha"));
  });
});

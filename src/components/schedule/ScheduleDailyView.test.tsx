import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";
import { ScheduleDailyView } from "./ScheduleDailyView";

after(() => window.close());
afterEach(cleanup);

const DAY = new Date(2026, 7, 21);

function block(id: string, local_time: string, duration_minutes: number): ScheduleEvent {
  return {
    source: "study_block",
    id,
    local_date: "2026-08-21",
    local_time,
    duration_minutes,
    status: "planned",
    subject: null,
    title: id,
    block_type: "custom",
    completed: false,
    editable: true,
    room_url: "",
    occurrence_date: "2026-08-21",
    recurrence: "none",
    block_title: id,
  };
}

function renderDay(events: ScheduleEvent[]) {
  return render(
    <ScheduleDailyView
      day={DAY}
      events={events}
      pendingKeys={new Set()}
      onToggleCompleted={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  );
}

describe("the daily grid", () => {
  it("exposes the time rail as a labelled daily calendar", () => {
    renderDay([block("tek", "18:00", 60)]);

    assert.ok(screen.getByRole("grid", { name: "Günlük takvim" }));
  });

  // An 01:58 lesson used to be drawn at its exact minute offset and sized by
  // its duration, so it straddled the 02:00 rule. A block belongs to the row
  // for the hour it starts in, between two rules and never across one.
  it("puts a block in the row for the hour it starts in", () => {
    renderDay([block("gec", "01:58", 40)]);

    const cell = screen.getByText("gec").closest("[role='gridcell']");
    assert.ok(cell);
    const row = cell.parentElement;
    assert.ok(row?.textContent?.startsWith("01:00"), `landed in ${row?.textContent}`);
  });

  it("stacks two blocks that share an hour instead of hiding one", () => {
    renderDay([block("ilk", "18:00", 30), block("ikinci", "18:30", 30)]);

    const cells = [
      screen.getByText("ilk").closest("[role='gridcell']"),
      screen.getByText("ikinci").closest("[role='gridcell']"),
    ];
    assert.equal(cells[0], cells[1], "the two blocks are not in the same hour row");
  });

  it("draws one row per hour in the window, not one per boundary label", () => {
    renderDay([block("tek", "18:00", 60)]);

    // visibleHourWindow crops to 17:00–20:00 for an 18:00–19:00 block, which
    // is three rows: 17, 18 and 19.
    assert.equal(screen.getAllByRole("row").length, 3);
    assert.equal(screen.getAllByText(/^\d\d:00$/).length, 3);
  });

  // A day spanning 09:00 to 23:00 is fifteen rows. Before this the page
  // carried them: reaching the evening block scrolled the header and the view
  // switch off screen, and the two blocks could never be visible together.
  it("scrolls inside its own box rather than growing the page", () => {
    const { container } = renderDay([block("sabah", "09:00", 60), block("gece", "23:00", 60)]);

    const scroller = container.firstElementChild as HTMLElement;
    assert.match(scroller.className, /overflow-y-auto/);
    assert.match(scroller.className, /max-h-/);

    // 08:00–24:00 once the window pads each end.
    assert.equal(screen.getAllByRole("row").length, 16);
  });

  it("still says when a day is empty", () => {
    renderDay([]);
    assert.ok(screen.getByText("Bu gün için planlanmış bir şey yok."));
  });
});

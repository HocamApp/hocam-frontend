import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, describe, it } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";
import { HOUR_HEIGHT } from "./dayLayout";
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

describe("daily view geometry", () => {
  // A 30-minute block is 32px of real time but is never drawn shorter than
  // 56px, so two back-to-back ones used to be given the full width each and
  // then painted on top of one another.
  it("splits back-to-back short blocks into side-by-side columns", () => {
    const { container } = renderDay([block("ilk", "18:00", 30), block("ikinci", "18:30", 30)]);

    const cards = Array.from(container.querySelectorAll<HTMLElement>(".absolute.z-\\[5\\]"));
    assert.equal(cards.length, 2);

    const lefts = cards.map((card) => card.style.left);
    assert.notEqual(lefts[0], lefts[1], "both cards were placed in the same column");
    cards.forEach((card) => assert.match(card.style.width, /calc\(50% - 0\.25rem\)/));
  });

  it("gives a lone block the full width and no reserved gutter", () => {
    const { container } = renderDay([block("tek", "18:00", 60)]);

    const card = container.querySelector<HTMLElement>(".absolute.z-\\[5\\]");
    assert.ok(card);
    assert.equal(card.style.left, "0%");
    assert.match(card.style.width, /calc\(100% - 0px\)/);
  });

  // The hour labels are boundaries, closing hour included, so there is one more
  // label than there are rows. Sizing the canvas by the label count left a
  // permanently empty hour at the bottom.
  it("spans one row per hour, not one per boundary label", () => {
    const { container } = renderDay([block("tek", "18:00", 60)]);

    // hourWindow crops to 17:00–20:00 for an 18:00–19:00 block.
    const canvas = container.querySelector<HTMLElement>(".relative.flex-1");
    assert.ok(canvas);
    assert.equal(canvas.style.height, `${3 * HOUR_HEIGHT}px`);
    assert.equal(screen.getAllByText(/^\d\d:00$/).length, 4);
  });

  // A day spanning 09:00 to 23:00 is 1024px of grid. Before this the container
  // was overflow-hidden, so the page carried it: reaching the evening block
  // scrolled the header and the view switch off screen, and the two blocks
  // could never be visible together.
  it("scrolls inside its own box rather than growing the page", () => {
    const { container } = renderDay([block("sabah", "09:00", 60), block("gece", "23:00", 60)]);

    const scroller = container.firstElementChild as HTMLElement;
    assert.match(scroller.className, /overflow-y-auto/);
    assert.match(scroller.className, /max-h-/);
    assert.doesNotMatch(scroller.className, /overflow-hidden/);

    // 08:00–24:00 once the window pads each end.
    const canvas = container.querySelector<HTMLElement>(".relative.flex-1");
    assert.equal(canvas?.style.height, `${16 * HOUR_HEIGHT}px`);
  });

  it("still says when a day is empty", () => {
    renderDay([]);
    assert.ok(screen.getByText("Bu gün için planlanmış bir şey yok."));
  });
});

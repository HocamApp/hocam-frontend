import "@/test/setupDom";

import assert from "node:assert/strict";
import { after, afterEach, before, describe, it, mock } from "node:test";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";

import type { ScheduleEvent } from "@/types";
import { eventKey } from "./eventIdentity";

let ScheduleWeeklyView: typeof import("./ScheduleWeeklyView").ScheduleWeeklyView;

before(async () => {
  mock.module("next/link", {
    defaultExport: React.forwardRef<
      HTMLAnchorElement,
      { href: string; children?: React.ReactNode }
    >(function MockLink({ href, children, ...rest }, ref) {
      return React.createElement("a", { href, ref, ...rest }, children);
    }),
  });

  ScheduleWeeklyView = (await import("./ScheduleWeeklyView")).ScheduleWeeklyView;
});

after(() => window.close());
afterEach(cleanup);

// 2026-08-17 is a Monday.
const ANCHOR = new Date(2026, 7, 17);

function occurrence(date: string, overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    source: "study_block",
    id: "series-1",
    local_date: date,
    local_time: "19:30",
    duration_minutes: 60,
    status: "planned",
    subject: null,
    title: "Soru çözümü",
    block_type: "soru_cozumu",
    completed: false,
    editable: true,
    room_url: "",
    occurrence_date: date,
    recurrence: "weekly",
    block_title: "Soru çözümü",
    ...overrides,
  };
}

function renderWeek(events: ScheduleEvent[], pendingKeys = new Set<string>()) {
  return render(
    <ScheduleWeeklyView
      anchor={ANCHOR}
      events={events}
      pendingKeys={pendingKeys}
      onToggleCompleted={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
    />
  );
}

describe("an empty week", () => {
  it("shows one empty state, not seven copies of the same word", () => {
    renderWeek([]);

    assert.ok(screen.getByText("Bu hafta boş görünüyor"));
    assert.equal(screen.queryAllByText("Boş").length, 0);
  });
});

describe("a week with work in it", () => {
  it("still marks the individual empty days", () => {
    renderWeek([occurrence("2026-08-17")]);

    // Six other days in the desktop grid, each with its own "Boş".
    assert.equal(screen.queryAllByText("Boş").length, 6);
  });

  it("wraps each day in a labelled landmark so a reader can skip by day", () => {
    renderWeek([occurrence("2026-08-17")]);

    assert.ok(screen.getByLabelText("17 Ağustos · Pzt"));
    assert.ok(screen.getByLabelText("23 Ağustos · Paz"));
  });
});

describe("pending state", () => {
  const monday = occurrence("2026-08-17");

  const dimmedCount = () =>
    screen
      .getAllByText("Soru çözümü")
      .map((node) => node.closest("div[class*='opacity-60']"))
      .filter(Boolean).length;

  it("dims the occurrence whose checkbox is in flight", () => {
    renderWeek([monday], new Set([eventKey(monday)]));

    assert.ok(dimmedCount() > 0);
  });

  it("ignores a pending key for another week of the same series", () => {
    // Same block id, different occurrence date. Keying pending state on the
    // id alone dimmed every week of a series while one checkbox was saving.
    const otherWeek = eventKey(occurrence("2026-08-24"));

    renderWeek([monday], new Set([otherWeek]));

    assert.equal(dimmedCount(), 0);
  });

  it("leaves everything crisp when nothing is in flight", () => {
    renderWeek([monday]);

    assert.equal(dimmedCount(), 0);
  });
});

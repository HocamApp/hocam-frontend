import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ScheduleEvent } from "@/types";
import { layoutDayEvents } from "./dayLayout";

function event(
  id: string,
  local_time: string,
  duration_minutes: number
): ScheduleEvent {
  return {
    source: "study_block",
    id,
    local_date: "2026-08-17",
    local_time,
    duration_minutes,
    status: "planned",
    subject: null,
    title: id,
    block_type: "custom",
    completed: false,
    editable: true,
    room_url: "",
    occurrence_date: "2026-08-17",
    recurrence: "none",
    block_title: "",
  };
}

const layoutOf = (events: ScheduleEvent[]) =>
  layoutDayEvents(events).map((entry) => [
    entry.event.id,
    entry.column,
    entry.columns,
  ]);

describe("day layout", () => {
  it("gives a lone event the full width", () => {
    assert.deepEqual(layoutOf([event("a", "19:00", 60)]), [["a", 0, 1]]);
  });

  it("keeps sequential events full width", () => {
    const result = layoutOf([event("a", "09:00", 60), event("b", "11:00", 60)]);

    assert.deepEqual(result, [
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("treats back-to-back events as non-overlapping", () => {
    // 09:00-10:00 then 10:00-11:00 — touching, not overlapping.
    const result = layoutOf([event("a", "09:00", 60), event("b", "10:00", 60)]);

    assert.deepEqual(result, [
      ["a", 0, 1],
      ["b", 0, 1],
    ]);
  });

  it("splits two events at the same time into two columns", () => {
    const result = layoutOf([event("a", "19:30", 60), event("b", "19:30", 60)]);

    assert.deepEqual(result, [
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("splits partial overlaps", () => {
    const result = layoutOf([event("a", "19:00", 90), event("b", "20:00", 60)]);

    assert.deepEqual(result, [
      ["a", 0, 2],
      ["b", 1, 2],
    ]);
  });

  it("puts the longer event in the left column on a tie", () => {
    const result = layoutOf([event("short", "19:00", 30), event("long", "19:00", 120)]);

    assert.deepEqual(result, [
      ["long", 0, 2],
      ["short", 1, 2],
    ]);
  });

  it("reuses a column once its event has finished", () => {
    // a spans the whole evening; b and c fit one after another beside it.
    const result = layoutOf([
      event("a", "19:00", 180),
      event("b", "19:00", 60),
      event("c", "20:00", 60),
    ]);

    assert.deepEqual(result, [
      ["a", 0, 2],
      ["b", 1, 2],
      ["c", 1, 2],
    ]);
  });

  it("widens a cluster to three columns when three things collide", () => {
    const result = layoutOf([
      event("a", "19:00", 60),
      event("b", "19:15", 60),
      event("c", "19:30", 60),
    ]);

    assert.deepEqual(result, [
      ["a", 0, 3],
      ["b", 1, 3],
      ["c", 2, 3],
    ]);
  });

  it("does not let one busy cluster widen a later independent one", () => {
    const result = layoutOf([
      event("a", "09:00", 60),
      event("b", "09:00", 60),
      event("later", "20:00", 60),
    ]);

    assert.deepEqual(result, [
      ["a", 0, 2],
      ["b", 1, 2],
      ["later", 0, 1],
    ]);
  });

  it("orders the output by start time regardless of input order", () => {
    const result = layoutOf([event("late", "21:00", 60), event("early", "08:00", 60)]);

    assert.deepEqual(result, [
      ["early", 0, 1],
      ["late", 0, 1],
    ]);
  });

  it("handles an empty day", () => {
    assert.deepEqual(layoutDayEvents([]), []);
  });
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { istanbulCalendarToday } from "./availability";
import { getSlotsForDay } from "./bookingSlots";
import type { AvailabilityRule } from "@/types";

const weekly: AvailabilityRule = { id: "weekly", tutor: "t", day_of_week: 0, start_time: "09:00", end_time: "12:00", created_at: "" };
test("specific-date availability replaces weekly rules without leaking into another week", () => {
  const dated = { ...weekly, id: "dated", specific_date: "2026-09-07", start_time: "14:00", end_time: "15:00" };
  assert.deepEqual(getSlotsForDay([weekly, dated], 0, 40, [], "2026-09-07"), ["14:00"]);
  assert.equal(getSlotsForDay([weekly, dated], 0, 40, [], "2026-09-14")[0], "09:00");
});
test("a closed date with null hours has no slots", () => {
  const closed = { ...weekly, specific_date: "2026-09-07", is_unavailable: true, start_time: null, end_time: null } as unknown as AvailabilityRule;
  assert.deepEqual(getSlotsForDay([weekly, closed], 0, 40, [], "2026-09-07"), []);
});
test("full-day and midnight-spanning busy ranges block the clipped day", () => {
  assert.deepEqual(getSlotsForDay([weekly], 0, 40, [{start_time:"2026-09-07T00:00:00Z",end_time:"2026-09-08T00:00:00Z"}], "2026-09-07"), []);
  assert.deepEqual(getSlotsForDay([weekly], 0, 40, [{start_time:"2026-09-06T23:00:00Z",end_time:"2026-09-07T10:00:00Z"}], "2026-09-07"), ["10:00","10:30","11:00"]);
});
test("busy wall-clock digits are Istanbul hours and touching intervals stay available", () => {
  assert.deepEqual(getSlotsForDay([weekly], 0, 30, [{start_time:"2026-09-07T09:30:00Z",end_time:"2026-09-07T10:30:00Z"}], "2026-09-07"), ["09:00","10:30","11:00","11:30"]);
});

test("Istanbul calendar date crosses midnight independently of browser timezone", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = zone;
      const day = istanbulCalendarToday(new Date("2026-09-06T21:30:00Z"));
      assert.equal(day.getFullYear(), 2026);assert.equal(day.getMonth(),8);assert.equal(day.getDate(),7);
    }
  } finally {if(original === undefined) delete process.env.TZ;else process.env.TZ=original;}
});

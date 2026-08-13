import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addDays,
  endTimeLabel,
  formatMinutes,
  longDayLabel,
  monthGridDays,
  parseLocalDate,
  rangeForView,
  rangeLabel,
  shiftAnchor,
  startOfWeek,
  timeToMinutes,
  toDateKey,
  weekDays,
} from "./scheduleDates";

// 2026-08-17 is a Monday.
const MONDAY = parseLocalDate("2026-08-17");

describe("local date parsing", () => {
  it("keeps the calendar day regardless of the browser timezone", () => {
    const parsed = parseLocalDate("2026-08-17");

    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 7);
    assert.equal(parsed.getDate(), 17);
  });

  it("round-trips through toDateKey", () => {
    assert.equal(toDateKey(parseLocalDate("2026-01-05")), "2026-01-05");
    assert.equal(toDateKey(parseLocalDate("2026-12-31")), "2026-12-31");
  });

  it("does not drift across midnight the way new Date(iso) would", () => {
    // new Date("2026-08-17") is parsed as UTC midnight, so a browser west of
    // Greenwich renders it as the 16th. The helper must not.
    assert.equal(parseLocalDate("2026-08-17").getDate(), 17);
  });
});

describe("week boundaries", () => {
  it("starts weeks on Monday, matching the backend's ISO weeks", () => {
    assert.equal(toDateKey(startOfWeek(MONDAY)), "2026-08-17");
    assert.equal(toDateKey(startOfWeek(parseLocalDate("2026-08-20"))), "2026-08-17");
    // Sunday belongs to the week that started six days earlier.
    assert.equal(toDateKey(startOfWeek(parseLocalDate("2026-08-23"))), "2026-08-17");
  });

  it("produces seven days Monday through Sunday", () => {
    const days = weekDays(parseLocalDate("2026-08-20")).map(toDateKey);

    assert.deepEqual(days, [
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
    ]);
  });

  it("crosses month and year boundaries", () => {
    assert.equal(toDateKey(addDays(parseLocalDate("2026-12-31"), 1)), "2027-01-01");
    assert.equal(toDateKey(startOfWeek(parseLocalDate("2027-01-01"))), "2026-12-28");
  });
});

describe("month grid", () => {
  it("always returns six full Monday-first weeks", () => {
    const grid = monthGridDays(parseLocalDate("2026-08-01"));

    assert.equal(grid.length, 42);
    assert.equal(grid[0].getDay(), 1);
    assert.equal(toDateKey(grid[0]), "2026-07-27");
    assert.equal(toDateKey(grid[41]), "2026-09-06");
  });

  it("stays inside the backend's 62-day range cap", () => {
    const grid = monthGridDays(parseLocalDate("2026-02-01"));
    const span =
      (grid[41].getTime() - grid[0].getTime()) / 86_400_000 + 1;

    assert.ok(span <= 62, `span was ${span}`);
  });
});

describe("range for view", () => {
  it("asks for a single day in the daily view", () => {
    assert.deepEqual(rangeForView("daily", parseLocalDate("2026-08-20")), {
      from: "2026-08-20",
      to: "2026-08-20",
    });
  });

  it("asks for Monday–Sunday in the weekly view", () => {
    assert.deepEqual(rangeForView("weekly", parseLocalDate("2026-08-20")), {
      from: "2026-08-17",
      to: "2026-08-23",
    });
  });

  it("asks for the whole padded grid in the monthly view", () => {
    assert.deepEqual(rangeForView("monthly", parseLocalDate("2026-08-10")), {
      from: "2026-07-27",
      to: "2026-09-06",
    });
  });
});

describe("navigation", () => {
  it("steps by one day, one week, or one month", () => {
    assert.equal(toDateKey(shiftAnchor("daily", MONDAY, 1)), "2026-08-18");
    assert.equal(toDateKey(shiftAnchor("weekly", MONDAY, 1)), "2026-08-24");
    assert.equal(toDateKey(shiftAnchor("weekly", MONDAY, -1)), "2026-08-10");
    assert.equal(toDateKey(shiftAnchor("monthly", MONDAY, 1)), "2026-09-01");
    assert.equal(toDateKey(shiftAnchor("monthly", MONDAY, -1)), "2026-07-01");
  });
});

describe("labels", () => {
  it("collapses the month name when a week sits inside one month", () => {
    assert.equal(rangeLabel("weekly", MONDAY), "17 – 23 Ağustos");
  });

  it("names both months when a week straddles them", () => {
    assert.equal(
      rangeLabel("weekly", parseLocalDate("2026-08-31")),
      "31 Ağustos – 6 Eylül"
    );
  });

  it("labels day and month views", () => {
    assert.equal(rangeLabel("daily", MONDAY), "17 Ağustos 2026");
    assert.equal(rangeLabel("monthly", MONDAY), "Ağustos 2026");
  });

  it("labels a single day with its Turkish weekday", () => {
    assert.equal(longDayLabel(MONDAY), "17 Ağustos · Pzt");
    assert.equal(longDayLabel(parseLocalDate("2026-08-23")), "23 Ağustos · Paz");
  });
});

describe("times and durations", () => {
  it("converts a wall clock to minutes for sorting", () => {
    assert.equal(timeToMinutes("00:30"), 30);
    assert.equal(timeToMinutes("18:00"), 1080);
    assert.equal(timeToMinutes("23:30"), 1410);
  });

  it("derives the end of a block", () => {
    assert.equal(endTimeLabel("18:00", 90), "19:30");
    assert.equal(endTimeLabel("23:30", 60), "00:30");
  });

  it("formats totals as hours and minutes, never a percentage", () => {
    assert.equal(formatMinutes(210), "3s 30dk");
    assert.equal(formatMinutes(120), "2s");
    assert.equal(formatMinutes(45), "45dk");
    assert.equal(formatMinutes(0), "0dk");
  });
});

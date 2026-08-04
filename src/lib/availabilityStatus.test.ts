import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bookedMinutesWithinRule,
  getDayAvailabilityStatus,
  ruleHasBookingOnDate,
  type DayBusyInterval,
} from "./availability";
import type { AvailabilityRule } from "@/types";

function rule(overrides: Partial<AvailabilityRule> = {}): AvailabilityRule {
  return {
    id: "rule-1",
    tutor: "tutor-1",
    day_of_week: 0,
    specific_date: null,
    is_unavailable: false,
    start_time: "10:00:00",
    end_time: "12:00:00",
    created_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

const DAY = new Date("2026-08-10T00:00:00"); // a Monday
const TODAY = new Date("2026-08-01T00:00:00");

function interval(start: string, end: string): DayBusyInterval {
  return { start: new Date(start), end: new Date(end) };
}

describe("getDayAvailabilityStatus", () => {
  it("marks days before today as past, even with rules and bookings", () => {
    const result = getDayAvailabilityStatus({
      date: new Date("2026-07-20T00:00:00"),
      today: TODAY,
      rules: [rule()],
      intervals: [interval("2026-07-20T10:00:00", "2026-07-20T11:00:00")],
    });

    assert.equal(result.status, "past");
    assert.equal(result.hasBookings, true);
  });

  it("marks a day with an unavailable rule as closed", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [rule({ is_unavailable: true })],
      intervals: [],
    });

    assert.equal(result.status, "closed");
  });

  it("marks a day without rules as none", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [],
      intervals: [],
    });

    assert.equal(result.status, "none");
    assert.equal(result.hasBookings, false);
  });

  it("marks an open day without bookings as available", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [rule()],
      intervals: [],
    });

    assert.equal(result.status, "available");
    assert.equal(result.hasBookings, false);
  });

  it("marks a partly booked day as partial", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [rule()],
      intervals: [interval("2026-08-10T10:00:00", "2026-08-10T10:40:00")],
    });

    assert.equal(result.status, "partial");
    assert.equal(result.hasBookings, true);
  });

  it("marks a fully covered day as full", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [rule()],
      intervals: [
        interval("2026-08-10T10:00:00", "2026-08-10T11:00:00"),
        interval("2026-08-10T11:00:00", "2026-08-10T12:00:00"),
      ],
    });

    assert.equal(result.status, "full");
  });

  it("ignores bookings outside the open rules", () => {
    const result = getDayAvailabilityStatus({
      date: DAY,
      today: TODAY,
      rules: [rule()],
      intervals: [interval("2026-08-10T18:00:00", "2026-08-10T19:00:00")],
    });

    assert.equal(result.status, "available");
    // The booking still exists on that day — the dot must show.
    assert.equal(result.hasBookings, true);
  });
});

describe("bookedMinutesWithinRule", () => {
  it("clips intervals to the rule boundaries", () => {
    const minutes = bookedMinutesWithinRule(
      rule(),
      DAY,
      [interval("2026-08-10T09:00:00", "2026-08-10T10:30:00")]
    );

    assert.equal(minutes, 30);
  });

  it("never double-counts overlapping bookings", () => {
    const minutes = bookedMinutesWithinRule(
      rule(),
      DAY,
      [
        interval("2026-08-10T10:00:00", "2026-08-10T11:00:00"),
        interval("2026-08-10T10:30:00", "2026-08-10T11:30:00"),
      ]
    );

    assert.equal(minutes, 90);
  });
});

describe("ruleHasBookingOnDate", () => {
  it("is true only when a booking overlaps the rule", () => {
    assert.equal(
      ruleHasBookingOnDate(rule(), DAY, [
        interval("2026-08-10T11:00:00", "2026-08-10T11:40:00"),
      ]),
      true
    );
    assert.equal(
      ruleHasBookingOnDate(rule(), DAY, [
        interval("2026-08-10T13:00:00", "2026-08-10T14:00:00"),
      ]),
      false
    );
    assert.equal(ruleHasBookingOnDate(rule(), DAY, []), false);
  });
});

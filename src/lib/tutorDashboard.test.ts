import assert from "node:assert/strict";
import test from "node:test";

import {
  dashboardBookingGroups,
  dashboardGreeting,
  resolveTutorDashboardRoute,
} from "./tutorDashboard";
import type { Booking } from "@/types";

function booking(id: string, status: Booking["status"], startTime: string): Booking {
  return {
    id,
    status,
    start_time: startTime,
    duration_minutes: 40,
    price: 500,
    student: { id: `student-${id}`, email: `${id}@example.com`, display_name: id },
    tutor: { id: "tutor", name: "Ada", surname: "Hoca" },
    subject: { id: "math", name: "Matematik", exam_type: "TYT" },
    lesson_request: null,
    created_at: startTime,
  };
}

test("legacy tutor dashboard tabs resolve to canonical workspaces", () => {
  const cases = [
    ["tab=students", "/dashboard/tutor/classroom"],
    ["tab=availability", "/dashboard/tutor/calendar"],
    ["tab=earnings", "/dashboard/tutor/statistics?tab=income&period=30"],
    ["tab=reviews", "/dashboard/tutor/statistics?tab=reviews&period=90"],
    ["tab=packages", "/dashboard/tutor/packages"],
  ];
  for (const [query, href] of cases) {
    assert.deepEqual(resolveTutorDashboardRoute(new URLSearchParams(query)), {
      mode: "redirect",
      href,
    });
  }
  assert.deepEqual(resolveTutorDashboardRoute(new URLSearchParams("tab=bookings")), {
    mode: "bookings",
  });
  assert.deepEqual(resolveTutorDashboardRoute(new URLSearchParams()), { mode: "overview" });
  assert.deepEqual(resolveTutorDashboardRoute(new URLSearchParams("tab=unknown")), {
    mode: "redirect",
    href: "/dashboard/tutor",
  });
});

test("a booking highlight canonicalizes into the focused bookings view", () => {
  assert.deepEqual(
    resolveTutorDashboardRoute(new URLSearchParams("highlightBooking=lesson 1")),
    {
      mode: "redirect",
      href: "/dashboard/tutor?tab=bookings&highlightBooking=lesson+1",
    },
  );
});

test("dashboard booking groups follow Istanbul wall time across midnight", () => {
  const now = Date.parse("2026-09-05T21:30:00Z");
  const groups = dashboardBookingGroups([
    booking("past", "pending", "2026-09-06T00:15:00Z"),
    booking("next", "confirmed", "2026-09-06T01:00:00Z"),
    booking("later", "confirmed", "2026-09-07T00:10:00Z"),
    booking("action", "awaiting_confirmation", "2026-09-05T20:00:00Z"),
  ], now);

  assert.deepEqual(groups.active.map(row => row.id), ["action", "next", "later"]);
  assert.deepEqual(groups.past.map(row => row.id), ["past"]);
  assert.deepEqual(groups.today.map(row => row.id), ["next"]);
  assert.equal(groups.next?.id, "next");
  assert.deepEqual(groups.pendingActions.map(row => row.id), ["action"]);
});

test("dashboard greeting follows Istanbul time instead of the browser timezone", () => {
  assert.equal(dashboardGreeting(Date.parse("2026-09-05T21:30:00Z")), "Günaydın");
  assert.equal(dashboardGreeting(Date.parse("2026-09-05T14:00:00Z")), "İyi günler");
  assert.equal(dashboardGreeting(Date.parse("2026-09-05T17:00:00Z")), "İyi akşamlar");
});

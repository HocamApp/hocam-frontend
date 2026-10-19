import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingSessionItem } from "./coachingApi";
import { buildTutorSessions, COACHING_TUTOR_EARLY_JOIN_MINUTES } from "./coachingSessions";

// Monday 19 October 2026, 12:30 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-19T09:30:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 5,
    week_index: 1,
    status: "scheduled",
    scheduled_start: "2026-10-19T16:00:00Z",
    scheduled_local_date: "2026-10-19",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Zeynep K.",
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

const sessions = [
  session({ id: "cum", scheduled_start: "2026-10-23T16:00:00Z", scheduled_local_date: "2026-10-23", sequence_number: 6 }),
  session({}),
  session({ id: "car", status: "reschedule_requested", scheduled_start: "2026-10-21T15:30:00Z", scheduled_local_date: "2026-10-21", scheduled_local_time: "18:30", student_name: "Mert A.", sequence_number: 4 }),
  session({ id: "per", scheduled_start: "2026-10-22T17:00:00Z", scheduled_local_date: "2026-10-22", scheduled_local_time: "20:00", student_name: "Elif Y.", sequence_number: 2 }),
  session({
    id: "report",
    status: "awaiting_report",
    scheduled_start: "2026-10-18T16:00:00Z",
    scheduled_local_date: "2026-10-18",
    report_due_at: "2026-10-20T15:00:00Z",
  }),
  session({ id: "done", status: "completed" }),
  session({ id: "gone", status: "cancelled" }),
];

describe("buildTutorSessions: the next meeting", () => {
  const board = buildTutorSessions({ sessions, now: NOW });

  it("is the earliest one still ahead, with a countdown while it is within a day", () => {
    assert.equal(board.next?.id, "s-1");
    assert.equal(board.next?.studentName, "Zeynep K.");
    assert.equal(board.next?.when, "Bugün 19:00");
    assert.equal(board.next?.countdown, "6 sa 30 dk sonra");
    assert.equal(board.next?.detail, "30 dk · 5. görüşme");
    assert.equal(board.next?.prepareHref, "/dashboard/tutor/coaching/sessions/s-1/prepare");
  });

  it("says when the room opens instead of offering Katıl too early", () => {
    assert.deepEqual(board.next?.join, { kind: "closed", opensLabel: "18:45'te açılır" });
  });

  it("opens the room for the tutor 15 minutes before, matching the server", () => {
    assert.equal(COACHING_TUTOR_EARLY_JOIN_MINUTES, 15);
    const open = buildTutorSessions({ sessions: [session({})], now: new Date("2026-10-19T15:46:00Z") });
    assert.deepEqual(open.next?.join, { kind: "open", href: "/session/coaching/s-1" });
    const early = buildTutorSessions({ sessions: [session({})], now: new Date("2026-10-19T15:44:00Z") });
    assert.equal(early.next?.join?.kind, "closed");
  });

  it("offers Katıl for a meeting that is running, and puts it first", () => {
    const live = buildTutorSessions({
      sessions: [session({ id: "live", status: "in_progress", scheduled_start: "2026-10-19T09:20:00Z", scheduled_local_time: "12:20", student_name: "Can T." }), session({})],
      now: NOW,
    });
    assert.equal(live.next?.id, "live");
    assert.equal(live.next?.countdown, "Devam ediyor");
    assert.deepEqual(live.next?.join, { kind: "live", href: "/session/coaching/live" });
  });

  it("gives no countdown for a meeting more than a day away", () => {
    const far = buildTutorSessions({
      sessions: [session({ scheduled_start: "2026-10-22T17:00:00Z", scheduled_local_date: "2026-10-22" })],
      now: NOW,
    });
    assert.equal(far.next?.countdown, null);
    assert.equal(far.next?.when, "Per 20:00");
  });

  it("is null when nothing is ahead", () => {
    assert.equal(buildTutorSessions({ sessions: [], now: NOW }).next, null);
  });
});

describe("buildTutorSessions: the rest, day by day", () => {
  const board = buildTutorSessions({ sessions, now: NOW });

  it("groups what follows by day, soonest first, leaving the next meeting out", () => {
    assert.deepEqual(
      board.days.map((day) => day.heading),
      ["21 Ekim Çarşamba", "22 Ekim Perşembe", "23 Ekim Cuma"]
    );
    assert.deepEqual(board.days.map((day) => day.rows.map((row) => row.id)), [["car"], ["per"], ["cum"]]);
  });

  it("writes a row as time and student, with the meeting's number", () => {
    const row = board.days[1].rows[0];
    assert.equal(row.time, "20:00");
    assert.equal(row.studentName, "Elif Y.");
    assert.equal(row.detail, "30 dk · 2. görüşme");
    assert.equal(row.note, null);
  });

  it("notes a meeting whose time change was asked for", () => {
    assert.equal(board.days[0].rows[0].note, "Saat değişikliği istendi");
  });

  it("offers no Katıl on a day that is not today", () => {
    for (const day of board.days) for (const row of day.rows) assert.equal(row.join, null);
  });

  it("calls today and tomorrow by name", () => {
    const two = buildTutorSessions({
      sessions: [
        session({}),
        session({ id: "b", scheduled_start: "2026-10-19T17:30:00Z", scheduled_local_time: "20:30", student_name: "Elif Y." }),
        session({ id: "t", scheduled_start: "2026-10-20T16:00:00Z", scheduled_local_date: "2026-10-20" }),
      ],
      now: NOW,
    });
    assert.deepEqual(two.days.map((day) => day.heading), ["Bugün · 19 Ekim Pazartesi", "Yarın · 20 Ekim Salı"]);
  });

  it("counts every meeting ahead, the next one included", () => {
    assert.equal(board.total, 4);
  });

  it("leaves out meetings that are over, cancelled or waiting on a report", () => {
    const ids = [board.next?.id, ...board.days.flatMap((day) => day.rows.map((row) => row.id))];
    assert.equal(ids.includes("done"), false);
    assert.equal(ids.includes("gone"), false);
    assert.equal(ids.includes("report"), false);
  });
});

describe("buildTutorSessions: reports owed", () => {
  it("lists a report that is owed, with its deadline and the way to write it", () => {
    const { reports } = buildTutorSessions({ sessions, now: NOW });
    assert.deepEqual(reports, [
      {
        id: "report",
        studentName: "Zeynep K.",
        detail: "18 Ekim Pazar görüşmesi",
        due: { value: "Yarın 18:00", urgent: false },
        href: "/dashboard/tutor/coaching/sessions/report/report",
      },
    ]);
  });

  it("falls back to a plain word for a student with no name", () => {
    const { reports } = buildTutorSessions({
      sessions: [session({ status: "awaiting_report", student_name: undefined, report_due_at: null })],
      now: NOW,
    });
    assert.equal(reports[0].studentName, "Öğrenci");
    assert.equal(reports[0].due, null);
  });
});

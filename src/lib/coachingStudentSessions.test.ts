import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingSessionItem } from "./coachingApi";
import { buildStudentSessions, STUDENT_UPCOMING_LIMIT } from "./coachingStudentSessions";

// Tuesday 20 October 2026, 15:20 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-20T12:20:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s",
    service_period_id: "p-1",
    sequence_number: 1,
    week_index: 1,
    status: "scheduled",
    scheduled_start: "2026-10-21T15:30:00Z",
    scheduled_local_date: "2026-10-21",
    scheduled_local_time: "18:30",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    rating_submitted: false,
    pending_reschedule: null,
    ...overrides,
  };
}

function at(id: string, start: string, localDate: string, overrides: Partial<CoachingSessionItem> = {}) {
  return session({ id, scheduled_start: start, scheduled_local_date: localDate, ...overrides });
}

const plan = [
  at("s1", "2026-10-12T15:30:00Z", "2026-10-12", { status: "completed", rating_submitted: true }),
  at("c1", "2026-10-14T15:30:00Z", "2026-10-14", { status: "cancelled" }),
  at("s2", "2026-10-15T15:30:00Z", "2026-10-15", {
    status: "awaiting_report",
    report_due_at: "2026-10-17T15:30:00Z",
    report_overdue: true,
    complaint_eligible: true,
    complaint_eligible_at: "2026-10-17T16:00:00Z",
  }),
  at("s3", "2026-10-21T15:30:00Z", "2026-10-21"),
  at("s4", "2026-10-23T15:30:00Z", "2026-10-23", {
    status: "reschedule_requested",
    pending_reschedule: { proposed_start: "2026-10-24T08:00:00Z" },
  }),
  at("s5", "2026-10-26T15:30:00Z", "2026-10-26"),
  at("s6", "2026-10-29T15:30:00Z", "2026-10-29"),
  at("s7", "2026-11-02T15:30:00Z", "2026-11-02"),
  at("s8", "2026-11-05T15:30:00Z", "2026-11-05"),
  at("s9", "2026-11-09T15:30:00Z", "2026-11-09"),
  at("s10", "2026-11-12T15:30:00Z", "2026-11-12"),
];

describe("buildStudentSessions: the three parts", () => {
  const board = buildStudentSessions({ sessions: plan, now: NOW });

  it("puts the next meeting on its own, the following ones under Yaklaşanlar, and says which are left out", () => {
    assert.equal(board.next?.id, "s3");
    assert.equal(STUDENT_UPCOMING_LIMIT, 5);
    assert.deepEqual(board.upcoming.map((row) => row.id), ["s4", "s5", "s6", "s7", "s8"]);
    assert.deepEqual(board.moreDates, ["9 Kas", "12 Kas"]);
  });

  it("lists what already happened newest first, cancelled ones included", () => {
    assert.deepEqual(board.past.map((row) => row.id), ["s2", "c1", "s1"]);
  });

  it("numbers by time across the plan and leaves a cancelled meeting without a number", () => {
    assert.equal(board.next?.title, "3. görüşme · 18:30");
    assert.equal(board.next?.number, 3);
    const cancelled = board.past.find((row) => row.id === "c1")!;
    assert.equal(cancelled.number, null);
    assert.equal(cancelled.title, "İptal edilen görüşme · 18:30");
    assert.equal(cancelled.detail, "İptal edildi");
  });

  it("is empty without sessions, and skips a planned meeting whose time has passed without a status change yet", () => {
    const empty = buildStudentSessions({ sessions: [], now: NOW });
    assert.equal(empty.next, null);
    assert.deepEqual([empty.upcoming, empty.moreDates, empty.past], [[], [], []]);

    const stale = buildStudentSessions({
      sessions: [at("old", "2026-10-20T10:00:00Z", "2026-10-20")],
      now: NOW,
    });
    assert.equal(stale.next, null);
    assert.deepEqual(stale.past, []);
  });
});

describe("buildStudentSessions: the next meeting", () => {
  const { next } = buildStudentSessions({ sessions: plan, now: NOW });

  it("carries the day, the countdown and when the room opens", () => {
    assert.equal(next?.dayHeading, "21 Ekim Çarşamba");
    assert.equal(next?.time, "18:30");
    assert.equal(next?.durationMinutes, 30);
    assert.equal(next?.remaining, "1 gün 3 sa");
    assert.deepEqual(next?.join, { kind: "closed", opensLabel: "18:20'de açılır" });
    assert.equal(next?.canReschedule, true);
    assert.deepEqual(next?.date, { weekday: "Çar", day: 21, month: "Eki" });
  });

  it("offers Katıl from ten minutes before and for the session's own length, not a fixed half hour", () => {
    const long = at("long", "2026-10-21T15:30:00Z", "2026-10-21", { duration_minutes: 45 });
    const open = buildStudentSessions({ sessions: [long], now: new Date("2026-10-21T15:20:00Z") });
    assert.deepEqual(open.next?.join, { kind: "open", href: "/session/coaching/long" });
    const late = buildStudentSessions({ sessions: [long], now: new Date("2026-10-21T16:05:00Z") });
    assert.deepEqual(late.next?.join, { kind: "open", href: "/session/coaching/long" });
    const over = buildStudentSessions({ sessions: [long], now: new Date("2026-10-21T16:15:00Z") });
    assert.equal(over.next, null);
  });

  it("shows a running meeting as running, with Katıl and no countdown", () => {
    const running = at("run", "2026-10-20T12:00:00Z", "2026-10-20", { status: "in_progress" });
    const board = buildStudentSessions({ sessions: [running, plan[3]], now: NOW });
    assert.equal(board.next?.id, "run");
    assert.equal(board.next?.live, true);
    assert.equal(board.next?.remaining, null);
    assert.deepEqual(board.next?.join, { kind: "open", href: "/session/coaching/run" });
    assert.equal(board.next?.canReschedule, false);
  });

  it("offers neither Katıl nor Yeniden planla while a change waits for the tutor", () => {
    const waiting = at("w", "2026-10-21T15:30:00Z", "2026-10-21", {
      status: "reschedule_requested",
      pending_reschedule: { proposed_start: "2026-10-22T16:00:00Z" },
    });
    const board = buildStudentSessions({ sessions: [waiting], now: NOW });
    assert.equal(board.next?.waitingForTutor, true);
    assert.equal(board.next?.canReschedule, false);
    assert.equal(board.next?.join, null);
    assert.deepEqual(board.next?.pending, { value: "Per 22 Eki 19:00" });
  });

  it("gives only the first meeting a join state and a countdown", () => {
    const { upcoming } = buildStudentSessions({ sessions: plan, now: NOW });
    for (const row of upcoming) {
      assert.equal(row.join, null, row.id);
      assert.equal(row.remaining, null, row.id);
    }
  });
});

describe("buildStudentSessions: Yaklaşanlar", () => {
  const { upcoming } = buildStudentSessions({ sessions: plan, now: NOW });

  it("says what was proposed and that the tutor has not answered, with no way to change it again", () => {
    const waiting = upcoming.find((row) => row.id === "s4")!;
    assert.equal(waiting.waitingForTutor, true);
    assert.deepEqual(waiting.pending, { value: "Cmt 24 Eki 11:00" });
    assert.equal(waiting.canReschedule, false);
    assert.deepEqual(waiting.date, { weekday: "Cum", day: 23, month: "Eki" });
  });

  it("falls back to the plain waiting line when an older server sends no proposed time", () => {
    const old = at("old", "2026-10-23T15:30:00Z", "2026-10-23", { status: "reschedule_requested" });
    delete (old as Partial<CoachingSessionItem>).pending_reschedule;
    const board = buildStudentSessions({ sessions: [plan[3], old], now: NOW });
    const row = board.upcoming.find((entry) => entry.id === "old")!;
    assert.equal(row.waitingForTutor, true);
    assert.equal(row.pending, null);
  });

  it("offers Yeniden planla on a planned meeting only", () => {
    assert.deepEqual(
      upcoming.map((row) => [row.id, row.canReschedule]),
      [["s4", false], ["s5", true], ["s6", true], ["s7", true], ["s8", true]],
    );
  });
});

describe("buildStudentSessions: Geçmiş", () => {
  const { past } = buildStudentSessions({ sessions: plan, now: NOW });
  const reportLate = past.find((row) => row.id === "s2")!;
  const done = past.find((row) => row.id === "s1")!;

  it("offers a rating once, to a student who has not rated, on a meeting that took place", () => {
    assert.deepEqual(reportLate.rate, { href: "/session/coaching/s2/summary" });
    assert.equal(done.rate, null);
    assert.equal(done.detail, "Tamamlandı · Değerlendirmen alındı");

    const unknown = buildStudentSessions({
      sessions: [at("u", "2026-10-12T15:30:00Z", "2026-10-12", { status: "completed", rating_submitted: undefined })],
      now: NOW,
    });
    assert.equal(unknown.past[0].rate, null);
    assert.equal(unknown.past[0].detail, "Tamamlandı");

    const noShow = buildStudentSessions({
      sessions: [at("n", "2026-10-12T15:30:00Z", "2026-10-12", { status: "tutor_no_show", rating_submitted: false })],
      now: NOW,
    });
    assert.equal(noShow.past[0].rate, null);
    assert.equal(noShow.past[0].detail, "Hoca katılmadı");
  });

  it("offers the problem report only while the report is awaited", () => {
    assert.deepEqual(reportLate.incident, { href: "/session/coaching/s2/summary" });
    assert.equal(done.incident, null);
    assert.equal(reportLate.detail, "Rapor bekleniyor");
  });

  it("carries the overdue report and when support opens", () => {
    assert.deepEqual(reportLate.overdueReport, { dueAt: "2026-10-17T15:30:00Z" });
    assert.equal(reportLate.supportOpen, true);
    assert.equal(reportLate.supportLater, null);

    const early = buildStudentSessions({
      sessions: [
        at("e", "2026-10-15T15:30:00Z", "2026-10-15", {
          status: "awaiting_report",
          complaint_eligible: false,
          complaint_eligible_at: "2026-10-22T16:00:00Z",
        }),
      ],
      now: NOW,
    });
    assert.equal(early.past[0].overdueReport, null);
    assert.equal(early.past[0].supportOpen, false);
    assert.equal(early.past[0].supportLater, "2026-10-22T16:00:00Z");
  });

  it("keeps the date column for a record", () => {
    assert.deepEqual(reportLate.date, { weekday: "Per", day: 15, month: "Eki" });
  });
});

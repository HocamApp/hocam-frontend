import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CoachingDispute,
  CoachingProgramTask,
  CoachingReportListItem,
  CoachingSessionItem,
} from "./coachingApi";
import {
  buildStudentCoachingProgress,
  buildStudentCoachingTimeline,
  buildStudentReportRows,
  coachingInitials,
  coachingRemainingLabel,
  coachingShortDate,
  numberStudentSessions,
  studentCoachingJoin,
} from "./coachingStudentOverview";

// Tuesday 20 October 2026, 15:20 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-20T12:20:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
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
    ...overrides,
  };
}

function task(overrides: Partial<CoachingProgramTask>): CoachingProgramTask {
  return {
    id: "t-1",
    title: "Problemler: 40 soru",
    description: "",
    subject: "Matematik",
    due_date: "2026-10-21",
    priority: null,
    sort_order: 1,
    is_completed: false,
    completed_at: null,
    ...overrides,
  };
}

function dispute(overrides: Partial<CoachingDispute>): CoachingDispute {
  return {
    id: "d-1",
    category: "report_absent",
    status: "under_review",
    description: "Rapor gelmedi",
    submitted_at: "2026-10-16T08:00:00Z",
    service_period_id: "p-1",
    session_id: null,
    determination: null,
    selected_remedy: null,
    application: null,
    refund: { liability_minor: 0, settled_minor: 0, state: "none" },
    evidence: [],
    tutor_responses: [],
    timeline: [],
    ...overrides,
  };
}

function report(overrides: Partial<CoachingReportListItem> & { published_at?: string; revision_number?: number }): CoachingReportListItem {
  const { published_at = "2026-10-15T10:00:00Z", revision_number = 1, ...rest } = overrides;
  return {
    id: "r-1",
    session_id: "s-2",
    latest_revision: {
      id: "rev-1",
      revision_number,
      source_draft_version: 1,
      content: {} as never,
      published_at,
      change_note: null,
    },
    ...rest,
  };
}

const done1 = session({ id: "s-1", status: "completed", scheduled_start: "2026-10-12T15:30:00Z", scheduled_local_date: "2026-10-12" });
const done2 = session({ id: "s-2", status: "awaiting_report", scheduled_start: "2026-10-15T15:30:00Z", scheduled_local_date: "2026-10-15" });
const next = session({ id: "s-3" });
const fri = session({ id: "s-4", scheduled_start: "2026-10-23T15:30:00Z", scheduled_local_date: "2026-10-23" });
const mon = session({ id: "s-5", scheduled_start: "2026-10-26T15:30:00Z", scheduled_local_date: "2026-10-26" });
const cancelled = session({ id: "s-x", status: "cancelled", scheduled_start: "2026-10-14T15:30:00Z", scheduled_local_date: "2026-10-14" });

describe("small helpers", () => {
  it("writes a local date as day and short month", () => {
    assert.equal(coachingShortDate("2026-10-20"), "20 Eki");
    assert.equal(coachingShortDate("2026-11-03"), "3 Kas");
  });

  it("takes two initials, upper-cased the Turkish way", () => {
    assert.equal(coachingInitials("Elif Kaya"), "EK");
    assert.equal(coachingInitials("ışıl çakır"), "IÇ");
    assert.equal(coachingInitials("Mert"), "M");
    assert.equal(coachingInitials("  "), "H");
    assert.equal(coachingInitials(null), "H");
  });

  it("counts down in days and hours, then hours and minutes, then minutes", () => {
    const at = (iso: string) => Date.parse(iso);
    assert.equal(coachingRemainingLabel(at("2026-10-21T15:30:00Z"), NOW), "1 gün 3 sa");
    assert.equal(coachingRemainingLabel(at("2026-10-22T12:20:00Z"), NOW), "2 gün");
    assert.equal(coachingRemainingLabel(at("2026-10-20T18:50:00Z"), NOW), "6 sa 30 dk");
    assert.equal(coachingRemainingLabel(at("2026-10-20T15:20:00Z"), NOW), "3 sa");
    assert.equal(coachingRemainingLabel(at("2026-10-20T12:45:00Z"), NOW), "25 dk");
    assert.equal(coachingRemainingLabel(at("2026-10-20T12:20:00Z"), NOW), null);
    assert.equal(coachingRemainingLabel(at("2026-10-20T12:00:00Z"), NOW), null);
  });
});

describe("numberStudentSessions", () => {
  it("numbers by time across the plan and leaves cancelled ones out", () => {
    const numbered = numberStudentSessions([fri, cancelled, done1, next]);
    assert.deepEqual(
      numbered.map(({ session: s, number }) => [s.id, number]),
      [["s-1", 1], ["s-3", 2], ["s-4", 3]],
    );
  });
});

describe("buildStudentCoachingProgress", () => {
  it("marks held sessions, the next one, and the rest still to come", () => {
    const progress = buildStudentCoachingProgress({
      sessions: [done1, done2, next, fri, mon, cancelled],
      totalSessions: 8,
    });
    assert.deepEqual(progress?.segments, ["done", "done", "next", "later", "later", "later", "later", "later"]);
    assert.equal(progress?.doneCount, 2);
    assert.equal(progress?.nextNumber, 3);
    assert.equal(progress?.summary, "2 görüşme tamamlandı · 3. görüşme sırada");
    assert.equal(progress?.range, "12 Eki – 26 Eki");
  });

  it("shows a missed meeting as missed, not as held", () => {
    const progress = buildStudentCoachingProgress({
      sessions: [session({ id: "m", status: "tutor_no_show", scheduled_start: "2026-10-12T15:30:00Z", scheduled_local_date: "2026-10-12" }), next],
      totalSessions: 2,
    });
    assert.deepEqual(progress?.segments, ["missed", "next"]);
    assert.equal(progress?.doneCount, 0);
    assert.equal(progress?.summary, "0 görüşme tamamlandı · 2. görüşme sırada");
  });

  it("says so when everything is done", () => {
    const progress = buildStudentCoachingProgress({
      sessions: [done1, done2],
      totalSessions: 2,
    });
    assert.deepEqual(progress?.segments, ["done", "done"]);
    assert.equal(progress?.summary, "2 görüşmenin hepsi tamamlandı");
    assert.equal(progress?.nextNumber, null);
  });

  it("never draws fewer segments than there are sessions, and none without sessions", () => {
    const progress = buildStudentCoachingProgress({ sessions: [done1, done2, next], totalSessions: 2 });
    assert.equal(progress?.segments.length, 3);
    assert.equal(buildStudentCoachingProgress({ sessions: [], totalSessions: 8 }), null);
    assert.equal(buildStudentCoachingProgress({ sessions: [cancelled], totalSessions: 8 }), null);
  });
});

describe("studentCoachingJoin", () => {
  const at = (iso: string) => new Date(iso);

  it("opens ten minutes before the start, the student's rule in the backend", () => {
    // start 15:30Z; opens 15:20Z
    assert.deepEqual(studentCoachingJoin(next, at("2026-10-21T15:19:00Z")), { kind: "closed", opensLabel: "18:20'de açılır" });
    assert.deepEqual(studentCoachingJoin(next, at("2026-10-21T15:20:00Z")), { kind: "open", href: "/session/coaching/s-3" });
    assert.deepEqual(studentCoachingJoin(next, at("2026-10-21T15:21:00Z")), { kind: "open", href: "/session/coaching/s-3" });
  });

  it("stays open until start plus the session's own length, not a fixed half hour", () => {
    const long = session({ id: "long", duration_minutes: 45 });
    assert.equal(studentCoachingJoin(long, at("2026-10-21T16:14:00Z"))?.kind, "open");
    assert.equal(studentCoachingJoin(long, at("2026-10-21T16:15:00Z")), null);
  });

  it("joins a running session, but offers nothing once it has ended or when it is not joinable", () => {
    const running = session({ id: "run", status: "in_progress" });
    assert.equal(studentCoachingJoin(running, at("2026-10-21T15:40:00Z"))?.kind, "open");
    assert.equal(studentCoachingJoin(running, at("2026-10-21T16:00:00Z")), null);
    assert.equal(studentCoachingJoin(session({ status: "reschedule_requested" }), at("2026-10-21T15:25:00Z")), null);
    assert.equal(studentCoachingJoin(session({ status: "completed" }), at("2026-10-21T15:25:00Z")), null);
  });
});

describe("buildStudentCoachingTimeline: Sırada", () => {
  it("merges the next sessions and the tasks by date, a session before the same day's task", () => {
    const { ahead } = buildStudentCoachingTimeline({
      sessions: [done1, next, fri, mon],
      tasks: [
        task({ id: "t-cum", title: "Türev analizi", due_date: "2026-10-23" }),
        task({ id: "t-car", title: "Problemler: 40 soru", due_date: "2026-10-21" }),
        task({ id: "t-per", title: "Paragraf: 2 deneme", subject: "Türkçe", due_date: "2026-10-22" }),
      ],
      disputes: [],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(
      ahead.map((item) => item.id),
      ["session-s-3", "task-t-car", "task-t-per", "session-s-4", "task-t-cum"],
    );
    assert.deepEqual(ahead[0].date, { weekday: "Çar", day: 21, month: "Eki" });
    assert.equal(ahead[0].title, "2. görüşme · 18:30");
    assert.equal(ahead[0].tone, "pink");
    assert.equal(ahead[1].tone, "gold");
    assert.deepEqual(ahead[1].action, { kind: "complete", taskId: "t-car" });
  });

  it("gives only the first session a join state and a countdown", () => {
    const { ahead } = buildStudentCoachingTimeline({ sessions: [next, fri], tasks: [], disputes: [], reports: [], now: NOW });
    assert.deepEqual(ahead[0].join, { kind: "closed", opensLabel: "18:20'de açılır" });
    assert.equal(ahead[0].remaining, "1 gün 3 sa");
    assert.equal(ahead[1].join, null);
    assert.equal(ahead[1].remaining, null);
  });

  it("shows a running session as running", () => {
    const { ahead } = buildStudentCoachingTimeline({
      sessions: [session({ id: "run", status: "in_progress", scheduled_start: "2026-10-20T12:00:00Z", scheduled_local_date: "2026-10-20", scheduled_local_time: "15:00" }), next],
      tasks: [],
      disputes: [],
      reports: [],
      now: NOW,
    });
    assert.equal(ahead[0].id, "session-run");
    assert.equal(ahead[0].live, true);
    assert.equal(ahead[0].remaining, null);
    assert.deepEqual(ahead[0].join, { kind: "open", href: "/session/coaching/run" });
  });

  it("says a reschedule is waiting instead of offering Katıl, and skips a session that already ended", () => {
    const { ahead } = buildStudentCoachingTimeline({
      sessions: [
        session({ id: "gone", scheduled_start: "2026-10-20T10:00:00Z", scheduled_local_date: "2026-10-20", scheduled_local_time: "13:00" }),
        session({ id: "wait", status: "reschedule_requested" }),
      ],
      tasks: [],
      disputes: [],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(ahead.map((item) => item.id), ["session-wait"]);
    assert.equal(ahead[0].detail, "Saat değişikliği bekleniyor");
    assert.equal(ahead[0].join, null);
  });

  it("keeps an overdue task, first and marked, and drops finished ones", () => {
    const { ahead } = buildStudentCoachingTimeline({
      sessions: [next],
      tasks: [
        task({ id: "late", title: "Eski görev", due_date: "2026-10-18" }),
        task({ id: "fin", is_completed: true, due_date: "2026-10-21" }),
      ],
      disputes: [],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(ahead.map((item) => item.id), ["task-late", "session-s-3"]);
    assert.equal(ahead[0].overdue, true);
    assert.equal(ahead[1].overdue, false);
  });

  it("folds tasks without a date into one last row that opens the program", () => {
    const { ahead } = buildStudentCoachingTimeline({
      sessions: [next],
      tasks: [
        task({ id: "n1", due_date: null }),
        task({ id: "n2", due_date: null }),
        task({ id: "d1", due_date: "2026-10-22" }),
      ],
      disputes: [],
      reports: [],
      now: NOW,
    });
    const last = ahead[ahead.length - 1];
    assert.equal(last.kind, "undated");
    assert.equal(last.title, "Tarihi olmayan 2 görev");
    assert.deepEqual(last.action, { kind: "link", label: "Programı aç", href: "/dashboard/student/coaching/program" });
    assert.equal(last.date, null);
  });

  it("puts what the support team waits on from the student first", () => {
    const { ahead, past } = buildStudentCoachingTimeline({
      sessions: [next],
      tasks: [],
      disputes: [
        dispute({ id: "d-info", status: "needs_more_info", category: "report_absent" }),
        dispute({ id: "d-choice", status: "awaiting_student_choice", category: "tutor_no_show", submitted_at: "2026-10-17T08:00:00Z" }),
        dispute({ id: "d-open", status: "under_review" }),
      ],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(ahead.map((item) => item.id), ["dispute-d-info", "dispute-d-choice", "session-s-3"]);
    assert.equal(ahead[0].title, "Destek ekibi ek bilgi istiyor");
    assert.equal(ahead[1].title, "Çözüm seçeneğini seç");
    assert.deepEqual(ahead[0].action, { kind: "link", label: "Yanıtla", href: "/dashboard/student/coaching/complaints/d-info" });
    assert.deepEqual(ahead[1].action, { kind: "link", label: "Seçimini yap", href: "/dashboard/student/coaching/complaints/d-choice" });
    // The one still under review is a record, not a to-do.
    assert.deepEqual(past.map((item) => item.id), ["dispute-d-open"]);
  });

  it("cuts the list at six rows, keeping the undated row last, and says how many are hidden", () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      task({ id: `t-${i}`, due_date: `2026-10-${String(22 + i).padStart(2, "0")}` }),
    );
    tasks.push(task({ id: "nodate", due_date: null }));
    const { ahead, hidden } = buildStudentCoachingTimeline({ sessions: [next], tasks, disputes: [], reports: [], now: NOW });
    assert.equal(ahead.length, 6);
    assert.equal(ahead[5].kind, "undated");
    assert.equal(ahead[0].id, "session-s-3");
    assert.equal(hidden, 4);
  });

  it("is empty with nothing to do", () => {
    const { ahead, hidden, past } = buildStudentCoachingTimeline({ sessions: [done1], tasks: [], disputes: [], reports: [], now: NOW });
    assert.deepEqual(ahead, []);
    assert.equal(hidden, 0);
    assert.deepEqual(past, []);
  });
});

describe("buildStudentReportRows", () => {
  it("lists the newest published reports first, at most three, without claiming a meeting number it cannot know", () => {
    const rows = buildStudentReportRows({
      reports: [
        report({ id: "r-1", published_at: "2026-10-05T10:00:00Z" }),
        report({ id: "r-2", published_at: "2026-10-08T10:00:00Z" }),
        report({ id: "r-3", published_at: "2026-10-12T10:00:00Z" }),
        report({ id: "r-4", published_at: "2026-10-15T10:00:00Z", revision_number: 2 }),
        { id: "r-draft", session_id: "x", latest_revision: null },
      ],
      limit: 3,
    });
    assert.deepEqual(rows.map((row) => row.id), ["report-r-4", "report-r-3", "report-r-2"]);
    assert.equal(rows[0].title, "Görüşme raporu yayınlandı");
    assert.equal(rows[0].detail, "Sürüm 2");
    assert.deepEqual(rows[0].action, { kind: "link", label: "Raporu aç", href: "/dashboard/student/coaching/reports/r-4" });
  });
});

describe("buildStudentCoachingTimeline: Geçmiş", () => {
  it("shows the latest published report with its meeting number, and open complaints, newest first", () => {
    const { past } = buildStudentCoachingTimeline({
      sessions: [done1, done2, next],
      tasks: [],
      disputes: [dispute({ id: "d-open", status: "under_review", submitted_at: "2026-10-16T08:00:00Z" })],
      reports: [
        report({ id: "r-old", session_id: "s-1", published_at: "2026-10-13T10:00:00Z" }),
        report({ id: "r-new", session_id: "s-2", published_at: "2026-10-15T10:00:00Z", revision_number: 2 }),
      ],
      now: NOW,
    });
    assert.deepEqual(past.map((item) => item.id), ["dispute-d-open", "report-r-new"]);
    assert.equal(past[1].title, "2. görüşme raporu yayınlandı");
    assert.equal(past[1].detail, "Sürüm 2");
    assert.deepEqual(past[1].date, { weekday: "Per", day: 15, month: "Eki" });
    assert.equal(past[1].tone, "ink");
    assert.deepEqual(past[1].action, { kind: "link", label: "Raporu aç", href: "/dashboard/student/coaching/reports/r-new" });
    assert.equal(past[0].title, "Sorun bildirimin");
    assert.equal(past[0].detail, "Rapor hazırlanmadı · İnceleniyor");
    assert.deepEqual(past[0].action, { kind: "link", label: "Durumu gör", href: "/dashboard/student/coaching/complaints/d-open" });
  });

  it("falls back to a plain title when the report's meeting is unknown, and ignores closed complaints", () => {
    const { past } = buildStudentCoachingTimeline({
      sessions: [],
      tasks: [],
      disputes: [dispute({ id: "d-done", status: "resolved" }), dispute({ id: "d-shut", status: "closed" })],
      reports: [report({ id: "r-x", session_id: "gone" })],
      now: NOW,
    });
    assert.deepEqual(past.map((item) => item.title), ["Görüşme raporu yayınlandı"]);
  });

  it("skips a report that has no published revision", () => {
    const { past } = buildStudentCoachingTimeline({
      sessions: [done2],
      tasks: [],
      disputes: [],
      reports: [{ id: "r-draft", session_id: "s-2", latest_revision: null }],
      now: NOW,
    });
    assert.deepEqual(past, []);
  });
});

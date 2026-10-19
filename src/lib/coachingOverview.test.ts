import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  AcceptanceRequest,
  CoachingRescheduleRequestItem,
  CoachingSessionItem,
  CoachingTimeRequest,
} from "./coachingApi";
import {
  buildCoachingTodos,
  buildCoachingWeek,
  coachingDueLabel,
  istanbulDateKey,
} from "./coachingOverview";

// Monday 19 October 2026, 12:30 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-19T09:30:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "p-1",
    sequence_number: 1,
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

function acceptance(overrides: Partial<AcceptanceRequest> = {}): AcceptanceRequest {
  return {
    id: "a-1",
    student: { id: "u-1", name: "Can", surname: "T." },
    package: { id: "pk-1", plan_name: "Paket", lessons_per_week: 2, duration_days: 30, total_credits: 8, total_price: 2400 },
    coaching: { frequency: "weekly", total_sessions: 4, total_price_minor: 240000, service_status: "pending" },
    includes_coaching: true,
    status: "pending",
    purchase_status: "pending_acceptance",
    requested_at: "2026-10-19T08:00:00Z",
    expires_at: "2026-10-19T11:45:00Z",
    responded_at: null,
    rejection_reason: "",
    rejection_note: "",
    ...overrides,
  } as AcceptanceRequest;
}

function reschedule(overrides: Partial<CoachingRescheduleRequestItem> = {}): CoachingRescheduleRequestItem {
  return {
    id: "r-1",
    session_id: "s-9",
    requested_by: "student",
    original_start: "2026-10-21T15:30:00Z",
    proposed_start: "2026-10-22T15:30:00Z",
    is_free: true,
    consumes_student_free_entitlement: true,
    requires_tutor_approval: true,
    granted_free_by_tutor: false,
    status: "pending",
    requested_at: "2026-10-19T07:00:00Z",
    responded_at: null,
    rejection_reason: "",
    student_name: "Mert A.",
    ...overrides,
  } as CoachingRescheduleRequestItem;
}

function timeRequest(overrides: Partial<CoachingTimeRequest> = {}): CoachingTimeRequest {
  return {
    id: "t-1",
    slot_index: 0,
    status: "pending",
    note: "",
    requested_at: "2026-10-19T06:00:00Z",
    expires_at: "2026-10-21T09:00:00Z",
    resolved_at: null,
    proposals: [],
    ...overrides,
  } as CoachingTimeRequest;
}

const reportSession = session({
  id: "s-report",
  status: "awaiting_report",
  scheduled_start: "2026-10-18T16:00:00Z",
  scheduled_local_date: "2026-10-18",
  report_due_at: "2026-10-20T15:00:00Z",
});

describe("istanbulDateKey", () => {
  it("reads the calendar day in Istanbul, not in UTC", () => {
    assert.equal(istanbulDateKey(new Date("2026-10-19T21:30:00Z")), "2026-10-20");
    assert.equal(istanbulDateKey(new Date("2026-10-19T20:59:00Z")), "2026-10-19");
  });
});

describe("coachingDueLabel", () => {
  it("counts down in hours and minutes when the deadline is close, and calls it urgent", () => {
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-19T11:45:00Z"), NOW), {
      label: "2 sa 15 dk kaldı",
      urgent: true,
    });
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-19T10:15:00Z"), NOW), {
      label: "45 dk kaldı",
      urgent: true,
    });
  });

  it("names the day and time further out, and is not urgent", () => {
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-19T16:00:00Z"), NOW), { label: "Bugün 19:00", urgent: false });
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-20T15:00:00Z"), NOW), { label: "Yarın 18:00", urgent: false });
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-21T15:30:00Z"), NOW), { label: "Çar 18:30", urgent: false });
  });

  it("can say before, for a deadline that is the meeting itself", () => {
    assert.equal(coachingDueLabel(Date.parse("2026-10-21T15:30:00Z"), NOW, { before: true }).label, "Çar 18:30 öncesi");
  });

  it("says the time has passed once it has", () => {
    assert.deepEqual(coachingDueLabel(Date.parse("2026-10-19T08:00:00Z"), NOW), { label: "Süresi geçti", urgent: true });
  });
});

describe("buildCoachingTodos", () => {
  const todos = buildCoachingTodos({
    sessions: [session({}), reportSession, session({ id: "s-wed", scheduled_start: "2026-10-21T15:30:00Z", scheduled_local_date: "2026-10-21", scheduled_local_time: "18:30" })],
    acceptanceRequests: [acceptance()],
    rescheduleRequests: [reschedule()],
    timeRequests: [timeRequest()],
    now: NOW,
  });

  it("puts what is due soonest first, whatever kind it is", () => {
    assert.deepEqual(
      todos.map((item) => item.kind),
      ["acceptance", "session", "report", "time", "reschedule"]
    );
  });

  it("asks to answer a coaching request, with the package and a countdown", () => {
    const item = todos[0];
    assert.equal(item.title, "Can T. koçluk istiyor");
    assert.equal(item.detail, "Haftada 1 görüşme · 4 görüşmelik paket · 2.400,00 ₺");
    assert.deepEqual(item.due, { label: "2 sa 15 dk kaldı", urgent: true });
    assert.deepEqual(item.action, { label: "Yanıtla", href: "/dashboard/tutor/coaching/requests" });
    assert.equal(item.tab, "requests");
  });

  it("lists today's meeting with its time and a way to prepare", () => {
    const item = todos[1];
    assert.equal(item.title, "Bugün 19:00 · Zeynep K.");
    assert.equal(item.detail, "30 dk görüşme");
    assert.equal(item.due, null);
    assert.deepEqual(item.action, { label: "Hazırlan", href: "/dashboard/tutor/coaching/sessions/s-1/prepare" });
    assert.equal(item.tab, "today");
  });

  it("does not list a meeting on another day as a to-do", () => {
    assert.equal(todos.filter((item) => item.kind === "session").length, 1);
  });

  it("asks for a report that is owed, due when the server says", () => {
    const item = todos[2];
    assert.equal(item.title, "Zeynep K. raporu yazılmadı");
    assert.equal(item.detail, "18 Ekim Pazar görüşmesi");
    assert.deepEqual(item.due, { label: "Yarın 18:00", urgent: false });
    assert.deepEqual(item.action, { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-report/report" });
    assert.equal(item.tab, "reports");
  });

  it("asks to answer a time request, which names no student", () => {
    const item = todos[3];
    assert.equal(item.title, "Saat isteği geldi");
    assert.equal(item.detail, "Uygun saat bulamayan öğrenciye saat öner.");
    assert.deepEqual(item.due, { label: "Çar 12:00", urgent: false });
    assert.deepEqual(item.action, { label: "Saat öner", href: "/dashboard/tutor/coaching/time-requests" });
  });

  it("asks to answer a reschedule request before the meeting it would move", () => {
    const item = todos[4];
    assert.equal(item.title, "Mert A. saat değiştirmek istiyor");
    assert.match(item.detail ?? "", /18:30 yerine .*18:30/);
    assert.deepEqual(item.due, { label: "Çar 18:30 öncesi", urgent: false });
    assert.deepEqual(item.action, { label: "Yanıtla", href: "/dashboard/tutor/coaching/reschedule-requests" });
  });

  it("offers Katıl, not Hazırlan, for a meeting that is already running", () => {
    const live = buildCoachingTodos({
      sessions: [session({ id: "s-live", status: "in_progress", scheduled_start: "2026-10-19T09:20:00Z", scheduled_local_time: "12:20" })],
      acceptanceRequests: [],
      rescheduleRequests: [],
      timeRequests: [],
      now: NOW,
    });
    assert.deepEqual(live[0].action, { label: "Katıl", href: "/session/coaching/s-live" });
    assert.equal(live[0].detail, "Devam ediyor · 30 dk görüşme");
  });

  it("flags an overdue report as past due", () => {
    const overdue = buildCoachingTodos({
      sessions: [{ ...reportSession, report_overdue: true, report_due_at: "2026-10-19T08:00:00Z" }],
      acceptanceRequests: [],
      rescheduleRequests: [],
      timeRequests: [],
      now: NOW,
    });
    assert.deepEqual(overdue[0].due, { label: "Süresi geçti", urgent: true });
  });

  it("leaves out everything that is not waiting for the tutor", () => {
    const quiet = buildCoachingTodos({
      sessions: [session({ status: "completed" }), session({ id: "s-c", status: "cancelled" })],
      acceptanceRequests: [
        acceptance({ id: "a-done", status: "accepted" }),
        acceptance({ id: "a-plain", includes_coaching: false, coaching: null }),
      ],
      rescheduleRequests: [reschedule({ status: "approved" } as Partial<CoachingRescheduleRequestItem>)],
      timeRequests: [timeRequest({ status: "matched" })],
      now: NOW,
    });
    assert.deepEqual(quiet, []);
  });

  it("falls back to a plain word when a student has no name", () => {
    const nameless = buildCoachingTodos({
      sessions: [reportSession, session({ student_name: undefined })].map((row) => ({ ...row, student_name: undefined })),
      acceptanceRequests: [],
      rescheduleRequests: [],
      timeRequests: [],
      now: NOW,
    });
    assert.equal(nameless.find((item) => item.kind === "report")?.title, "Öğrenci raporu yazılmadı");
  });
});

describe("buildCoachingWeek", () => {
  const sessions = [
    session({ id: "pzt", scheduled_local_date: "2026-10-19", scheduled_local_time: "19:00" }),
    session({ id: "car", scheduled_local_date: "2026-10-21", scheduled_local_time: "18:30", student_name: "Mert A." }),
    session({ id: "per", scheduled_local_date: "2026-10-22", scheduled_local_time: "20:00", student_name: "Elif Y." }),
    session({ id: "per-erken", scheduled_local_date: "2026-10-22", scheduled_local_time: "09:00", student_name: "Can T." }),
    session({ id: "cmt", scheduled_local_date: "2026-10-24", scheduled_local_time: "11:00", student_name: "Mert A." }),
    session({ id: "gecen-hafta", scheduled_local_date: "2026-10-18", scheduled_local_time: "19:00", status: "awaiting_report" }),
    session({ id: "gelecek-hafta", scheduled_local_date: "2026-10-26", scheduled_local_time: "19:00" }),
  ];
  const week = buildCoachingWeek({ sessions, now: NOW });

  it("runs Monday to Sunday around today, labelled with the day number", () => {
    assert.deepEqual(
      week.days.map((day) => day.label),
      ["Pzt 19", "Sal 20", "Çar 21", "Per 22", "Cum 23", "Cmt 24", "Paz 25"]
    );
    assert.deepEqual(
      week.days.map((day) => day.dateKey),
      ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]
    );
  });

  it("marks today", () => {
    assert.deepEqual(week.days.map((day) => day.isToday), [true, false, false, false, false, false, false]);
  });

  it("puts each meeting on its day, earliest first, and leaves other weeks out", () => {
    assert.deepEqual(week.days[0].sessions.map((row) => row.id), ["pzt"]);
    assert.deepEqual(week.days[3].sessions.map((row) => row.id), ["per-erken", "per"]);
    assert.equal(week.days[1].sessions.length, 0);
    assert.equal(week.days.flatMap((day) => day.sessions).some((row) => row.id === "gecen-hafta" || row.id === "gelecek-hafta"), false);
  });

  it("counts the week's meetings", () => {
    assert.equal(week.total, 5);
  });

  it("starts the week on Monday even when today is Sunday", () => {
    const sunday = buildCoachingWeek({ sessions: [], now: new Date("2026-10-25T10:00:00Z") });
    assert.equal(sunday.days[0].label, "Pzt 19");
    assert.equal(sunday.days[6].isToday, true);
  });

  it("does not count a cancelled or finished meeting", () => {
    const done = buildCoachingWeek({
      sessions: [session({ status: "cancelled" }), session({ id: "x", status: "completed" })],
      now: NOW,
    });
    assert.equal(done.total, 0);
  });

  it("carries what the row needs to be drawn", () => {
    assert.deepEqual(week.days[2].sessions[0], { id: "car", time: "18:30", studentName: "Mert A." });
  });
});

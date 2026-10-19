import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CoachingRescheduleRequestItem,
  CoachingSessionItem,
  CoachingStudentRow,
  CoachingTimeRequest,
} from "./coachingApi";
import { buildStudentsBoard, studentInitials } from "./coachingStudents";

// Monday 19 October 2026, 12:30 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-19T09:30:00Z");

function student(overrides: Partial<CoachingStudentRow>): CoachingStudentRow {
  return {
    purchase_id: "pu-1",
    service_period_id: "sp-1",
    student_name: "Zeynep K.",
    service_status: "active",
    frequency: "twice_weekly",
    recurring_slots: [
      { id: "r2", slot_index: 1, day_of_week: 4, start_time: "19:00:00", source: "availability" },
      { id: "r1", slot_index: 0, day_of_week: 0, start_time: "19:00:00", source: "availability" },
    ],
    ...overrides,
  } as CoachingStudentRow;
}

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
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

const reportSession = session({
  id: "s-report",
  status: "awaiting_report",
  scheduled_start: "2026-10-18T16:00:00Z",
  scheduled_local_date: "2026-10-18",
  report_due_at: "2026-10-20T15:00:00Z",
});

const rescheduleRequest = {
  id: "rr-1",
  session_id: "s-9",
  requested_by: "student",
  original_start: "2026-10-21T15:30:00Z",
  proposed_start: "2026-10-22T15:30:00Z",
  status: "pending",
  student_name: "Mert A.",
} as CoachingRescheduleRequestItem;

const timeRequest = {
  id: "tr-1",
  slot_index: 0,
  status: "pending",
  note: "",
  requested_at: "2026-10-19T06:00:00Z",
  expires_at: "2026-10-21T09:00:00Z",
  resolved_at: null,
  proposals: [],
} as CoachingTimeRequest;

const students = [
  student({}),
  student({
    purchase_id: "pu-2",
    service_period_id: "sp-2",
    student_name: "Mert A.",
    recurring_slots: [
      { id: "m1", slot_index: 0, day_of_week: 2, start_time: "18:30:00", source: "availability" },
      { id: "m2", slot_index: 1, day_of_week: 5, start_time: "11:00:00", source: "tutor_proposal" },
    ],
  } as Partial<CoachingStudentRow>),
  student({
    purchase_id: "pu-3",
    service_period_id: "sp-3",
    student_name: "Elif Y.",
    frequency: "weekly",
    recurring_slots: [{ id: "e1", slot_index: 0, day_of_week: 3, start_time: "20:00:00", source: "availability" }],
  } as Partial<CoachingStudentRow>),
  student({
    purchase_id: "pu-4",
    service_period_id: null,
    student_name: "Deniz Ö.",
    service_status: "accepted_awaiting_schedule",
    frequency: "weekly",
    recurring_slots: [],
  }),
  student({
    purchase_id: "pu-5",
    service_period_id: "sp-5",
    student_name: "Ece B.",
    service_status: "cancellation_pending",
    frequency: "weekly",
    recurring_slots: [],
  }),
];

const sessions = [
  session({}),
  reportSession,
  session({ id: "s-mert", service_period_id: "sp-2", scheduled_start: "2026-10-21T15:30:00Z", scheduled_local_date: "2026-10-21", student_name: "Mert A." }),
  session({ id: "s-mert-2", service_period_id: "sp-2", scheduled_start: "2026-10-24T08:00:00Z", scheduled_local_date: "2026-10-24", student_name: "Mert A." }),
  session({ id: "s-elif", service_period_id: "sp-3", scheduled_start: "2026-10-22T17:00:00Z", scheduled_local_date: "2026-10-22", student_name: "Elif Y." }),
];

const board = buildStudentsBoard({
  students,
  sessions,
  timeRequests: [timeRequest],
  rescheduleRequests: [rescheduleRequest],
  now: NOW,
});

describe("studentInitials", () => {
  it("takes the first letters of the first two words", () => {
    assert.equal(studentInitials("Zeynep K."), "ZK");
    assert.equal(studentInitials("deniz özkan yılmaz"), "DÖ");
    assert.equal(studentInitials("Elif"), "E");
    assert.equal(studentInitials("  "), "?");
  });
});

describe("buildStudentsBoard: waiting on the tutor", () => {
  it("lists what is owed, soonest first, whether it is a report, a reschedule or a time request", () => {
    assert.deepEqual(
      board.waiting.map((item) => item.kind),
      ["report", "time", "reschedule"]
    );
  });

  it("asks for a report with its deadline set apart from the sentence", () => {
    const item = board.waiting[0];
    assert.equal(item.title, "Zeynep K. raporu yazılmadı");
    assert.equal(item.detail, "18 Ekim Pazar görüşmesi");
    assert.deepEqual(item.due, { caption: "Son tarih", value: "Yarın 18:00", urgent: false });
    assert.deepEqual(item.action, { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-report/report" });
    assert.equal(item.initials, "ZK");
  });

  it("asks for an answer to a reschedule request with the day the answer is due", () => {
    const item = board.waiting[2];
    assert.equal(item.title, "Mert A. saat değiştirmek istiyor");
    assert.match(item.detail ?? "", /18:30 yerine .*18:30/);
    assert.deepEqual(item.due, { caption: "Son yanıt", value: "Çar 18:30", urgent: false });
    assert.deepEqual(item.action, { label: "Yanıtla", href: "/dashboard/tutor/coaching/reschedule-requests" });
    assert.equal(item.initials, "MA");
  });

  it("asks for a time proposal without naming a student the API does not name", () => {
    const item = board.waiting[1];
    assert.equal(item.title, "Saat isteği geldi");
    assert.equal(item.initials, null);
    assert.deepEqual(item.action, { label: "Saat öner", href: "/dashboard/tutor/coaching/time-requests" });
    assert.equal(item.due.caption, "Son yanıt");
  });

  it("leaves out whatever is not waiting for the tutor", () => {
    const quiet = buildStudentsBoard({
      students: [],
      sessions: [session({ status: "completed" })],
      timeRequests: [{ ...timeRequest, status: "matched" }],
      rescheduleRequests: [{ ...rescheduleRequest, status: "approved" }],
      now: NOW,
    });
    assert.deepEqual(quiet.waiting, []);
  });

  it("falls back to a plain word for a student with no name", () => {
    const nameless = buildStudentsBoard({
      students: [],
      sessions: [{ ...reportSession, student_name: undefined }],
      timeRequests: [],
      rescheduleRequests: [],
      now: NOW,
    });
    assert.equal(nameless.waiting[0].title, "Öğrenci raporu yazılmadı");
  });
});

describe("buildStudentsBoard: active students", () => {
  it("lists active students with their rhythm and the hours they meet, Monday first", () => {
    const zeynep = board.active.find((row) => row.name === "Zeynep K.");
    assert.equal(zeynep?.summary, "Haftada 2 görüşme · Pzt 19:00, Cum 19:00");
    assert.equal(zeynep?.initials, "ZK");
  });

  it("marks an hour the tutor proposed", () => {
    const mert = board.active.find((row) => row.name === "Mert A.");
    assert.equal(mert?.summary, "Haftada 2 görüşme · Çar 18:30, Cmt 11:00 (özel saat)");
  });

  it("names each student's next meeting as a clock time", () => {
    assert.deepEqual(
      board.active.map((row) => [row.name, row.next]),
      [
        ["Zeynep K.", "Bugün 19:00"],
        ["Mert A.", "Çar 18:30"],
        ["Elif Y.", "Per 20:00"],
      ]
    );
  });

  it("puts the soonest meeting first", () => {
    assert.deepEqual(board.active.map((row) => row.name), ["Zeynep K.", "Mert A.", "Elif Y."]);
  });

  it("links to the program page of the current period", () => {
    assert.equal(
      board.active[0].programHref,
      "/dashboard/tutor/coaching/service-periods/sp-1/program"
    );
  });

  it("says Şimdi for a meeting that is running", () => {
    const live = buildStudentsBoard({
      students: [student({})],
      sessions: [session({ status: "in_progress", scheduled_start: "2026-10-19T09:20:00Z" })],
      timeRequests: [],
      rescheduleRequests: [],
      now: NOW,
    });
    assert.equal(live.active[0].next, "Şimdi");
  });

  it("has no next meeting when none is booked, and does not take another student's", () => {
    const none = buildStudentsBoard({
      students: [student({ service_period_id: "sp-other" })],
      sessions: [session({})],
      timeRequests: [],
      rescheduleRequests: [],
      now: NOW,
    });
    assert.equal(none.active[0].next, null);
  });

  it("says no hours chosen rather than an empty list", () => {
    const bare = buildStudentsBoard({
      students: [student({ recurring_slots: [] })],
      sessions: [],
      timeRequests: [],
      rescheduleRequests: [],
      now: NOW,
    });
    assert.equal(bare.active[0].summary, "Haftada 2 görüşme · saat seçilmedi");
  });
});

describe("buildStudentsBoard: set apart", () => {
  it("keeps the student who has not chosen hours apart, with a way to end the coaching", () => {
    const deniz = board.pending.find((row) => row.name === "Deniz Ö.");
    assert.equal(deniz?.status, "awaiting_schedule");
    assert.equal(deniz?.note, "Henüz saat seçmedi");
    assert.equal(deniz?.canEnd, true);
    assert.equal(deniz?.purchaseId, "pu-4");
  });

  it("shows a coaching that is being ended without offering to end it again", () => {
    const ece = board.pending.find((row) => row.name === "Ece B.");
    assert.equal(ece?.status, "cancellation_pending");
    assert.equal(ece?.note, "Sonlandırılıyor");
    assert.equal(ece?.canEnd, false);
  });

  it("keeps neither of them among the active students", () => {
    assert.equal(board.active.some((row) => row.name === "Deniz Ö." || row.name === "Ece B."), false);
  });
});

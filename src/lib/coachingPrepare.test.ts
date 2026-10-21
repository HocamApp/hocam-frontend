import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type {
  CoachingAttachmentItem,
  CoachingProgram,
  CoachingProgramTask,
  CoachingReportListItem,
  CoachingSessionItem,
  CoachingSessionReportRevision,
} from "./coachingApi";
import {
  findPreviousReport,
  formatFileSize,
  prepareAttention,
  prepareFileRows,
  prepareHeadline,
  programSummary,
  taskDue,
} from "./coachingPrepare";

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 1,
    week_index: 1,
    status: "completed",
    scheduled_start: "2026-10-14T16:00:00Z",
    scheduled_local_date: "2026-10-14",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Ayşe Öğrenci",
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

function revision(overrides: Partial<CoachingSessionReportRevision> = {}): CoachingSessionReportRevision {
  return {
    id: "rev-1",
    revision_number: 1,
    source_draft_version: 1,
    content: { short_summary: "Özet", topics_discussed: "", student_progress: "", next_priorities: "", study_recommendations: "", focus_until_next_meeting: "Odak" },
    published_at: "2026-10-15T10:00:00Z",
    change_note: null,
    ...overrides,
  };
}

function report(sessionId: string, latest: CoachingSessionReportRevision | null): CoachingReportListItem {
  return { id: `r-${sessionId}`, session_id: sessionId, latest_revision: latest };
}

function task(overrides: Partial<CoachingProgramTask>): CoachingProgramTask {
  return {
    id: "t-1",
    title: "Görev",
    description: "",
    subject: "",
    due_date: null,
    priority: null,
    sort_order: 1,
    is_completed: false,
    completed_at: null,
    ...overrides,
  };
}

function program(tasks: CoachingProgramTask[]): CoachingProgram {
  return { id: "pg-1", service_period_id: "sp-1", title: "Program", objective: "", start_date: null, end_date: null, tasks };
}

function file(overrides: Partial<CoachingAttachmentItem>): CoachingAttachmentItem {
  return {
    id: "f-1",
    session_id: "s-1",
    original_name: "Dosya.pdf",
    mime_type: "application/pdf",
    size_bytes: 2_500_000,
    uploaded_by_role: "tutor",
    created_at: "2026-10-14T09:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-10-22T09:00:00Z");
const TODAY = "2026-10-22";

describe("prepareHeadline", () => {
  it("names the meeting by its number, its length and its time", () => {
    assert.equal(
      prepareHeadline(session({ sequence_number: 2, scheduled_start: "2026-10-22T18:00:00Z", duration_minutes: 30 })),
      "2. görüşme · 30 dk · 22 Ekim Perşembe 21:00",
    );
  });
});

describe("findPreviousReport", () => {
  const current = session({ id: "now", sequence_number: 3, scheduled_start: "2026-10-22T18:00:00Z", status: "scheduled" });

  it("finds the report of the meeting just before, in the same period", () => {
    const sessions = [
      session({ id: "a", scheduled_start: "2026-10-08T16:00:00Z" }),
      session({ id: "b", scheduled_start: "2026-10-15T16:00:00Z" }),
      current,
    ];
    const rev = revision({ revision_number: 2 });
    const result = findPreviousReport({ session: current, sessions, reports: [report("a", revision()), report("b", rev)] });

    assert.deepEqual(result, { kind: "report", sessionId: "b", scheduledStart: "2026-10-15T16:00:00Z", revision: rev });
  });

  it("goes further back when the latest earlier meeting has no published report", () => {
    const sessions = [
      session({ id: "a", scheduled_start: "2026-10-08T16:00:00Z" }),
      session({ id: "b", scheduled_start: "2026-10-15T16:00:00Z", status: "awaiting_report" }),
      current,
    ];
    const rev = revision();
    const result = findPreviousReport({ session: current, sessions, reports: [report("a", rev), report("b", null)] });

    assert.equal(result.kind, "report");
    assert.equal(result.kind === "report" ? result.sessionId : null, "a");
  });

  it("says a report is still owed when the earlier meetings have none yet", () => {
    const sessions = [session({ id: "b", scheduled_start: "2026-10-15T16:00:00Z", status: "awaiting_report" }), current];

    assert.deepEqual(findPreviousReport({ session: current, sessions, reports: [] }), {
      kind: "awaiting",
      sessionId: "b",
      scheduledStart: "2026-10-15T16:00:00Z",
    });
  });

  it("knows this is the first meeting when nothing came before", () => {
    assert.deepEqual(findPreviousReport({ session: current, sessions: [current], reports: [] }), {
      kind: "none",
      firstSession: true,
    });
  });

  it("never reaches into another coaching period, a later meeting, or a meeting with no report to write", () => {
    const sessions = [
      session({ id: "other", service_period_id: "sp-2", scheduled_start: "2026-10-15T16:00:00Z" }),
      session({ id: "later", scheduled_start: "2026-10-29T16:00:00Z" }),
      session({ id: "gone", scheduled_start: "2026-10-16T16:00:00Z", status: "cancelled" }),
      session({ id: "noshow", scheduled_start: "2026-10-17T16:00:00Z", status: "student_no_show" }),
      current,
    ];
    const reports = [report("other", revision()), report("later", revision()), report("gone", revision())];

    assert.deepEqual(findPreviousReport({ session: current, sessions, reports }), { kind: "none", firstSession: true });
  });

  it("is not the first meeting when earlier ones exist but none has a report", () => {
    const sessions = [session({ id: "a", scheduled_start: "2026-10-08T16:00:00Z" }), current];

    assert.deepEqual(findPreviousReport({ session: current, sessions, reports: [] }), { kind: "none", firstSession: false });
  });
});

describe("programSummary", () => {
  it("is null when the period has no program", () => {
    assert.equal(programSummary(null), null);
  });

  it("counts what is done and lists what waits, soonest date first, undated last", () => {
    const summary = programSummary(
      program([
        task({ id: "a", title: "A", is_completed: true, sort_order: 1 }),
        task({ id: "b", title: "B", due_date: "2026-10-25", sort_order: 2 }),
        task({ id: "c", title: "C", due_date: null, sort_order: 3 }),
        task({ id: "d", title: "D", due_date: "2026-10-22", sort_order: 4 }),
      ]),
    );

    assert.equal(summary?.total, 4);
    assert.equal(summary?.done, 1);
    assert.deepEqual(summary?.pending.map((item) => item.id), ["d", "b", "c"]);
  });
});

describe("taskDue", () => {
  it("says Bugün for today and marks it urgent", () => {
    assert.deepEqual(taskDue("2026-10-22", TODAY), { value: "Bugün", urgent: true });
  });

  it("says how late a missed day is", () => {
    assert.deepEqual(taskDue("2026-10-20", TODAY), { value: "Gecikti · 20 Eki", urgent: true });
  });

  it("gives a day ahead as weekday, day and month", () => {
    assert.deepEqual(taskDue("2026-10-23", TODAY), { value: "Cum 23 Eki", urgent: false });
  });

  it("says Tarihsiz for a task with no date", () => {
    assert.deepEqual(taskDue(null, TODAY), { value: "Tarihsiz", urgent: false });
  });
});

describe("formatFileSize", () => {
  it("writes bytes, kilobytes and megabytes the way Turkish does", () => {
    assert.equal(formatFileSize(512), "512 B");
    assert.equal(formatFileSize(640 * 1024), "640 KB");
    assert.equal(formatFileSize(2_516_582), "2,4 MB");
  });
});

describe("prepareFileRows", () => {
  it("says who put each file there, when, and how big it is", () => {
    const rows = prepareFileRows({
      items: [
        file({ id: "1", original_name: "Soru_seti.pdf", uploaded_by_role: "tutor", created_at: "2026-10-14T09:00:00Z", size_bytes: 2_516_582 }),
        file({ id: "2", original_name: "Cevaplar.jpg", uploaded_by_role: "student", created_at: "2026-10-19T09:00:00Z", size_bytes: 655_360 }),
      ],
      viewerRole: "tutor",
      otherName: "Ayşe Öğrenci",
    });

    assert.deepEqual(rows, [
      { id: "1", name: "Soru_seti.pdf", who: "Sen yükledin", when: "14 Ekim", size: "2,4 MB" },
      { id: "2", name: "Cevaplar.jpg", who: "Ayşe yükledi", when: "19 Ekim", size: "640 KB" },
    ]);
  });

  it("names the other side by role when their name is not known", () => {
    const tutorView = prepareFileRows({ items: [file({ uploaded_by_role: "student" })], viewerRole: "tutor" });
    const studentView = prepareFileRows({ items: [file({ uploaded_by_role: "tutor" })], viewerRole: "student" });

    assert.equal(tutorView[0].who, "Öğrenci yükledi");
    assert.equal(studentView[0].who, "Hoca yükledi");
  });

  it("never says Sen when it does not know who is looking", () => {
    const rows = prepareFileRows({
      items: [file({ id: "1", uploaded_by_role: "tutor" }), file({ id: "2", uploaded_by_role: "student" })],
    });

    assert.deepEqual(rows.map((row) => row.who), ["Hoca yükledi", "Öğrenci yükledi"]);
  });
});

describe("prepareAttention", () => {
  const base = {
    studentName: "Ayşe Öğrenci",
    feedback: null,
    program: program([]),
    attachments: [] as CoachingAttachmentItem[],
    previousStart: "2026-10-15T16:00:00Z",
    today: TODAY,
    messagesHref: "/messages/c-1",
    programHref: "/dashboard/tutor/coaching/service-periods/sp-1/program",
  };

  it("has nothing to say when nothing changed", () => {
    assert.deepEqual(prepareAttention({ ...base, program: program([task({ is_completed: true })]) }), []);
    assert.deepEqual(prepareAttention({ ...base, feedback: "goals_understood" }), []);
  });

  it("flags a student who wants to change the goal, with a way to the thread", () => {
    const items = prepareAttention({ ...base, feedback: "want_to_change_goal" });

    assert.deepEqual(items, [
      {
        id: "feedback",
        title: "Ayşe hedefi değiştirmek istiyor",
        detail: "Geçen rapordaki odağa geri bildirimi",
        action: { label: "Mesajlara git", href: "/messages/c-1" },
      },
    ]);
  });

  it("flags a student who wants to leave a note, and gives no link that opens nothing", () => {
    const [item] = prepareAttention({ ...base, feedback: "want_to_leave_note", messagesHref: null });

    assert.equal(item.title, "Ayşe sana not bırakmak istiyor");
    assert.equal(item.action, null);
  });

  it("counts waiting program tasks and names the one due today", () => {
    const items = prepareAttention({
      ...base,
      program: program([
        task({ id: "a", title: "Paragraf süreli set", due_date: "2026-10-22" }),
        task({ id: "b", title: "Türev seti", due_date: "2026-10-30" }),
      ]),
    });

    assert.deepEqual(items, [
      {
        id: "program",
        title: "2 program görevi bekliyor",
        detail: "Biri bugün bitmeli: Paragraf süreli set",
        action: { label: "Programı yönet", href: base.programHref },
      },
    ]);
  });

  it("names a task whose day has passed before one that is due today", () => {
    const [item] = prepareAttention({
      ...base,
      program: program([
        task({ id: "a", title: "Bugünkü", due_date: "2026-10-22" }),
        task({ id: "b", title: "Geçen", due_date: "2026-10-18" }),
      ]),
    });

    assert.equal(item.detail, "Süresi geçen: Geçen");
  });

  it("says there is no program, with a way to make one", () => {
    const [item] = prepareAttention({ ...base, program: null });

    assert.deepEqual(item, {
      id: "program",
      title: "Bu dönem için program yok",
      detail: null,
      action: { label: "Programı hazırla", href: base.programHref },
    });
  });

  it("does not claim there is no program when it simply is not known", () => {
    assert.deepEqual(prepareAttention({ ...base, program: undefined }), []);
  });

  it("lists files the student put there since the last meeting, not the tutor's and not older ones", () => {
    const items = prepareAttention({
      ...base,
      attachments: [
        file({ id: "1", original_name: "Yeni.jpg", uploaded_by_role: "student", created_at: "2026-10-19T09:00:00Z" }),
        file({ id: "2", original_name: "Eski.jpg", uploaded_by_role: "student", created_at: "2026-10-10T09:00:00Z" }),
        file({ id: "3", original_name: "Benim.pdf", uploaded_by_role: "tutor", created_at: "2026-10-19T09:00:00Z" }),
      ],
    });

    assert.deepEqual(items, [
      { id: "files", title: "Ayşe yeni dosya yükledi", detail: "Yeni.jpg", action: { label: "Dosyalara bak", kind: "files" } },
    ]);
  });

  it("counts several new files and names the first two", () => {
    const [item] = prepareAttention({
      ...base,
      previousStart: null,
      attachments: ["A", "B", "C"].map((name, index) =>
        file({ id: name, original_name: `${name}.jpg`, uploaded_by_role: "student", created_at: `2026-10-1${index}T09:00:00Z` }),
      ),
    });

    assert.equal(item.title, "Ayşe 3 yeni dosya yükledi");
    assert.equal(item.detail, "A.jpg, B.jpg ve 1 dosya daha");
  });

  it("keeps the three kinds in a fixed order", () => {
    const items = prepareAttention({
      ...base,
      feedback: "want_to_change_goal",
      program: program([task({ due_date: null })]),
      attachments: [file({ uploaded_by_role: "student", created_at: "2026-10-19T09:00:00Z" })],
    });

    assert.deepEqual(items.map((item) => item.id), ["feedback", "program", "files"]);
  });
});

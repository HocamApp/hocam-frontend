import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingReportListItem, CoachingSessionItem } from "./coachingApi";
import { buildStudentReportCards, studentReportHeading } from "./coachingStudentReports";

function content(overrides: Record<string, string> = {}) {
  return {
    short_summary: "Türev konusunda hız artırıldı.",
    topics_discussed: "",
    student_progress: "",
    next_priorities: "",
    study_recommendations: "",
    focus_until_next_meeting: "Günde 20 türev sorusu.",
    ...overrides,
  };
}

function report(
  id: string,
  sessionId: string,
  publishedAt: string,
  extra: Partial<CoachingReportListItem> & { revision?: number; content?: ReturnType<typeof content> } = {},
): CoachingReportListItem {
  const { revision = 1, content: body = content(), ...rest } = extra;
  return {
    id,
    session_id: sessionId,
    latest_revision: {
      id: `rev-${id}`,
      revision_number: revision,
      source_draft_version: 1,
      content: body,
      published_at: publishedAt,
      change_note: null,
    },
    ...rest,
  };
}

function session(id: string, start: string, localDate: string, status = "completed"): CoachingSessionItem {
  return {
    id,
    service_period_id: "p-1",
    sequence_number: 1,
    week_index: 1,
    status,
    scheduled_start: start,
    scheduled_local_date: localDate,
    scheduled_local_time: "18:30",
    duration_minutes: 30,
    reschedule_count: 0,
    report_due_at: null,
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
  } as CoachingSessionItem;
}

const sessions = [
  session("s1", "2026-10-05T15:30:00Z", "2026-10-05"),
  session("sx", "2026-10-06T15:30:00Z", "2026-10-06", "cancelled"),
  session("s2", "2026-10-08T15:30:00Z", "2026-10-08"),
  session("s3", "2026-10-12T15:30:00Z", "2026-10-12"),
  session("s4", "2026-10-15T15:30:00Z", "2026-10-15"),
];

const reports = [
  report("r2", "s2", "2026-10-09T07:00:00Z", { scheduled_start: "2026-10-08T15:30:00Z" }),
  report("r4", "s4", "2026-10-16T07:00:00Z", { scheduled_start: "2026-10-15T15:30:00Z" }),
  report("r1", "s1", "2026-10-06T07:00:00Z", { scheduled_start: "2026-10-05T15:30:00Z" }),
  report("r3", "s3", "2026-10-13T07:00:00Z", { scheduled_start: "2026-10-12T15:30:00Z", revision: 2 }),
];

describe("buildStudentReportCards", () => {
  const cards = buildStudentReportCards({ reports, sessions });

  it("goes newest meeting first, whatever order the server sent", () => {
    assert.deepEqual(cards.map((card) => card.id), ["r4", "r3", "r2", "r1"]);
  });

  it("names the meeting by its number across the plan, a cancelled meeting not counted, and its day", () => {
    assert.equal(cards[0].title, "4. görüşme");
    assert.equal(cards[0].dayLabel, "Per 15 Eki");
    assert.equal(cards[3].title, "1. görüşme");
    assert.equal(cards[2].title, "2. görüşme");
  });

  it("puts the focus first, and says when the report was published and which version it is", () => {
    assert.equal(cards[0].focus, "Günde 20 türev sorusu.");
    assert.equal(cards[0].published, "Yayınlandı Cum 16 Eki · Sürüm 1");
    assert.equal(cards[1].published, "Yayınlandı Sal 13 Eki · Sürüm 2, güncellendi");
  });

  it("opens the report", () => {
    assert.equal(cards[0].href, "/dashboard/student/coaching/reports/r4");
  });

  it("falls back to the summary when there is no focus, and to nothing when there is neither", () => {
    const bare = buildStudentReportCards({
      reports: [
        report("a", "s1", "2026-10-06T07:00:00Z", { content: content({ focus_until_next_meeting: "  " }) }),
        report("b", "s2", "2026-10-09T07:00:00Z", { content: content({ focus_until_next_meeting: "", short_summary: "" }) }),
      ],
      sessions,
    });
    const byId = Object.fromEntries(bare.map((card) => [card.id, card]));
    assert.equal(byId.a.focus, "Türev konusunda hız artırıldı.");
    assert.equal(byId.b.focus, null);
  });

  it("names the day when the meeting number is not known (a coaching that has ended), and says nothing it does not know", () => {
    const ended = buildStudentReportCards({ reports: [reports[1]], sessions: [] });
    assert.equal(ended[0].title, "15 Ekim Perşembe");
    assert.equal(ended[0].dayLabel, null);

    const oldServer = buildStudentReportCards({
      reports: [report("old", "s3", "2026-10-13T07:00:00Z")],
      sessions: [],
    });
    assert.equal(oldServer[0].title, "Görüşme raporu");
    assert.equal(oldServer[0].dayLabel, null);
  });

  it("falls back to the publishing day for the order when a server does not send the meeting", () => {
    const old = buildStudentReportCards({
      reports: [
        report("x", "s1", "2026-10-06T07:00:00Z"),
        report("y", "s2", "2026-10-09T07:00:00Z"),
      ],
      sessions: [],
    });
    assert.deepEqual(old.map((card) => card.id), ["y", "x"]);
  });

  it("leaves out a report with no published revision", () => {
    const only = buildStudentReportCards({
      reports: [{ id: "d", session_id: "s1", latest_revision: null }],
      sessions,
    });
    assert.deepEqual(only, []);
  });
});

describe("studentReportHeading", () => {
  it("heads the report with its meeting number and day", () => {
    const heading = studentReportHeading({
      sessionId: "s3",
      scheduledStart: "2026-10-12T15:30:00Z",
      publishedAt: "2026-10-13T07:00:00Z",
      revisionNumber: 2,
      changeNote: "Kaynak listesi eklendi.",
      sessions,
    });
    assert.equal(heading.title, "3. görüşme raporu");
    assert.equal(heading.meeting, "12 Ekim Pazartesi 18:30 görüşmesi");
    assert.equal(heading.published, "Yayınlandı 13 Ekim Salı 10:00 · Sürüm 2");
    assert.equal(heading.changeNote, "Kaynak listesi eklendi.");
  });

  it("names the day in the title when the number is unknown, and has no meeting line without a start", () => {
    const ended = studentReportHeading({
      sessionId: "s3",
      scheduledStart: "2026-10-12T15:30:00Z",
      publishedAt: "2026-10-13T07:00:00Z",
      revisionNumber: 1,
      changeNote: null,
      sessions: [],
    });
    assert.equal(ended.title, "12 Ekim Pazartesi görüşmesinin raporu");

    const old = studentReportHeading({
      sessionId: undefined,
      scheduledStart: undefined,
      publishedAt: "2026-10-13T07:00:00Z",
      revisionNumber: 1,
      changeNote: "",
      sessions: [],
    });
    assert.equal(old.title, "Görüşme raporu");
    assert.equal(old.meeting, null);
    assert.equal(old.changeNote, null);
  });
});

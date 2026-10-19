import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CoachingReportListItem, CoachingSessionItem } from "./coachingApi";
import { buildCoachingRecords, buildRecordsMonth } from "./coachingRecords";

// Monday 19 October 2026, 12:30 in Istanbul (UTC+3). Tests never read the clock.
const NOW = new Date("2026-10-19T09:30:00Z");

function session(overrides: Partial<CoachingSessionItem>): CoachingSessionItem {
  return {
    id: "s-1",
    service_period_id: "sp-1",
    sequence_number: 5,
    week_index: 1,
    status: "awaiting_report",
    scheduled_start: "2026-10-18T16:00:00Z",
    scheduled_local_date: "2026-10-18",
    scheduled_local_time: "19:00",
    duration_minutes: 30,
    reschedule_count: 0,
    student_name: "Zeynep K.",
    report_due_at: "2026-10-20T15:00:00Z",
    report_overdue: false,
    complaint_eligible_at: null,
    complaint_eligible: false,
    ...overrides,
  };
}

function report(overrides: Partial<CoachingReportListItem>): CoachingReportListItem {
  return {
    id: "r-1",
    session_id: "s-draft",
    draft_version: 2,
    latest_revision: null,
    student_name: "Mert A.",
    scheduled_start: "2026-10-14T15:30:00Z",
    ...overrides,
  } as CoachingReportListItem;
}

const published = report({
  id: "r-pub",
  session_id: "s-pub",
  student_name: "Zeynep K.",
  scheduled_start: "2026-10-11T16:00:00Z",
  draft_version: 1,
  latest_revision: {
    id: "rev-1",
    revision_number: 2,
    source_draft_version: 1,
    published_at: "2026-10-12T08:00:00Z",
  } as CoachingReportListItem["latest_revision"],
});

const records = buildCoachingRecords({
  sessions: [session({}), session({ id: "s-fine", status: "scheduled" })],
  reports: [report({}), published],
  now: NOW,
});

describe("buildCoachingRecords: owed", () => {
  it("lists a finished meeting nobody has written up, with the way to write it and its deadline", () => {
    assert.equal(records.owed.length, 1);
    const item = records.owed[0];
    assert.equal(item.kind, "owed");
    assert.equal(item.studentName, "Zeynep K.");
    assert.equal(item.dateKey, "2026-10-18");
    assert.equal(item.dateLabel, "18 Ekim Pazar");
    assert.equal(item.detail, "18 Ekim Pazar görüşmesi");
    assert.deepEqual(item.due, { value: "Yarın 18:00", urgent: false });
    assert.deepEqual(item.action, { label: "Raporu yaz", href: "/dashboard/tutor/coaching/sessions/s-1/report" });
  });

  it("does not count a meeting that has not happened", () => {
    assert.equal(records.items.some((item) => item.id === "session-s-fine"), false);
  });

  it("calls an overdue one overdue", () => {
    const late = buildCoachingRecords({
      sessions: [session({ report_overdue: true, report_due_at: "2026-10-19T08:00:00Z" })],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(late.owed[0].due, { value: "Süresi geçti", urgent: true });
  });

  it("puts the soonest deadline first", () => {
    const two = buildCoachingRecords({
      sessions: [
        session({ id: "later", report_due_at: "2026-10-21T15:00:00Z", student_name: "Elif Y." }),
        session({ id: "sooner", report_due_at: "2026-10-19T11:00:00Z" }),
      ],
      reports: [],
      now: NOW,
    });
    assert.deepEqual(two.owed.map((item) => item.id), ["session-sooner", "session-later"]);
  });
});

describe("buildCoachingRecords: drafts and published", () => {
  it("shows a draft with its version and a way to carry on", () => {
    const draft = records.items.find((item) => item.id === "report-r-1");
    assert.equal(draft?.kind, "draft");
    assert.equal(draft?.studentName, "Mert A.");
    assert.equal(draft?.dateKey, "2026-10-14");
    assert.equal(draft?.detail, "Taslak 2 · henüz yayınlanmadı");
    assert.deepEqual(draft?.action, { label: "Devam et", href: "/dashboard/tutor/coaching/sessions/s-draft/report" });
    assert.equal(draft?.due, null);
  });

  it("shows a published report with its revision and publish date", () => {
    const pub = records.items.find((item) => item.id === "report-r-pub");
    assert.equal(pub?.kind, "published");
    assert.equal(pub?.detail, "Yayında · 12 Ekim · revizyon 2");
    assert.equal(pub?.action.label, "Görüntüle");
  });

  it("carries the deadline on a draft whose meeting is still waiting for its report", () => {
    const withDraft = buildCoachingRecords({
      sessions: [session({ id: "s-draft", student_name: "Mert A." })],
      reports: [report({ scheduled_start: undefined, student_name: undefined })],
      now: NOW,
    });
    // The draft covers the awaiting meeting, so it is not also listed as owed.
    assert.equal(withDraft.owed.length, 0);
    const draft = withDraft.items[0];
    assert.equal(draft.kind, "draft");
    assert.deepEqual(draft.due, { value: "Yarın 18:00", urgent: false });
    assert.equal(draft.studentName, "Mert A.");
    assert.equal(draft.dateKey, "2026-10-18");
  });

  it("falls back to the meeting list for a name and date the report list does not carry", () => {
    const bare = buildCoachingRecords({
      sessions: [session({ id: "s-draft", status: "awaiting_report" })],
      reports: [report({ student_name: undefined, scheduled_start: undefined })],
      now: NOW,
    });
    assert.equal(bare.items[0].studentName, "Zeynep K.");
  });

  it("sets aside a report it cannot date, rather than dropping it", () => {
    const lost = buildCoachingRecords({
      sessions: [],
      reports: [report({ scheduled_start: undefined, student_name: undefined })],
      now: NOW,
    });
    assert.equal(lost.undated.length, 1);
    assert.equal(lost.undated[0].studentName, null);
    assert.equal(lost.undated[0].detail, "Taslak 2 · henüz yayınlanmadı");
  });

  it("groups everything dated by day", () => {
    assert.deepEqual(Object.keys(records.byDay).sort(), ["2026-10-11", "2026-10-14", "2026-10-18"]);
    assert.equal(records.byDay["2026-10-18"][0].kind, "owed");
  });
});

describe("buildRecordsMonth", () => {
  const month = buildRecordsMonth({ year: 2026, month: 10, items: records.items, today: "2026-10-19" });

  it("titles the month in Turkish", () => {
    assert.equal(month.title, "Ekim 2026");
  });

  it("starts the grid on the right weekday: 1 October 2026 is a Thursday, so three blanks first", () => {
    assert.deepEqual(month.cells.slice(0, 3), [null, null, null]);
    assert.equal(month.cells[3]?.day, 1);
  });

  it("fills out the last week with blanks, and has every day once", () => {
    assert.equal(month.cells.length % 7, 0);
    assert.equal(month.cells.filter(Boolean).length, 31);
  });

  it("marks today and counts what is on each day by state", () => {
    const today = month.cells.find((cell) => cell?.dateKey === "2026-10-19");
    assert.equal(today?.isToday, true);
    const eighteenth = month.cells.find((cell) => cell?.dateKey === "2026-10-18");
    assert.deepEqual(eighteenth?.counts, { owed: 1, draft: 0, published: 0 });
    const eleventh = month.cells.find((cell) => cell?.dateKey === "2026-10-11");
    assert.deepEqual(eleventh?.counts, { owed: 0, draft: 0, published: 1 });
  });

  it("knows the neighbouring months, across a year end", () => {
    assert.deepEqual([month.prev, month.next], [{ year: 2026, month: 9 }, { year: 2026, month: 11 }]);
    const december = buildRecordsMonth({ year: 2026, month: 12, items: [], today: "2026-10-19" });
    assert.deepEqual(december.next, { year: 2027, month: 1 });
    const january = buildRecordsMonth({ year: 2026, month: 1, items: [], today: "2026-10-19" });
    assert.deepEqual(january.prev, { year: 2025, month: 12 });
  });
});

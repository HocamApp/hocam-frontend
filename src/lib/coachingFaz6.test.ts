import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COACHING_FAZ6_QUERY_KEYS,
  COACHING_SESSION_QUERY_KEYS,
  getReportPublishInvalidationKeys,
  getPrimaryReportTiming,
  normalizeScoreOrNet,
} from "./coachingApi";

describe("Faz 6 coaching query keys", () => {
  it("keeps tutor draft and student published report caches separate", () => {
    assert.notDeepEqual(
      COACHING_FAZ6_QUERY_KEYS.reportDraft("session-1"),
      COACHING_FAZ6_QUERY_KEYS.publishedReport("report-1")
    );
    assert.deepEqual(COACHING_FAZ6_QUERY_KEYS.program("period-1"), [
      "coaching-program",
      "period-1",
    ]);
  });
});

describe("Faz 6 publish and incident cache contracts", () => {
  it("invalidates initial-publish data by report id, never the revision id", () => {
    const keys = getReportPublishInvalidationKeys({
      sessionId: "session-1",
      reportId: "report-1",
      initial: true,
    });
    assert.deepEqual(keys.reportHistory, ["coaching-tutor-report-history", "report-1"]);
    assert.deepEqual(keys.publishedReport, ["coaching-published-report", "report-1"]);
    assert.deepEqual(keys.sessionToken, ["coaching-session-token", "session-1"]);
  });

  it("uses the active room's token and both session lists for terminal incident refresh", () => {
    assert.deepEqual(COACHING_SESSION_QUERY_KEYS.detail("session-1"), [
      "coaching-session-detail",
      "session-1",
    ]);
    assert.deepEqual(COACHING_SESSION_QUERY_KEYS.token("session-1"), [
      "coaching-session-token",
      "session-1",
    ]);
    assert.deepEqual(COACHING_SESSION_QUERY_KEYS.studentList(), ["coaching-sessions"]);
    assert.deepEqual(COACHING_SESSION_QUERY_KEYS.tutorList(), ["coaching-tutor-sessions"]);
  });
});

describe("normalizeScoreOrNet", () => {
  it("returns a finite numeric score or null for an omitted/invalid value", () => {
    assert.equal(normalizeScoreOrNet("32.5"), 32.5);
    assert.equal(normalizeScoreOrNet(""), null);
    assert.equal(normalizeScoreOrNet("not-a-score"), null);
    assert.equal(normalizeScoreOrNet("Infinity"), null);
  });
});

describe("getPrimaryReportTiming", () => {
  it("uses normal-session timing supplied by the server without recalculating it", () => {
    assert.deepEqual(
      getPrimaryReportTiming({
        report_due_at: "2026-08-10T12:00:00Z",
        report_overdue: true,
        complaint_eligible_at: "2026-08-11T12:00:00Z",
        complaint_eligible: false,
      }),
      {
        reportDueAt: "2026-08-10T12:00:00Z",
        reportOverdue: true,
        complaintEligibleAt: "2026-08-11T12:00:00Z",
        complaintEligible: false,
      }
    );
  });

  it("does not create a missing-primary-report policy for incident sessions", () => {
    assert.deepEqual(
      getPrimaryReportTiming({
        report_due_at: null,
        report_overdue: false,
        complaint_eligible_at: null,
        complaint_eligible: false,
      }),
      {
        reportDueAt: null,
        reportOverdue: false,
        complaintEligibleAt: null,
        complaintEligible: false,
      }
    );
  });
});

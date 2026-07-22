import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCountdown,
  computeServerOffsetMs,
  earlyEndFromSessionState,
  formatDuration,
  isEarlyEndVersionStale,
  LOW_TIME_WARNING_MS,
  serverNowMs,
  teacherVideoStorageKey,
  videoQualityStorageKey,
} from "./lessonSessionState";

const START = "2026-07-09T12:00:00Z";
const END = "2026-07-09T12:40:00Z"; // 40-minute lesson

describe("session storage keys are booking-scoped", () => {
  it("isolates preferences per booking", () => {
    assert.equal(videoQualityStorageKey("abc"), "lesson-video-quality:abc");
    assert.equal(teacherVideoStorageKey("abc"), "lesson-teacher-video:abc");
    assert.notEqual(videoQualityStorageKey("a"), videoQualityStorageKey("b"));
  });
});

describe("computeCountdown", () => {
  it("splits elapsed/remaining mid-lesson", () => {
    const at = new Date("2026-07-09T12:15:00Z").getTime();
    const parts = computeCountdown(START, END, at);
    assert.equal(parts.elapsedMs, 15 * 60_000);
    assert.equal(parts.remainingMs, 25 * 60_000);
    assert.equal(parts.totalMs, 40 * 60_000);
    assert.equal(parts.isOvertime, false);
  });

  it("keeps elapsed at 0 before the lesson starts (early join)", () => {
    const at = new Date("2026-07-09T11:50:00Z").getTime();
    const parts = computeCountdown(START, END, at);
    assert.equal(parts.elapsedMs, 0);
    assert.equal(parts.remainingMs, 40 * 60_000);
  });

  it("never goes negative past scheduled end", () => {
    const at = new Date("2026-07-09T13:00:00Z").getTime();
    const parts = computeCountdown(START, END, at);
    assert.equal(parts.remainingMs, 0);
    assert.equal(parts.elapsedMs, 40 * 60_000);
    assert.equal(parts.isOvertime, true);
  });

  it("flags the last 5 minutes as low time", () => {
    const at = new Date("2026-07-09T12:36:00Z").getTime(); // 4 min left
    const parts = computeCountdown(START, END, at);
    assert.ok(parts.remainingMs <= LOW_TIME_WARNING_MS);
    assert.equal(parts.isLowTime, true);
  });

  it("handles 60+ minute lessons", () => {
    const longEnd = "2026-07-09T13:12:00Z"; // 72 minutes
    const at = new Date("2026-07-09T12:00:00Z").getTime();
    const parts = computeCountdown(START, longEnd, at);
    assert.equal(parts.remainingMs, 72 * 60_000);
    assert.equal(formatDuration(parts.remainingMs), "72:00");
  });
});

describe("formatDuration", () => {
  it("formats minutes:seconds with zero-padding", () => {
    assert.equal(formatDuration(23 * 60_000 + 16_000), "23:16");
    assert.equal(formatDuration(16 * 60_000 + 44_000), "16:44");
    assert.equal(formatDuration(9_000), "0:09");
  });

  it("clamps negatives to zero", () => {
    assert.equal(formatDuration(-5000), "0:00");
  });
});

describe("server clock offset", () => {
  it("uses the request midpoint to estimate drift", () => {
    // Server says 12:00:10; local request spanned 12:00:00→12:00:02 (mid 12:00:01)
    const offset = computeServerOffsetMs(
      "2026-07-09T12:00:10Z",
      new Date("2026-07-09T12:00:00Z").getTime(),
      new Date("2026-07-09T12:00:02Z").getTime()
    );
    assert.equal(offset, 9_000);
    assert.equal(
      serverNowMs(offset, new Date("2026-07-09T12:00:05Z").getTime()),
      new Date("2026-07-09T12:00:14Z").getTime()
    );
  });

  it("falls back to no offset on an invalid server time", () => {
    assert.equal(computeServerOffsetMs("not-a-date", 0, 10), 0);
  });
});

describe("early-end version reconciliation", () => {
  const serverState = {
    status: "pending" as const,
    version: 3,
    requested_at: START,
    resolved_at: null,
    retry_available_at: null,
  };

  it("detects a stale local version", () => {
    assert.equal(isEarlyEndVersionStale(2, serverState), true);
    assert.equal(isEarlyEndVersionStale(3, serverState), false);
  });

  it("reads the authoritative early-end state from session-state", () => {
    const state = {
      booking_id: "b1",
      status: "in_progress" as const,
      start_time: START,
      scheduled_end: END,
      server_time: START,
      early_end_request: serverState,
    };
    assert.deepEqual(earlyEndFromSessionState(state), serverState);
  });
});

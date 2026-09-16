import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCountdown,
  countdownBounds,
  computeServerOffsetMs,
  earlyEndFromSessionState,
  formatDuration,
  formatJoinCountdown,
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
      start_instant: START,
      end_instant: END,
      server_time: START,
      early_end_request: serverState,
    };
    assert.deepEqual(earlyEndFromSessionState(state), serverState);
  });
});

describe("formatJoinCountdown", () => {
  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;

  it("reports the room as open once the join time has passed", () => {
    assert.deepEqual(formatJoinCountdown(-5 * MINUTE), { mode: "open" });
    assert.deepEqual(formatJoinCountdown(0), { mode: "open" });
  });

  it("keeps a live M:SS clock under an hour", () => {
    assert.deepEqual(formatJoinCountdown(45_000), { mode: "soon", label: "0:45" });
    assert.deepEqual(formatJoinCountdown(12 * MINUTE), { mode: "soon", label: "12:00" });
  });

  it("switches to hours and minutes later the same day", () => {
    assert.deepEqual(formatJoinCountdown(3 * HOUR + 5 * MINUTE), {
      mode: "today",
      label: "3 saat 5 dakika",
    });
  });

  it("drops a zero component instead of writing it out", () => {
    assert.deepEqual(formatJoinCountdown(2 * HOUR), { mode: "today", label: "2 saat" });
    assert.deepEqual(formatJoinCountdown(48 * HOUR), { mode: "later", label: "2 gün" });
  });

  // The bug this exists for: 15 hours out used to render as "904:43".
  it("never renders a far-off lesson as a minute count", () => {
    assert.deepEqual(formatJoinCountdown(15 * HOUR + 4 * MINUTE), {
      mode: "today",
      label: "15 saat 4 dakika",
    });
    assert.deepEqual(formatJoinCountdown(40 * HOUR), { mode: "later", label: "1 gün 16 saat" });
  });
});

describe("countdownBounds", () => {
  // A lesson at 15:00 Istanbul: the stored pair wears a UTC label three hours
  // ahead of the real moment. Reading the stored pair against server time is
  // what froze the timer at "Kalan 40:00" for the whole lesson.
  const STORED_START = "2026-07-09T15:00:00Z";
  const STORED_END = "2026-07-09T15:40:00Z";
  const REAL_START = "2026-07-09T12:00:00.000Z";
  const REAL_END = "2026-07-09T12:40:00.000Z";

  const state = {
    start_time: STORED_START,
    scheduled_end: STORED_END,
    start_instant: REAL_START,
    end_instant: REAL_END,
  };

  it("reads the instants, never the legacy stored pair", () => {
    assert.deepEqual(countdownBounds(state, null), {
      startIso: REAL_START,
      endIso: REAL_END,
    });
  });

  it("derives both bounds from the booking before session state arrives", () => {
    // Both sides instants: one of each is what briefly showed "Kalan 0:00".
    const bounds = countdownBounds(null, {
      start_time: STORED_START,
      duration_minutes: 40,
    });
    assert.deepEqual(bounds, { startIso: REAL_START, endIso: REAL_END });
  });

  it("has nothing to show without either source", () => {
    assert.equal(countdownBounds(null, null), null);
  });

  it("counts down in real time instead of freezing at the full duration", () => {
    const bounds = countdownBounds(state, null)!;
    const tenMinutesIn = new Date("2026-07-09T12:10:00Z").getTime();
    const parts = computeCountdown(bounds.startIso, bounds.endIso, tenMinutesIn);

    assert.equal(parts.elapsedMs, 10 * 60_000);
    assert.equal(parts.remainingMs, 30 * 60_000);

    // The same moment read through the legacy pair: the bug, pinned.
    const buggy = computeCountdown(STORED_START, STORED_END, tenMinutesIn);
    assert.equal(buggy.remainingMs, 40 * 60_000);
    assert.equal(buggy.elapsedMs, 0);
  });
});

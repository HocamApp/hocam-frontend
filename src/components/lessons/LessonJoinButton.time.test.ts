import assert from "node:assert/strict";
import { test } from "node:test";

import { canJoinLesson } from "./LessonJoinButton";
import * as countdown from "@/hooks/useCountdown";
import { resetServerClock, syncServerClock } from "@/lib/serverClock";

const BOOKING = "2026-09-09T18:00:00Z";
const TRUE_JOIN_OPEN = Date.parse("2026-09-09T14:45:00Z");

test("the shared join button opens from the booking's real instant", () => {
  assert.equal(canJoinLesson(BOOKING, 40, "confirmed", TRUE_JOIN_OPEN), true);
  assert.equal(canJoinLesson(BOOKING, 40, "confirmed", TRUE_JOIN_OPEN - 1), false);
});

test("the shared join button uses the synchronized server clock by default", () => {
  const realDateNow = Date.now;
  Date.now = () => TRUE_JOIN_OPEN - 10 * 60_000;
  try {
    syncServerClock(
      new Date(TRUE_JOIN_OPEN).toISOString(),
      Date.now(),
      Date.now()
    );
    assert.equal(canJoinLesson(BOOKING, 40, "confirmed"), true);
  } finally {
    Date.now = realDateNow;
    resetServerClock();
  }
});

test("countdown labels use the synchronized server clock", () => {
  const label = (
    countdown as typeof countdown & {
      countdownLabel?: (target: Date | null) => string | null;
    }
  ).countdownLabel;
  assert.equal(typeof label, "function");

  const trueNow = Date.parse("2026-09-09T14:46:00Z");
  const realDateNow = Date.now;
  Date.now = () => trueNow + 10 * 60_000;
  try {
    syncServerClock(new Date(trueNow).toISOString(), Date.now(), Date.now());
    assert.equal(label!(new Date("2026-09-09T15:00:00Z")), "14 dakika");
  } finally {
    Date.now = realDateNow;
    resetServerClock();
  }
});

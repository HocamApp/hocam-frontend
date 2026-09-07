/**
 * The frontend half of the time-model gate.
 *
 * `bookingTime.test.ts` pins what a booking *renders* as. This pins what the
 * app *decides* from it: has the lesson started, has it ended, is the join
 * window open, which calendar day is it on.
 *
 * Those were the second, worse half of the same bug. Fixing the labels made
 * the pending-reservations screen say 18:00 while every countdown, sort and
 * "can I join yet" check still read the stored `18:00Z` as an instant and ran
 * three hours behind the lesson it was describing.
 *
 * Every test passes `now` explicitly. Nothing here reads the machine clock,
 * nothing sleeps, and the assertions hold under any TZ.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EARLY_JOIN_GRACE_MINUTES,
  bookingDayKey,
  bookingEndInstant,
  bookingHasEnded,
  bookingHasStarted,
  bookingInstant,
  bookingJoinWindowOpen,
  byBookingInstant,
  istanbulDayKey,
  msUntilBooking,
  toBookingStartTime,
} from "./bookingTime";
import {
  isServerClockSynced,
  resetServerClock,
  serverClockSkewMs,
  serverNow,
  syncServerClock,
} from "./serverClock";

/** The PayTR review booking: 9 September 2026, 18:00 Istanbul. */
const PAYTR_BOOKING = "2026-09-09T18:00:00Z";
/** What it stores, read naively — three hours after the lesson really is. */
const NAIVE_MISREADING = Date.parse(PAYTR_BOOKING);
/** What it means. */
const TRUE_INSTANT = Date.parse("2026-09-09T15:00:00Z");
const DURATION = 40;

/** An instant, named by the Istanbul clock face on the lesson's day. */
function istanbul(clock: string): number {
  return Date.parse(`2026-09-09T${clock}+03:00`);
}

test("the reference booking's instant is 15:00Z, not the 18:00Z it stores", () => {
  assert.equal(bookingInstant(PAYTR_BOOKING), TRUE_INSTANT);
  assert.equal(NAIVE_MISREADING - TRUE_INSTANT, 3 * 60 * 60 * 1000);
});

test("the end instant follows the start, not the stored label", () => {
  assert.equal(
    bookingEndInstant(PAYTR_BOOKING, DURATION),
    istanbul("18:40:00")
  );
});

test("a lesson has not started one second before its real start", () => {
  assert.equal(bookingHasStarted(PAYTR_BOOKING, istanbul("17:59:59")), false);
  assert.equal(bookingHasStarted(PAYTR_BOOKING, istanbul("18:00:00")), true);
});

test("reading the stored value as an instant would start the lesson three hours late", () => {
  // The shape of the original bug, asserted so it cannot come back: at 18:00
  // Istanbul the lesson has begun, even though the naive reading says it has
  // not start until 21:00.
  const atStart = istanbul("18:00:00");
  assert.equal(bookingHasStarted(PAYTR_BOOKING, atStart), true);
  assert.equal(atStart >= NAIVE_MISREADING, false);
});

test("a lesson ends at its scheduled end, to the second", () => {
  assert.equal(
    bookingHasEnded(PAYTR_BOOKING, DURATION, istanbul("18:39:59")),
    false
  );
  assert.equal(
    bookingHasEnded(PAYTR_BOOKING, DURATION, istanbul("18:40:00")),
    true
  );
});

test("the join window opens exactly 15 minutes before the lesson", () => {
  assert.equal(EARLY_JOIN_GRACE_MINUTES, 15);
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("17:44:59")),
    false
  );
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("17:45:00")),
    true
  );
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("18:00:00")),
    true
  );
});

test("the join window closes at the scheduled end", () => {
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("18:39:59")),
    true
  );
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("18:40:00")),
    false
  );
});

test("21:00 Istanbul is past the lesson, not the moment it opens", () => {
  // Under the old reading this was when the button appeared.
  assert.equal(
    bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("20:45:00")),
    false
  );
});

test("the countdown counts down to the real start", () => {
  assert.equal(msUntilBooking(PAYTR_BOOKING, istanbul("17:46:00")), 14 * 60_000);
});

test("lists sort by when lessons really happen", () => {
  const later = { start_time: "2026-09-09T19:00:00Z" };
  const earlier = { start_time: "2026-09-09T18:00:00Z" };
  assert.deepEqual([later, earlier].sort(byBookingInstant), [earlier, later]);
});

test("unparseable timestamps decide nothing", () => {
  assert.equal(Number.isNaN(bookingInstant("not a date")), true);
  assert.equal(bookingHasStarted("not a date", TRUE_INSTANT), false);
  assert.equal(bookingJoinWindowOpen("not a date", DURATION, TRUE_INSTANT), false);
});

test("calendar grouping uses Istanbul's day, not the viewer's", () => {
  // 00:30 Istanbul on the 10th is still the 9th in UTC. Grouping on a
  // browser-local date puts this lesson on the wrong day for anyone west of
  // Turkey — and on the right one for the developer in Istanbul who tests it.
  const afterMidnight = "2026-09-10T00:30:00Z";
  assert.equal(bookingDayKey(afterMidnight), "2026-09-10");
  assert.equal(bookingDayKey(PAYTR_BOOKING), "2026-09-09");
  assert.equal(istanbulDayKey(TRUE_INSTANT), "2026-09-09");
});

/* -------------------------------------------------------------------------- *
 * Phase 12: browser clock skew.
 *
 * A student's machine can be wrong by minutes or hours, deliberately or not.
 * The countdown must correct itself toward the server; the *permission* must
 * not move at all, because the browser never grants it — the server re-checks
 * the window when it mints the room token.
 * -------------------------------------------------------------------------- */

/** Run `fn` with `Date.now()` pinned to `at`, as a browser clock would report. */
function withBrowserClock(at: number, fn: () => void) {
  const real = Date.now;
  Date.now = () => at;
  try {
    fn();
  } finally {
    Date.now = real;
    resetServerClock();
  }
}

const SKEWS: Array<[string, number]> = [
  ["correct", 0],
  ["+10 minutes", 10 * 60_000],
  ["-10 minutes", -10 * 60_000],
  ["+3 hours", 3 * 60 * 60_000],
];

test("a skewed browser clock is corrected back to the server's", () => {
  const trueNow = istanbul("17:46:00");
  for (const [label, skew] of SKEWS) {
    withBrowserClock(trueNow + skew, () => {
      assert.equal(isServerClockSynced(), false);
      // One session-state response, answered instantly.
      syncServerClock(new Date(trueNow).toISOString(), Date.now(), Date.now());
      assert.equal(isServerClockSynced(), true);
      // (written as a sum so a zero skew does not trip -0 !== 0)
      assert.equal(serverClockSkewMs() + skew, 0, `skew not cancelled: ${label}`);
      assert.equal(serverNow(), trueNow, `corrected now wrong: ${label}`);
      // And so the countdown is right whatever the machine believed.
      assert.equal(
        msUntilBooking(PAYTR_BOOKING, serverNow()),
        14 * 60_000,
        `countdown wrong: ${label}`
      );
    });
  }
});

test("round-trip latency is charged half to each direction", () => {
  const trueNow = istanbul("17:46:00");
  const real = Date.now;
  let clock = trueNow;
  Date.now = () => clock;
  try {
    const sentAt = Date.now();
    clock += 400; // 400ms round trip
    // The server answered at its own "now", which was mid-flight.
    syncServerClock(new Date(trueNow + 200).toISOString(), sentAt, Date.now());
    assert.equal(serverNow(), trueNow + 400);
  } finally {
    Date.now = real;
    resetServerClock();
  }
});

test("a wrong clock cannot pull the join window open early", () => {
  // The student sets their clock forward three hours at 17:00 Istanbul, when
  // the window is genuinely shut. Once the server has been heard from, the UI
  // agrees with the server — and even before that, the token request is what
  // actually decides, and it is the server's to refuse.
  const trueNow = istanbul("17:00:00");
  withBrowserClock(trueNow + 3 * 60 * 60_000, () => {
    syncServerClock(new Date(trueNow).toISOString(), Date.now(), Date.now());
    assert.equal(
      bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, serverNow()),
      false
    );
  });
});

test("a clock running slow does not lock a student out of a live lesson", () => {
  const trueNow = istanbul("18:05:00");
  withBrowserClock(trueNow - 30 * 60_000, () => {
    syncServerClock(new Date(trueNow).toISOString(), Date.now(), Date.now());
    assert.equal(
      bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, serverNow()),
      true
    );
  });
});

test("before any server response the local clock is used unchanged", () => {
  // A countdown that renders slightly wrong beats one that does not render.
  const at = istanbul("17:46:00");
  withBrowserClock(at, () => {
    assert.equal(serverNow(), at);
  });
});

test("a garbage server timestamp is ignored rather than adopted", () => {
  const at = istanbul("17:46:00");
  withBrowserClock(at, () => {
    syncServerClock("not a date", Date.now(), Date.now());
    assert.equal(isServerClockSynced(), false);
    assert.equal(serverNow(), at);
  });
});

test("every decision above is identical under any machine timezone", () => {
  const original = process.env.TZ;
  try {
    for (const tz of ["UTC", "Europe/Istanbul", "America/New_York", "Asia/Tokyo"]) {
      process.env.TZ = tz;
      assert.equal(bookingInstant(PAYTR_BOOKING), TRUE_INSTANT, `instant under ${tz}`);
      assert.equal(
        bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("17:44:59")),
        false,
        `window under ${tz}`
      );
      assert.equal(
        bookingJoinWindowOpen(PAYTR_BOOKING, DURATION, istanbul("17:45:00")),
        true,
        `window under ${tz}`
      );
      assert.equal(bookingDayKey(PAYTR_BOOKING), "2026-09-09", `day under ${tz}`);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

/* -------------------------------------------------------------------------- *
 * The write path. One convention, or the table holds two.
 * -------------------------------------------------------------------------- */

test("a booking is written as a naive Istanbul wall clock, never as an instant", () => {
  const picked = Date.parse("2026-09-09T18:00:00+03:00");
  assert.equal(toBookingStartTime(picked), "2026-09-09T18:00:00");
  // The shape the admin console used to send, which the backend read as
  // 15:00 Istanbul — three hours off every student-created lesson.
  assert.notEqual(toBookingStartTime(picked), new Date(picked).toISOString());
});

test("what is written round-trips back to the instant that was picked", () => {
  const picked = Date.parse("2026-09-09T18:00:00+03:00");
  assert.equal(bookingInstant(toBookingStartTime(picked)), picked);
});

test("an admin outside Turkey still books the Istanbul hour on screen", () => {
  const original = process.env.TZ;
  try {
    for (const tz of ["UTC", "America/New_York", "Asia/Tokyo", "Europe/Istanbul"]) {
      process.env.TZ = tz;
      assert.equal(
        toBookingStartTime(Date.parse("2026-09-09T18:00:00+03:00")),
        "2026-09-09T18:00:00",
        `wrong write under TZ=${tz}`
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

/**
 * The clock the UI counts down against.
 *
 * ## Why the browser's clock is not enough
 *
 * `Date.now()` is whatever the user's machine says it is. It can be minutes or
 * hours off, it can be deliberately changed, and it jumps when a laptop wakes
 * from sleep. A countdown driven straight off it drifts away from the lesson
 * it is counting down to.
 *
 * The backend already sends its own `now` on the session endpoints
 * (`server_time`). This module keeps the difference between that and the local
 * clock, and hands back a corrected "now" — so the countdown a student sees
 * matches the one the tutor sees, whatever either machine believes.
 *
 * ## What this is NOT
 *
 * It is not an authorization mechanism, and no amount of accuracy would make
 * it one. **The browser never decides whether a lesson may be joined.** The
 * server re-checks the join window when it mints a room token
 * (`BookingSessionTokenView`), and a client whose clock says otherwise simply
 * gets a 403. This module exists so the *label* is honest — "Derse 14 dakika
 * kaldı" — not so the button can be trusted.
 *
 * Nor is it NTP. One sample, corrected for half the round trip, is as much
 * precision as a minute-resolution countdown can use.
 *
 * ## Wall clock vs elapsed time
 *
 * `serverNow()` answers "what time is it" — a calendar question, and the right
 * one for "how long until 18:00". It is deliberately *not* built on
 * `performance.now()`: a monotonic source cannot be compared to a scheduled
 * instant, and it keeps counting across a suspend during which real time also
 * passed. Where monotonic time belongs is measuring an interval that started
 * in this same page session ("you have been in this lesson for 20 minutes"),
 * and nothing here does that.
 */

import { computeServerOffsetMs } from "./lessonSessionState";

/** Milliseconds to add to `Date.now()` to land on the server's clock. */
let skewMs = 0;
let synced = false;

/**
 * Record a server timestamp and the local times either side of the request.
 *
 * `sentAt` / `receivedAt` come from `Date.now()` around the fetch. The server
 * generated its timestamp somewhere inside that window; charging it half the
 * round trip is the standard estimate and is well inside the precision a
 * countdown needs.
 *
 * The arithmetic is `computeServerOffsetMs`, which the in-lesson controller
 * already used and which is unit-tested there. This module is the app-wide
 * store around it, so a dashboard countdown gets the same correction the
 * session page does instead of each screen keeping its own.
 */
export function syncServerClock(
  serverTime: string | number | Date,
  sentAt: number,
  receivedAt: number
): number {
  const iso =
    serverTime instanceof Date
      ? serverTime.toISOString()
      : typeof serverTime === "number"
        ? new Date(serverTime).toISOString()
        : serverTime;
  if (!Number.isFinite(Date.parse(iso))) return skewMs;

  skewMs = computeServerOffsetMs(iso, sentAt, receivedAt);
  synced = true;
  return skewMs;
}

/**
 * The current instant, corrected toward the server when we have heard from it.
 *
 * Falls back to the local clock before the first sync — a countdown that is
 * briefly a few seconds out is better than one that does not render.
 */
export function serverNow(): number {
  return Date.now() + skewMs;
}

/** Whether a server timestamp has been seen. For diagnostics and tests. */
export function isServerClockSynced(): boolean {
  return synced;
}

/** Current correction in ms. Positive means the local clock is behind. */
export function serverClockSkewMs(): number {
  return skewMs;
}

/** Drop the correction. Tests only. */
export function resetServerClock(): void {
  skewMs = 0;
  synced = false;
}

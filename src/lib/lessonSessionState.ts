/**
 * Pure helpers for the in-lesson session controller: the single server-synced
 * countdown, the clock-offset math that keeps it authoritative, and the
 * booking-scoped sessionStorage keys. No React, no I/O — unit-tested directly.
 */
import type { EarlyEndRequestState, LessonSessionState } from "@/types";

export const LOW_TIME_WARNING_MS = 5 * 60_000;

/** sessionStorage key for the per-booking video-quality preference. */
export function videoQualityStorageKey(bookingId: string): string {
  return `lesson-video-quality:${bookingId}`;
}

/** sessionStorage key for the per-booking "hide teacher video" preference. */
export function teacherVideoStorageKey(bookingId: string): string {
  return `lesson-teacher-video:${bookingId}`;
}

/**
 * Offset (ms) to add to the local clock to get server time, estimated from a
 * request's start/end wall-clock times (midpoint) against the server's reported
 * time. Positive when the local clock is behind the server.
 */
export function computeServerOffsetMs(
  serverTimeIso: string,
  requestStartMs: number,
  requestEndMs: number
): number {
  const serverMs = new Date(serverTimeIso).getTime();
  if (Number.isNaN(serverMs)) return 0;
  const localMidpoint = requestStartMs + (requestEndMs - requestStartMs) / 2;
  return serverMs - localMidpoint;
}

/** Current server time in ms, given a clock offset from computeServerOffsetMs. */
export function serverNowMs(offsetMs: number, localNowMs: number = Date.now()): number {
  return localNowMs + offsetMs;
}

export interface CountdownParts {
  elapsedMs: number;
  remainingMs: number;
  totalMs: number;
  isLowTime: boolean;
  isOvertime: boolean;
}

/**
 * Elapsed/remaining time for the lesson, both clamped to [0, total]. Early join
 * before start keeps elapsed at 0; past scheduled end keeps remaining at 0.
 */
export function computeCountdown(
  startTimeIso: string,
  scheduledEndIso: string,
  nowMs: number
): CountdownParts {
  const startMs = new Date(startTimeIso).getTime();
  const endMs = new Date(scheduledEndIso).getTime();
  const totalMs = Math.max(0, endMs - startMs);
  const elapsedMs = Math.min(Math.max(0, nowMs - startMs), totalMs);
  const remainingMs = Math.min(Math.max(0, endMs - nowMs), totalMs);
  return {
    elapsedMs,
    remainingMs,
    totalMs,
    isLowTime: remainingMs > 0 && remainingMs <= LOW_TIME_WARNING_MS,
    isOvertime: nowMs >= endMs,
  };
}

/** "M:SS" (minutes may exceed 59 for 60+ minute lessons). Never negative. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * How long until the room opens, in a shape the waiting room can render.
 *
 * computeCountdown above is about time *inside* a lesson and is clamped to the
 * lesson's own duration, so it cannot answer this. formatDuration is M:SS and
 * deliberately unbounded, which is right for a lesson clock and wrong for a
 * wait: a lesson fifteen hours out rendered as "904:43", a number no student
 * can read as a time.
 */
export type JoinCountdown =
  | { mode: "open" }
  /** Under an hour — a live M:SS clock still means something. */
  | { mode: "soon"; label: string }
  /** Later today — hours and minutes. */
  | { mode: "today"; label: string }
  /** Another day — days and hours, and the caller should show the date instead. */
  | { mode: "later"; label: string };

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatJoinCountdown(msUntilJoin: number): JoinCountdown {
  if (msUntilJoin <= 0) return { mode: "open" };
  if (msUntilJoin < HOUR_MS) return { mode: "soon", label: formatDuration(msUntilJoin) };

  // Turkish nouns do not inflect for number, so "2 gün 4 saat" needs no plural
  // handling; a zero component is dropped rather than written out.
  if (msUntilJoin < DAY_MS) {
    const hours = Math.floor(msUntilJoin / HOUR_MS);
    const minutes = Math.floor((msUntilJoin % HOUR_MS) / MINUTE_MS);
    return {
      mode: "today",
      label: minutes > 0 ? `${hours} saat ${minutes} dakika` : `${hours} saat`,
    };
  }

  const days = Math.floor(msUntilJoin / DAY_MS);
  const hours = Math.floor((msUntilJoin % DAY_MS) / HOUR_MS);
  return { mode: "later", label: hours > 0 ? `${days} gün ${hours} saat` : `${days} gün` };
}

/**
 * Whether a locally-known early-end request version is stale relative to the
 * authoritative server state (e.g. from a 409 body). When stale, the client
 * should adopt the server's early_end_request rather than its own optimistic view.
 */
export function isEarlyEndVersionStale(
  localVersion: number,
  server: EarlyEndRequestState
): boolean {
  return localVersion !== server.version;
}

/** Extract the authoritative early-end state from a session-state payload. */
export function earlyEndFromSessionState(
  state: LessonSessionState
): EarlyEndRequestState {
  return state.early_end_request;
}

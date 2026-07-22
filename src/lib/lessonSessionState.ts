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

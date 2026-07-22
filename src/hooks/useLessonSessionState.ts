"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  cancelEarlyEndRequest,
  fetchLessonSessionState,
  requestEarlyEnd,
  respondToEarlyEnd,
  type EarlyEndDecision,
} from "@/lib/lessonsApi";
import { computeServerOffsetMs, serverNowMs } from "@/lib/lessonSessionState";
import type {
  Booking,
  EarlyEndRequestState,
  LessonSessionState,
} from "@/types";

const SESSION_STATE_POLL_MS = 2_000;
const ENDED_STATUSES = new Set<Booking["status"]>([
  "awaiting_confirmation",
  "completed",
  "disputed",
  "cancelled",
  "expired",
]);

export interface UseLessonSessionStateArgs {
  bookingId: string;
  enabled: boolean;
}

export interface UseLessonSessionStateResult {
  state: LessonSessionState | undefined;
  earlyEnd: EarlyEndRequestState | undefined;
  serverOffsetMs: number;
  /** Current server time in ms, drift-corrected. */
  serverNow: () => number;
  isFetching: boolean;
  refetch: () => void;
  requestEnd: ReturnType<typeof useMutation<Booking, unknown, void>>;
  respond: ReturnType<typeof useMutation<Booking, unknown, EarlyEndDecision>>;
  cancel: ReturnType<typeof useMutation<Booking, unknown, void>>;
}

/**
 * Single source of truth for the in-lesson controller: polls the compact,
 * server-synced session-state every 2s while active (pausing in a hidden tab,
 * refetching on focus/reconnect), and exposes the three early-end mutations —
 * all writing through the same query key so the UI never diverges from the
 * backend. Replaces the page's 10s booking-list poll for live state.
 */
export function useLessonSessionState({
  bookingId,
  enabled,
}: UseLessonSessionStateArgs): UseLessonSessionStateResult {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["lesson-session-state", bookingId], [bookingId]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLessonSessionState(bookingId),
    enabled: enabled && Boolean(bookingId),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (q) => {
      const status = q.state.data?.state.status;
      if (status && ENDED_STATUSES.has(status)) return false;
      return SESSION_STATE_POLL_MS;
    },
  });

  const result = query.data;
  const state = result?.state;

  const serverOffsetMs = useMemo(() => {
    if (!result) return 0;
    return computeServerOffsetMs(
      result.state.server_time,
      result.localRequestStartMs,
      result.localRequestEndMs
    );
  }, [result]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
    // Keep the page-level booking list in sync (status may have flipped).
    void queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  const requestEnd = useMutation({
    mutationFn: () => requestEarlyEnd(bookingId),
    onSettled: invalidate,
  });

  const respond = useMutation({
    mutationFn: (decision: EarlyEndDecision) => {
      const version = state?.early_end_request.version ?? 0;
      return respondToEarlyEnd(bookingId, decision, version);
    },
    onSettled: invalidate,
  });

  const cancel = useMutation({
    mutationFn: () => {
      const version = state?.early_end_request.version ?? 0;
      return cancelEarlyEndRequest(bookingId, version);
    },
    onSettled: invalidate,
  });

  return {
    state,
    earlyEnd: state?.early_end_request,
    serverOffsetMs,
    serverNow: () => serverNowMs(serverOffsetMs),
    isFetching: query.isFetching,
    refetch: () => void query.refetch(),
    requestEnd,
    respond,
    cancel,
  };
}

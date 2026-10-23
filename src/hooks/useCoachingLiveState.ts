"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  COACHING_SESSION_QUERY_KEYS,
  cancelCoachingEarlyEnd,
  extractCoachingErrorMessage,
  fetchCoachingLiveState,
  requestCoachingEarlyEnd,
  respondCoachingEarlyEnd,
  type CoachingEarlyEndDecision,
  type CoachingLiveState,
} from "@/lib/coachingApi";
import { liveStatePollMs } from "@/lib/coachingEarlyEnd";

type EarlyEndAction =
  | { type: "ask" }
  | { type: "respond"; decision: CoachingEarlyEndDecision; version: number }
  | { type: "cancel"; version: number };

function httpStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return typeof status === "number" ? status : null;
}

/**
 * A refused early-end call (409) carries the whole live state next to its
 * `code` and `detail`, so the screen can redraw from the very answer that said
 * no. Anything that is not that shape is just an error.
 */
function liveStateFromError(error: unknown): CoachingLiveState | null {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (!data || typeof data !== "object") return null;
  const body = data as Record<string, unknown>;
  if (typeof body.server_time !== "string" || typeof body.status !== "string" || !("early_end" in body)) return null;
  const { code: _code, detail: _detail, retry_available_at: _retry, ...state } = body;
  return state as unknown as CoachingLiveState;
}

/**
 * The room's view of "Birlikte bitir": the light live state, read about every
 * three seconds while the meeting runs (it pauses in a hidden tab and catches
 * up when the tab comes back), and the three things a person can do with it.
 * Every call answers with the new live state, which goes straight into the
 * cache, so the screen never waits for the next read to show what it just did.
 *
 * The server answers 403 `early_end_disabled` while the feature is off. That is
 * asked once, the feature reads as `disabled`, and nothing is polled again.
 */
export function useCoachingLiveState({ sessionId, enabled }: { sessionId: string; enabled: boolean }) {
  const queryClient = useQueryClient();
  const queryKey = COACHING_SESSION_QUERY_KEYS.liveState(sessionId);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchCoachingLiveState(sessionId),
    enabled: enabled && Boolean(sessionId),
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: (q) =>
      liveStatePollMs({ status: q.state.data?.status, errorStatus: httpStatus(q.state.error) }),
  });

  // The meeting moved on (an accept ended it): what the rest of the app knows of it
  // is old, whichever side said yes. The side that only sees it in the poll needs
  // this as much as the one that clicked, or the screen after the meeting would
  // still say "Görüşme sürüyor".
  const status = query.data?.status;
  useEffect(() => {
    if (!status || status === "in_progress" || status === "scheduled") return;
    void queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.detail(sessionId) });
    void queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.studentList() });
    void queryClient.invalidateQueries({ queryKey: COACHING_SESSION_QUERY_KEYS.tutorList() });
  }, [status, sessionId, queryClient]);

  const errorStatus = httpStatus(query.error);
  const disabled = errorStatus === 403 || errorStatus === 404;

  const action = useMutation({
    mutationFn: (next: EarlyEndAction) => {
      if (next.type === "ask") return requestCoachingEarlyEnd(sessionId);
      if (next.type === "respond") return respondCoachingEarlyEnd(sessionId, next.decision, next.version);
      return cancelCoachingEarlyEnd(sessionId, next.version);
    },
    onSuccess: (state) => {
      queryClient.setQueryData(queryKey, state);
    },
    onError: (error) => {
      const state = liveStateFromError(error);
      if (state) queryClient.setQueryData(queryKey, state);
    },
  });

  return {
    live: query.data,
    disabled,
    ask: () => action.mutate({ type: "ask" }),
    answer: (decision: CoachingEarlyEndDecision, version: number) =>
      action.mutate({ type: "respond", decision, version }),
    withdraw: (version: number) => action.mutate({ type: "cancel", version }),
    isActing: action.isPending,
    actionError: action.isError ? extractCoachingErrorMessage(action.error) : null,
  };
}

"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { fetchTutorAcceptanceConfig } from "@/lib/coachingApi";

/**
 * Whether the tutor's "Paket Talepleri" screen should be offered.
 *
 * A lesson package no longer waits for the tutor: the student picks hours the
 * tutor has published, pays, and the lessons appear on the calendar. What is
 * left to answer here is a request that is already open (made before that
 * changed, or a coaching bundle), so the screen is offered when:
 *  - this tutor has an unresolved request, or
 *  - coaching checkout is open, so a bundle request could arrive any moment.
 * The payments rollout flag has no say any more: with it on or off, no new
 * lesson-only request is made.
 *
 * Read from the PAYMENTS domain, not from /coaching/flag/: the open requests
 * live there and must stay visible when the backend's coaching build flag is
 * off and every /api/coaching/ route is unmounted.
 */
export function useTutorAcceptanceConfig() {
  const { isAuthenticated, isTutor } = useAuth();
  const { checkoutEnabled: coachingCheckoutEnabled } = useCoachingFlag();

  const query = useQuery({
    queryKey: ["tutor-acceptance-config"],
    queryFn: fetchTutorAcceptanceConfig,
    enabled: isAuthenticated && isTutor,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const hasOpenRequests = query.data?.has_open_requests ?? false;

  return {
    hasOpenRequests,
    acceptanceExpiryHours: query.data?.acceptance_expiry_hours ?? 48,
    showPackageRequests: isTutor && (hasOpenRequests || coachingCheckoutEnabled),
    isLoading: isAuthenticated && isTutor && query.isLoading,
  };
}

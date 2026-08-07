"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useCoachingFlag } from "@/hooks/useCoachingFlag";
import { fetchTutorAcceptanceConfig } from "@/lib/coachingApi";

/**
 * Whether the tutor's "Paket Talepleri" screen should be offered.
 *
 * Read from the PAYMENTS domain, not from /coaching/flag/. Package
 * acceptance covers lesson-only requests too, so it has to keep working —
 * and stay visible — when the backend's coaching build flag is off and
 * every /api/coaching/ route is unmounted.
 *
 * Visible when any of these holds:
 *  - the payments rollout flag is on;
 *  - this tutor still has an unresolved request from an earlier rollout;
 *  - coaching checkout is open, so a bundle request could arrive any moment.
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

  const enabled = query.data?.enabled ?? false;
  const hasOpenRequests = query.data?.has_open_requests ?? false;

  return {
    enabled,
    hasOpenRequests,
    acceptanceExpiryHours: query.data?.acceptance_expiry_hours ?? 48,
    showPackageRequests:
      isTutor && (enabled || hasOpenRequests || coachingCheckoutEnabled),
    isLoading: isAuthenticated && isTutor && query.isLoading,
  };
}

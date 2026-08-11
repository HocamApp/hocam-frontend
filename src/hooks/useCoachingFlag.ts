"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { fetchCoachingFlag } from "@/lib/coachingApi";

/**
 * Whether coaching is available to this viewer.
 *
 * Two independent switches must both be on:
 * - `NEXT_PUBLIC_COACHING_ENABLED` — the frontend build flag. When it is
 *   off we do not even call the API.
 * - the backend's runtime flag, read from `/coaching/flag/`.
 *
 * A 404 from that endpoint means the backend's own build flag is off; the
 * API client already maps that to `{enabled: false}`, so coaching simply
 * reads as unavailable rather than surfacing as an error.
 */
const BUILD_FLAG_ON = process.env.NEXT_PUBLIC_COACHING_ENABLED === "true";

export function useCoachingFlag() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: ["coaching-flag"],
    queryFn: fetchCoachingFlag,
    enabled: BUILD_FLAG_ON && isAuthenticated,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const enabled = BUILD_FLAG_ON && (query.data?.enabled ?? false);

  return {
    enabled,
    checkoutEnabled: BUILD_FLAG_ON && (query.data?.checkout_enabled ?? false),
    // Only "loading" when we actually asked. With the build flag off the
    // answer is known immediately, so nav never flickers.
    isLoading: BUILD_FLAG_ON && isAuthenticated && query.isLoading,
  };
}

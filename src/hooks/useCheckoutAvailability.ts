"use client";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { fetchCheckoutAvailability } from "@/lib/checkoutAvailabilityApi";
import { PAYTR_ENABLED } from "@/lib/featureFlags";

/**
 * Whether the signed-in student may pay online right now.
 *
 * Two switches, and both must be on:
 * - `NEXT_PUBLIC_PAYTR_ENABLED`, the build flag. Off, nobody is asked and the
 *   answer is `"off"`: the screens behave exactly as they did before this hook.
 * - the server's answer for this user (`/payments/checkout-availability/`), which
 *   applies the test-mode and allowlist rules, so a soft launch can open payment
 *   to a few accounts without opening it to everyone.
 *
 * `state`:
 * - `"off"`: build flag off; nothing was asked.
 * - `"closed"`: not signed in (the endpoint needs a user; a visitor sees the
 *   "coming soon" state), the server said no, or the request failed. The safe
 *   default is closed, never open.
 * - `"loading"`: signed in and the answer has not arrived.
 * - `"open"`: the server said yes.
 *
 * The answer is kept per user and only for a minute, and asked again whenever a
 * screen that needs it mounts, so someone added to the allowlist sees the flow
 * within a minute and a fresh sign-in never reads the previous person's answer.
 */
export type CheckoutAvailabilityState = "off" | "closed" | "loading" | "open";

export function useCheckoutAvailability() {
  const { isAuthenticated, user } = useAuth();
  const asked = PAYTR_ENABLED && isAuthenticated;

  const query = useQuery({
    queryKey: ["checkout-availability", user?.id ?? null],
    queryFn: fetchCheckoutAvailability,
    enabled: asked,
    staleTime: 60_000,
    gcTime: 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: false,
  });

  const state: CheckoutAvailabilityState = !PAYTR_ENABLED
    ? "off"
    : !isAuthenticated
      ? "closed"
      : query.isPending
        ? "loading"
        : query.data?.available === true
          ? "open"
          : "closed";

  return {
    state,
    open: state === "open",
    loading: state === "loading",
    code: query.data?.code ?? null,
  };
}

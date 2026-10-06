"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchPurchaseAcceptanceState } from "@/lib/coachingApi";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { fetchPayTRPaymentStatus } from "@/lib/paymentsApi";
import type { PackagePurchase } from "@/types";

import {
  payTRPayHref,
  payTRPaymentStatusKey,
  payTRPostCreateTarget,
  type PayTREntryBlockedReason,
} from "./paytrEntryPoints";

export interface PayTRPostCreateCheck {
  /** What the request screen should add while it stays; null adds nothing. */
  check: "checking" | "status_error" | "blocked" | null;
  blockedReason?: PayTREntryBlockedReason;
  /** Re-reads both answers. Reads only — never creates anything. */
  retry: () => void;
}

/**
 * Right after a package purchase is created: read the tutor-acceptance answer
 * and the server's payment status, and go to the payment screen only when
 * both prove the purchase can be paid. Everything else keeps the created
 * request on screen. Nothing here posts: the purchase already exists however
 * these reads end, so a failed read is a reason to show a re-read, never a
 * reason to create a second package.
 *
 * With the PayTR flag off both reads stay disabled and the screen is exactly
 * the request confirmation it was before.
 */
export function usePayTRPostCreate(
  purchase: PackagePurchase | null
): PayTRPostCreateCheck {
  const router = useRouter();
  const queryClient = useQueryClient();
  const purchaseId = purchase?.id ?? "";
  const enabled = PAYTR_ENABLED && purchase !== null;

  const acceptanceQuery = useQuery({
    queryKey: ["purchase-acceptance", purchaseId],
    queryFn: () => fetchPurchaseAcceptanceState(purchaseId),
    enabled,
    retry: false,
  });
  const paymentStatusQuery = useQuery({
    queryKey: payTRPaymentStatusKey(purchaseId),
    queryFn: () => fetchPayTRPaymentStatus(purchaseId),
    enabled,
    retry: false,
    staleTime: 0,
  });

  const { target, blockedReason } = purchase
    ? payTRPostCreateTarget({
        paytrEnabled: PAYTR_ENABLED,
        purchase,
        acceptance: acceptanceQuery.isError ? null : acceptanceQuery.data,
        paymentStatus: paymentStatusQuery.isError ? null : paymentStatusQuery.data,
      })
    : { target: "stay" as const, blockedReason: undefined };

  // One redirect per created purchase, however often this re-renders.
  const redirectedFor = useRef<string | null>(null);
  useEffect(() => {
    if (target !== "pay" || !purchaseId || redirectedFor.current === purchaseId) return;
    redirectedFor.current = purchaseId;
    // The payment screen shares this key but keeps the app's five-minute
    // staleTime; mark ours stale so it reads its own answer on arrival.
    void queryClient.invalidateQueries({
      queryKey: payTRPaymentStatusKey(purchaseId),
      exact: true,
      refetchType: "none",
    });
    router.push(payTRPayHref(purchaseId));
  }, [target, purchaseId, queryClient, router]);

  const { refetch: refetchAcceptance } = acceptanceQuery;
  const { refetch: refetchPaymentStatus } = paymentStatusQuery;
  const retry = useCallback(() => {
    void refetchAcceptance();
    void refetchPaymentStatus();
  }, [refetchAcceptance, refetchPaymentStatus]);

  switch (target) {
    case "pay":
    case "checking":
      return { check: "checking", retry };
    case "status_error":
      return { check: "status_error", retry };
    case "blocked":
      return { check: "blocked", blockedReason, retry };
    default:
      return { check: null, retry };
  }
}

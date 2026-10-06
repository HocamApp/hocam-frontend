"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  payTREntryBlockedMessage,
  payTREntryDecision,
  payTRPayHref,
  payTRPaymentStatusKey,
  payTRServerAllowsUnpaidCancel,
  payTRShowsUnpaidCancel,
} from "@/components/payments/paytr/paytrEntryPoints";
import { readPayTRRecovery } from "@/components/payments/paytr/paytrRecovery";
import { useAuth } from "@/hooks/useAuth";
import { useDelayedVisible } from "@/hooks/useDelayedVisible";
import {
  acceptanceStatusCopy,
  cancelUnpaidPackagePurchase,
  extractCoachingErrorMessage,
  fetchPurchaseAcceptanceState,
  withdrawPackageRequest,
} from "@/lib/coachingApi";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { fetchPayTRPaymentStatus } from "@/lib/paymentsApi";
import { getSessionStorage } from "@/lib/safeStorage";
import type { PackagePurchaseStatus } from "@/types";

/** A cancel the fresh payment-status read refused to send. */
class UnpaidCancelHeld extends Error {
  constructor(readonly reason: "in_flight" | "status_unreadable") {
    super(reason);
  }
}

/**
 * The student's half of the tutor-acceptance layer.
 *
 * The tutor has had a screen for this since the layer shipped; the student
 * only ever saw a purchase sitting at "pending" with no way to tell
 * whether a human had looked at it, and no way to take it back.
 *
 * Two exits, and they are NOT the same thing:
 *
 * - **Withdraw** — before the tutor answered. The request never happened.
 * - **Cancel** — after the tutor accepted but before payment activation.
 *   The acceptance record stays `accepted` on purpose: the tutor really
 *   did say yes, and that is an audit fact worth keeping.
 *
 * Neither moves money by itself. What has changed since: an accepted, still
 * unpaid purchase can now be paid, so this block also carries the way into
 * the PayTR screen. With the PayTR build flag on, that decision — and whether
 * unpaid cancel is safe — comes from the server's payment status for this
 * purchase, the only answer that sees an order opened in another tab. With
 * the flag off the card reads no payment status at all and stays as it was.
 * Nothing here may say "iade", "ödendi" or "hakediş".
 */
export function PackageRequestStatus({
  purchaseId,
  purchaseStatus = "pending",
  totalPrice,
}: {
  purchaseId: string;
  purchaseStatus?: PackagePurchaseStatus;
  /** The stored package total in TL, used to verify a coaching bundle. */
  totalPrice?: number;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [hasKnownAttempt, setHasKnownAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | "withdraw" | "cancel">(
    null
  );

  const acceptanceQuery = useQuery({
    queryKey: ["purchase-acceptance", purchaseId],
    queryFn: () => fetchPurchaseAcceptanceState(purchaseId),
  });
  const data = acceptanceQuery.data;

  // The payment screen shares this key. The app-wide defaults (five-minute
  // staleTime, no focus refetch) would let a second tab sit on an answer from
  // before another tab opened an order, so this query sets its own.
  const paymentStatusQuery = useQuery({
    queryKey: payTRPaymentStatusKey(purchaseId),
    queryFn: () => fetchPayTRPaymentStatus(purchaseId),
    enabled: PAYTR_ENABLED && purchaseStatus === "pending",
    retry: false,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
  // A failed read is not overruled by whatever it read before.
  const paymentStatus = paymentStatusQuery.isError ? null : paymentStatusQuery.data;

  // Read once per account: the breadcrumb says an attempt for some purchase
  // exists in this tab, never what became of it.
  useEffect(() => {
    if (!user?.id) return;
    const record = readPayTRRecovery(getSessionStorage(), user.id);
    setHasKnownAttempt(record?.purchaseId === purchaseId);
  }, [user?.id, purchaseId]);

  const decision = payTREntryDecision({
    paytrEnabled: PAYTR_ENABLED,
    purchaseId,
    purchaseStatus,
    totalPrice,
    acceptance: acceptanceQuery.isError ? null : data,
    paymentStatus,
    hasKnownAttempt,
  });
  const statusLoading = decision.action === "status_loading";
  const showLoadingPlaceholder = useDelayedVisible(statusLoading);

  // Leaving for the payment screen: mark the shared answer stale so that
  // screen reads its own instead of trusting the one this card holds.
  const markPaymentStatusStale = () => {
    void queryClient.invalidateQueries({
      queryKey: payTRPaymentStatusKey(purchaseId),
      exact: true,
      refetchType: "none",
    });
  };
  const refreshStatus = () => {
    setError(null);
    void paymentStatusQuery.refetch();
    void acceptanceQuery.refetch();
  };

  const paymentLink =
    decision.action === "pay" || decision.action === "check_status" ? (
      <Button size="sm" asChild>
        <Link
          href={payTRPayHref(purchaseId)}
          onClick={PAYTR_ENABLED ? markPaymentStatusStale : undefined}
        >
          {decision.action === "pay"
            ? "Ödemeye devam et"
            : "Ödeme durumunu kontrol et"}
        </Link>
      </Button>
    ) : null;

  // Nothing to act on until the server has answered. The line is visible
  // at once so the student knows what the card is waiting for; the shape
  // only follows if the wait is long enough to notice.
  const statusPending = statusLoading ? (
    <div role="status" aria-busy="true" className="space-y-2">
      {showLoadingPlaceholder ? (
        <Skeleton className="h-9 w-48 rounded-pill" />
      ) : null}
      <p className="text-xs text-muted-foreground">Ödeme durumu kontrol ediliyor…</p>
    </div>
  ) : null;

  // Unread is not "nothing in flight": no payment, no cancel, only a re-read.
  const statusUnreadable =
    decision.action === "status_error" ? (
      <div className="space-y-2">
        <p role="status" className="text-sm">
          Ödeme durumu alınamadı.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-11"
          onClick={refreshStatus}
        >
          Yenile
        </Button>
      </div>
    ) : null;

  const blockedLine = decision.blockedReason ? (
    <p className="text-xs text-muted-foreground">
      {payTREntryBlockedMessage(decision.blockedReason)}
    </p>
  ) : null;

  const invalidate = () => {
    setError(null);
    setConfirming(null);
    queryClient.invalidateQueries({ queryKey: ["purchase-acceptance", purchaseId] });
    queryClient.invalidateQueries({ queryKey: payTRPaymentStatusKey(purchaseId) });
    queryClient.invalidateQueries({ queryKey: ["package-purchases"] });
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
  };
  const onError = (err: unknown) => setError(extractCoachingErrorMessage(err));

  const withdraw = useMutation({
    mutationFn: () => withdrawPackageRequest(purchaseId),
    onSuccess: invalidate,
    onError,
  });
  const cancel = useMutation({
    mutationFn: async () => {
      // The card may be up to a few seconds old; the cancel must not be.
      if (PAYTR_ENABLED) {
        const fresh = await queryClient
          .fetchQuery({
            queryKey: payTRPaymentStatusKey(purchaseId),
            queryFn: () => fetchPayTRPaymentStatus(purchaseId),
            staleTime: 0,
            retry: false,
          })
          .catch(() => {
            throw new UnpaidCancelHeld("status_unreadable");
          });
        if (!payTRServerAllowsUnpaidCancel(purchaseId, fresh)) {
          throw new UnpaidCancelHeld("in_flight");
        }
      }
      return cancelUnpaidPackagePurchase(purchaseId);
    },
    onSuccess: invalidate,
    onError: (err: unknown) => {
      if (err instanceof UnpaidCancelHeld) {
        setConfirming(null);
        // An unreadable status already shows its own line and a re-read.
        setError(
          err.reason === "in_flight"
            ? "Ödeme sürüyor, paket şu anda iptal edilemez."
            : null
        );
        return;
      }
      onError(err);
    },
  });

  // Purchases created before the acceptance layer carry no request at all.
  // They used to render nothing; now they may still have a payment to make,
  // so the payment area stands on its own.
  if (!data?.requires_tutor_acceptance || !data.acceptance) {
    const paymentArea = statusPending ?? statusUnreadable ?? paymentLink ?? blockedLine;
    if (!paymentArea) return null;
    return <div className="mt-3">{paymentArea}</div>;
  }

  const { acceptance, can_withdraw, can_cancel_unpaid } = data;
  const pending = withdraw.isPending || cancel.isPending;
  const showsUnpaidCancel = payTRShowsUnpaidCancel({
    paytrEnabled: PAYTR_ENABLED,
    canCancelUnpaid: Boolean(can_cancel_unpaid),
    hasKnownAttempt,
    purchaseId,
    purchaseStatus,
    paymentStatus,
  });
  // A confirmation opened before the status changed under it closes with it.
  const activeConfirm =
    PAYTR_ENABLED && confirming === "cancel" && !showsUnpaidCancel && !cancel.isPending
      ? null
      : confirming;

  return (
    <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">{acceptanceStatusCopy(acceptance.status)}</p>
        {acceptance.includes_coaching ? (
          <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
            Çalışma koçluğu dahil
          </span>
        ) : null}
      </div>

      {acceptance.status === "pending" ? (
        <p className="text-xs text-muted-foreground">
          Yanıt süresi{" "}
          {new Date(acceptance.expires_at).toLocaleString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          &apos;e kadar. Bu aşamada kartından ödeme alınmaz.
        </p>
      ) : null}

      {acceptance.status === "accepted" && purchaseStatus === "pending" ? (
        <p className="text-xs text-muted-foreground">
          {PAYTR_ENABLED
            ? "Öğretmenin kabul etti. Paket ödeme bekliyor."
            : "Öğretmenin kabul etti. Paket henüz ödeme aktivasyonu bekliyor — hiçbir tahsilat yapılmadı."}
        </p>
      ) : null}

      {blockedLine}

      {data.coaching_service_status === "accepted_awaiting_schedule" && !statusLoading ? (
        <Button size="sm" asChild>
          <Link href="/dashboard/student/coaching/schedule">
            Koçluk saatini seç
          </Link>
        </Button>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}

      {statusUnreadable}

      {activeConfirm ? (
        <div className="space-y-2">
          <p className="text-xs">
            {activeConfirm === "withdraw"
              ? "Talebini geri çekmek istediğine emin misin? Öğretmenin bu talebi artık göremeyecek."
              : "Bu paketi iptal etmek istediğine emin misin? Öğretmenin kabulü kayıtlarda kalır, yeniden talep oluşturman gerekir."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                activeConfirm === "withdraw" ? withdraw.mutate() : cancel.mutate()
              }
            >
              {pending
                ? "Gönderiliyor..."
                : activeConfirm === "withdraw"
                  ? "Talebi geri çek"
                  : "Paketi iptal et"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              Vazgeç
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {statusLoading ? (
            statusPending
          ) : (
            <>
              {paymentLink}
              {can_withdraw ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirming("withdraw")}
                >
                  Talebi geri çek
                </Button>
              ) : null}
              {showsUnpaidCancel ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirming("cancel")}
                >
                  Paketi iptal et
                </Button>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  );
}

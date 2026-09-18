"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import {
  payTRPayHref,
  payTRPurchaseAction,
  payTRShowsUnpaidCancel,
} from "@/components/payments/paytr/paytrEntryPoints";
import { readPayTRRecovery } from "@/components/payments/paytr/paytrRecovery";
import { useAuth } from "@/hooks/useAuth";
import {
  acceptanceStatusCopy,
  cancelUnpaidPackagePurchase,
  extractCoachingErrorMessage,
  fetchPurchaseAcceptanceState,
  withdrawPackageRequest,
} from "@/lib/coachingApi";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { getSessionStorage } from "@/lib/safeStorage";
import type { PackagePurchaseStatus } from "@/types";

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
 * the PayTR screen — "Ödemeye devam et" when the purchase is payable, and
 * "Ödeme durumunu kontrol et" when this tab already started an attempt.
 * Nothing here may say "iade", "ödendi" or "hakediş".
 */
export function PackageRequestStatus({
  purchaseId,
  purchaseStatus = "pending",
}: {
  purchaseId: string;
  purchaseStatus?: PackagePurchaseStatus;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [hasKnownAttempt, setHasKnownAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<null | "withdraw" | "cancel">(
    null
  );

  const { data } = useQuery({
    queryKey: ["purchase-acceptance", purchaseId],
    queryFn: () => fetchPurchaseAcceptanceState(purchaseId),
  });

  // Read once per account: the breadcrumb says an attempt for some purchase
  // exists in this tab, never what became of it.
  useEffect(() => {
    if (!user?.id) return;
    const record = readPayTRRecovery(getSessionStorage(), user.id);
    setHasKnownAttempt(record?.purchaseId === purchaseId);
  }, [user?.id, purchaseId]);

  const paymentAction = payTRPurchaseAction({
    paytrEnabled: PAYTR_ENABLED,
    purchaseStatus,
    acceptance: data,
    hasKnownAttempt,
  });
  const paymentLink =
    paymentAction === "none" ? null : (
      <Button size="sm" asChild>
        <Link href={payTRPayHref(purchaseId)}>
          {paymentAction === "pay"
            ? "Ödemeye devam et"
            : "Ödeme durumunu kontrol et"}
        </Link>
      </Button>
    );

  const invalidate = () => {
    setError(null);
    setConfirming(null);
    queryClient.invalidateQueries({ queryKey: ["purchase-acceptance", purchaseId] });
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
    mutationFn: () => cancelUnpaidPackagePurchase(purchaseId),
    onSuccess: invalidate,
    onError,
  });

  // Purchases created before the acceptance layer carry no request at all.
  // They used to render nothing; now they may still have a payment to make,
  // so the payment link stands on its own.
  if (!data?.requires_tutor_acceptance || !data.acceptance) {
    if (!paymentLink) return null;
    return <div className="mt-3">{paymentLink}</div>;
  }

  const { acceptance, can_withdraw, can_cancel_unpaid } = data;
  const pending = withdraw.isPending || cancel.isPending;

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

      {data.coaching_service_status === "accepted_awaiting_schedule" ? (
        <Button size="sm" asChild>
          <Link href="/dashboard/student/coaching/schedule">
            Koçluk saatini seç
          </Link>
        </Button>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}

      {confirming ? (
        <div className="space-y-2">
          <p className="text-xs">
            {confirming === "withdraw"
              ? "Talebini geri çekmek istediğine emin misin? Öğretmenin bu talebi artık göremeyecek."
              : "Bu paketi iptal etmek istediğine emin misin? Öğretmenin kabulü kayıtlarda kalır, yeniden talep oluşturman gerekir."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                confirming === "withdraw" ? withdraw.mutate() : cancel.mutate()
              }
            >
              {pending
                ? "Gönderiliyor..."
                : confirming === "withdraw"
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
          {payTRShowsUnpaidCancel({
            canCancelUnpaid: Boolean(can_cancel_unpaid),
            hasKnownAttempt,
            purchaseStatus,
          }) ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming("cancel")}
            >
              Paketi iptal et
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

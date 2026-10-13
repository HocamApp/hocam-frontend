"use client";

import Link from "next/link";
import { Hourglass } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  payTREntryBlockedMessage,
  type PayTREntryBlockedReason,
} from "@/components/payments/paytr/paytrEntryPoints";
import type { PayTRPostCreateCheck } from "@/components/payments/paytr/usePayTRPostCreate";
import { useDelayedVisible } from "@/hooks/useDelayedVisible";
import { formatPrice } from "@/lib/utils";
import type { PackagePurchase } from "@/types";

interface CheckoutPayHandoffProps {
  purchase: PackagePurchase;
  /** Where the read that decides "go to payment" stands. */
  paymentCheck?: PayTRPostCreateCheck["check"];
  paymentBlockedReason?: PayTREntryBlockedReason;
  onRetryPaymentCheck?: () => void;
}

/**
 * What a student sees for the moment between "the purchase was made" and "the
 * payment page opens", and what stays if it does not open.
 *
 * The purchase holds the chosen hours from now on, so this does not talk about
 * a request waiting for anyone: nothing is waiting for a tutor. It says the
 * hours are held, that the payment page is next, and keeps a way there (and a
 * way to the student's packages) for the cases where the redirect does not
 * happen. Reaching the payment page is navigation only; a payment starts there,
 * from a button the student presses.
 */
export function CheckoutPayHandoff({
  purchase,
  paymentCheck = null,
  paymentBlockedReason,
  onRetryPaymentCheck,
}: CheckoutPayHandoffProps) {
  const showCheckPlaceholder = useDelayedVisible(paymentCheck === "checking");

  return (
    <Card className="mx-auto max-w-lg rounded-card border-[var(--checkout-soft-line)] bg-[var(--checkout-card-surface)] shadow-none">
      <CardContent className="space-y-4 pt-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill bg-[var(--checkout-advantage)] text-[var(--checkout-advantage-ink)]">
          <Hourglass className="h-6 w-6" weight="regular" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Saatlerin senin için ayrıldı</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {purchase.plan.name}, toplam {formatPrice(purchase.total_price)}. Ödeme sayfasına
            geçiyoruz.
          </p>
        </div>

        {paymentCheck === "checking" ? (
          <div role="status" aria-busy="true" className="flex flex-col items-center gap-2">
            {showCheckPlaceholder ? <Skeleton className="h-10 w-56 rounded-pill" /> : null}
            <p className="text-xs text-muted-foreground">Ödeme sayfası hazırlanıyor…</p>
          </div>
        ) : null}
        {paymentCheck === "status_error" ? (
          <div className="space-y-2">
            <p role="status" className="text-sm">
              Ödeme durumu alınamadı. Yenileyip tekrar deneyebilirsin.
            </p>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-pill"
              onClick={onRetryPaymentCheck}
            >
              Yenile
            </Button>
          </div>
        ) : null}
        {paymentCheck === "blocked" && paymentBlockedReason ? (
          <p className="text-sm text-muted-foreground">
            {payTREntryBlockedMessage(paymentBlockedReason)}
          </p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="rounded-pill bg-[var(--checkout-cta)] text-[var(--checkout-on-cta)] hover:bg-[var(--checkout-cta-hover)]"
            asChild
          >
            <Link href={`/package-purchases/${purchase.id}/pay`}>Ödemeye git</Link>
          </Button>
          <Button variant="outline" className="rounded-pill" asChild>
            <Link href="/profile/payments">Paketlerimi görüntüle</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

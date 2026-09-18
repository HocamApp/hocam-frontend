"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { MinimalCheckoutHeader } from "@/components/checkout/MinimalCheckoutHeader";
import { useAuth } from "@/hooks/useAuth";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { getSessionStorage } from "@/lib/safeStorage";

import { PayTRProcessingState } from "./PayTRProcessingState";
import { PayTRPurchaseSummary } from "./PayTRPurchaseSummary";
import { PayTRResultState, PAYTR_PACKAGES_HREF } from "./PayTRResultState";
import { paytrCheckoutState } from "./paytrCheckoutState";
import { payTRPollIntervalMs, payTRRecoveryStartedAt } from "./paytrPolling";
import {
  clearPayTRRecovery,
  readPayTRRecovery,
  type PayTRRecoveryRecord,
} from "./paytrRecovery";

/**
 * Both PayTR return addresses, /odeme/basarili and /odeme/basarisiz, render
 * this one screen.
 *
 * The provider chooses which URL the browser lands on, and that choice is not
 * evidence: a success redirect can arrive before the callback has been
 * processed, and a failure redirect can lose a race with a payment that went
 * through. So neither route names an outcome. Both read the attempt this tab
 * remembers, ask the backend about that purchase, and show what the backend
 * says — including "still verifying".
 *
 * The return URLs carry no purchase id, which is why the recovery breadcrumb
 * exists at all. Without one, the screen claims nothing and offers a way to
 * Paketlerim.
 */
export function PayTRReturnScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  // undefined until storage has been read: "not looked yet" and "nothing
  // there" must not render the same.
  const [recovery, setRecovery] = useState<PayTRRecoveryRecord | null | undefined>(
    undefined
  );
  // Storage is read once per account, and the login redirect fires once.
  // Reading it on every render would hand React a new record object each time
  // and spin the effect forever.
  const readFor = useRef<string | null>(null);
  const redirected = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      if (redirected.current) return;
      redirected.current = true;
      // The breadcrumb lives in this tab's sessionStorage and survives the
      // login round trip, so recovery continues where it left off.
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    const userId = user?.id;
    if (!userId || readFor.current === userId) return;
    readFor.current = userId;
    const record = readPayTRRecovery(getSessionStorage(), userId);
    setRecovery(record ? { ...record, startedAt: payTRRecoveryStartedAt(record.startedAt, Date.now()) } : null);
  }, [authLoading, isAuthenticated, pathname, router, user?.id]);

  const purchasesQuery = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated && Boolean(recovery),
    refetchInterval: (query) =>
      payTRPollIntervalMs({
        attemptActive: Boolean(recovery),
        elapsedMs: recovery ? Date.now() - recovery.startedAt : 0,
        purchaseStatus: query.state.data?.find((item) => item.id === recovery?.purchaseId)?.status,
      }),
  });

  const purchase = !recovery
    ? undefined
    : purchasesQuery.data === undefined
      ? purchasesQuery.isError
        ? null
        : undefined
      : (purchasesQuery.data.find((item) => item.id === recovery.purchaseId) ??
        null);

  const state = paytrCheckoutState({
    paytrEnabled: PAYTR_ENABLED,
    purchase,
    purchaseQueryFailed: purchasesQuery.isError,
    // Unreachable here: a matching breadcrumb settles the state before the
    // mapper ever consults acceptance, and this screen only renders with one.
    acceptance: null,
    knownAttempt: recovery ?? null,
  });

  const settled =
    state.name === "payment_paid" ||
    state.name === "purchase_cancelled" ||
    state.name === "purchase_refunded";

  useEffect(() => {
    if (!settled) return;
    // A final server answer is the one thing that ends the attempt. Walking to
    // Paketlerim does not, and neither does closing the tab.
    if (recovery) clearPayTRRecovery(getSessionStorage(), user?.id, recovery.purchaseId);
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
  }, [settled, queryClient, user?.id, recovery]);

  const recheck = useCallback(() => {
    void purchasesQuery.refetch();
  }, [purchasesQuery]);

  const activatedCredits =
    state.name === "payment_paid" && typeof purchase?.remaining_credits === "number"
      ? purchase.remaining_credits
      : null;

  return (
    <div className="min-h-[100dvh] bg-[var(--checkout-page-surface)] text-[var(--checkout-page-ink)]">
      <MinimalCheckoutHeader backHref={PAYTR_PACKAGES_HREF} backLabel="Paketlerim" />
      <main
        id="checkout-content"
        className="mx-auto w-full max-w-[40rem] px-4 pb-12 pt-6 sm:px-6"
      >
        {renderBody()}
      </main>
    </div>
  );

  function renderBody() {
    if (authLoading || recovery === undefined) {
      return <PayTRProcessingState state={{ name: "loading" }} />;
    }

    if (recovery === null) {
      return (
        <section className="rounded-[20px] border border-[#e6dddd] bg-white p-4 text-[#02171a] sm:p-6">
          <h1 className="text-[1.375rem] font-semibold leading-8">
            Ödeme sonucu burada doğrulanamıyor
          </h1>
          <p className="mt-2 text-sm text-[#5c6b6d]">
            Paketlerim alanından güncel durumu kontrol edebilirsin.
          </p>
          <Link
            href={PAYTR_PACKAGES_HREF}
            className="mt-6 inline-flex min-h-[2.75rem] items-center text-base underline underline-offset-4 hover:text-[var(--pink-deep)]"
          >
            Paketlerime git
          </Link>
        </section>
      );
    }

    if (state.name === "loading") {
      return <PayTRProcessingState state={{ name: "loading" }} />;
    }

    return (
      <>
        <PayTRResultState state={{ name: state.name }} onRecheck={recheck} />
        {activatedCredits !== null && (
          <p className="mt-4 text-sm text-[#02171a]">
            {activatedCredits} ders kredin kullanıma açıldı.
          </p>
        )}
        {purchase && <PayTRPurchaseSummary purchase={purchase} className="mt-6" />}
      </>
    );
  }
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { MinimalCheckoutHeader } from "@/components/checkout/MinimalCheckoutHeader";
import { useAuth } from "@/hooks/useAuth";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import { fetchPackagePurchases, fetchPayTRPaymentStatus } from "@/lib/paymentsApi";
import { getSessionStorage } from "@/lib/safeStorage";

import { PayTRProcessingState } from "./PayTRProcessingState";
import { PayTRPurchaseSummary } from "./PayTRPurchaseSummary";
import { PayTRResultState, PAYTR_PACKAGES_HREF } from "./PayTRResultState";
import { paytrCheckoutState } from "./paytrCheckoutState";
import { isFramed, moveTopHere } from "./paytrFrameEscape";
import {
  PAYTR_FAST_POLL_WINDOW_MS,
  payTRPollIntervalMs,
  payTRRecoveryStartedAt,
} from "./paytrPolling";
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
 *
 * PayTR's docs do not say whether these URLs open in the top window or inside
 * the payment iframe on our own page. With payments built in, a copy that
 * finds itself framed reads nothing and moves the whole tab here instead, so
 * the result never renders squeezed inside the provider's box.
 */

/** Pick the payment status up straight away when payments are live. */
const FRESH_STATUS = PAYTR_ENABLED
  ? { staleTime: 0, refetchOnWindowFocus: true }
  : {};

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
  const [framed, setFramed] = useState(false);
  const [waitWindowOver, setWaitWindowOver] = useState(false);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusedState = useRef<string | null>(null);

  // Same-origin frame: the top window is this site's payment page, so the
  // tab can be moved here whole. The breadcrumb travels with the tab.
  useEffect(() => {
    if (!PAYTR_ENABLED || !isFramed()) return;
    setFramed(true);
    // A top window we may not navigate: stay quiet rather than read here.
    moveTopHere();
  }, []);

  useEffect(() => {
    if (PAYTR_ENABLED && isFramed()) return;
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

  const paymentStatusQuery = useQuery({
    queryKey: ["paytr-payment-status", recovery?.purchaseId],
    queryFn: () => fetchPayTRPaymentStatus(recovery!.purchaseId),
    enabled: isAuthenticated && Boolean(recovery),
    retry: false,
    ...FRESH_STATUS,
    refetchInterval: () =>
      payTRPollIntervalMs({
        attemptActive: Boolean(recovery),
        elapsedMs: recovery ? Date.now() - recovery.startedAt : 0,
        purchaseStatus: purchase?.status,
      }),
  });

  const state = paytrCheckoutState({
    paytrEnabled: PAYTR_ENABLED,
    purchase,
    purchaseQueryFailed: purchasesQuery.isError,
    // Unreachable here: a matching breadcrumb settles the state before the
    // mapper ever consults acceptance, and this screen only renders with one.
    acceptance: null,
    knownAttempt: recovery ?? null,
    paymentStatusRequired: true,
    paymentStatus: paymentStatusQuery.isError ? null : paymentStatusQuery.data,
    paymentStatusQueryFailed: paymentStatusQuery.isError,
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

  // The fast polling window ending is not a verdict either; it only means the
  // student is told the wait is longer than usual and how to look again.
  useEffect(() => {
    if (!PAYTR_ENABLED || !recovery) return;
    const remaining = PAYTR_FAST_POLL_WINDOW_MS - (Date.now() - recovery.startedAt);
    if (remaining <= 0) {
      setWaitWindowOver(true);
      return;
    }
    const timer = window.setTimeout(() => setWaitWindowOver(true), remaining);
    return () => window.clearTimeout(timer);
  }, [recovery]);

  const resultShown =
    !framed && !authLoading && Boolean(recovery) && state.name !== "loading";

  // Each new outcome takes focus, so a screen reader and a keyboard both land
  // on it rather than on whatever the processing view left behind.
  useEffect(() => {
    if (!PAYTR_ENABLED || !resultShown || focusedState.current === state.name) return;
    focusedState.current = state.name;
    resultHeadingRef.current?.focus();
  }, [resultShown, state.name]);

  const recheck = useCallback(() => {
    void purchasesQuery.refetch();
    void paymentStatusQuery.refetch();
  }, [purchasesQuery, paymentStatusQuery]);

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
    if (framed || authLoading || recovery === undefined) {
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
            {PAYTR_ENABLED
              ? "Paketlerim'de ödeme durumunu kontrol et"
              : "Paketlerime git"}
          </Link>
        </section>
      );
    }

    if (state.name === "loading") {
      return <PayTRProcessingState state={{ name: "loading" }} />;
    }

    return (
      <>
        <PayTRResultState
          state={{ name: state.name }}
          onRecheck={recheck}
          live={PAYTR_ENABLED}
          headingRef={PAYTR_ENABLED ? resultHeadingRef : undefined}
        />
        {PAYTR_ENABLED && waitWindowOver && state.name === "callback_pending" && (
          <p role="status" className="mt-4 text-sm text-[#02171a]">
            Doğrulama beklenenden uzun sürüyor. Yeniden ödeme yapma; durumu kontrol et.
          </p>
        )}
        {activatedCredits !== null && (
          <p className="mt-4 text-sm text-[#02171a]">
            {activatedCredits} ders kredin kullanıma açıldı.
          </p>
        )}
        {purchase && <PayTRPurchaseSummary
          purchase={paymentStatusQuery.data ? purchase : paymentStatusQuery.isError ? null : undefined}
          paymentStatus={paymentStatusQuery.data}
          className="mt-6"
        />}
      </>
    );
  }
}

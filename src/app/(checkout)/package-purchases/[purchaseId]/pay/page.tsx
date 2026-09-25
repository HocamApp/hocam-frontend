"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { MinimalCheckoutHeader } from "@/components/checkout/MinimalCheckoutHeader";
import { PayTRCustomerForm } from "@/components/payments/paytr/PayTRCustomerForm";
import { PayTRFrame } from "@/components/payments/paytr/PayTRFrame";
import { PayTRProcessingState } from "@/components/payments/paytr/PayTRProcessingState";
import { PayTRPurchaseSummary } from "@/components/payments/paytr/PayTRPurchaseSummary";
import { PayTRResultState } from "@/components/payments/paytr/PayTRResultState";
import {
  paytrCheckoutState,
  type PayTRAttemptPhase,
} from "@/components/payments/paytr/paytrCheckoutState";
import { readPayTRIframeUrl } from "@/components/payments/paytr/paytrIframeUrl";
import {
  PAYTR_FAST_POLL_WINDOW_MS,
  payTRPollIntervalMs,
  payTRRecoveryStartedAt,
} from "@/components/payments/paytr/paytrPolling";
import {
  attachMerchantOid,
  beginPayTRRecovery,
  clearPayTRRecovery,
  readPayTRRecovery,
  type PayTRRecoveryRecord,
} from "@/components/payments/paytr/paytrRecovery";
import type { PayTRCustomerFormValues } from "@/components/payments/paytr/paytrCustomerSchema";
import { useAuth } from "@/hooks/useAuth";
import { fetchPurchaseAcceptanceState } from "@/lib/coachingApi";
import { PAYTR_ENABLED } from "@/lib/featureFlags";
import {
  describePayTRCheckoutError,
  fetchPackagePurchases,
  fetchPayTRPaymentStatus,
  startPayTRCheckout,
  type PayTRCheckoutErrorKind,
  type PayTRCustomerField,
} from "@/lib/paymentsApi";
import { getSessionStorage } from "@/lib/safeStorage";

/**
 * Where a created package purchase is paid for.
 *
 * The screen never decides anything itself: `paytrCheckoutState` maps the
 * server's purchase and acceptance answers, this tab's attempt and the
 * recovery breadcrumb onto one state, and this file renders it. The rules it
 * exists to keep:
 *
 * - A token is requested only from a deliberate submit. Mounting, focusing,
 *   reloading or returning from PayTR never posts.
 * - A rejected submit clears its breadcrumb. A 400 can be corrected; a 404
 *   closes the form; 409/503 require fresh purchase and acceptance reads.
 *   A lost response keeps recovery and never invites another payment.
 * - Polling asks the server for two seconds at a time and stops after the
 *   window; it never concludes anything by itself.
 */
export default function PayTRPaymentPage({
  params,
}: {
  params: { purchaseId: string };
}) {
  const { purchaseId } = params;
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isStudent, isLoading: authLoading } = useAuth();

  const [attemptPhase, setAttemptPhase] = useState<PayTRAttemptPhase>("idle");
  // In memory only: the iframe URL carries a short-lived token.
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [knownAttempt, setKnownAttempt] = useState<PayTRRecoveryRecord | null>(null);
  const [lastStartErrorKind, setLastStartErrorKind] =
    useState<PayTRCheckoutErrorKind | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<PayTRCustomerField, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);
  const [fastPollWindowOver, setFastPollWindowOver] = useState(false);
  const [retryRequested, setRetryRequested] = useState(false);
  // The server issued a token but named an address we will not embed. The
  // attempt exists, so this is an unresolved payment, not a free retry.
  const [iframeRejected, setIframeRejected] = useState(false);
  const submitLock = useRef(false);
  const verificationLock = useRef(false);
  const [revalidation, setRevalidation] = useState<"idle" | "required" | "checking" | "failed">("idle");

  const storage = typeof window === "undefined" ? null : getSessionStorage();
  const userId = user?.id;

  // Checkout is meaningless anonymously; come back here after logging in.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isStudent) router.replace("/home");
  }, [authLoading, isAuthenticated, isStudent, pathname, router]);

  // Read the breadcrumb once per account: it says an attempt exists, never
  // what happened to it.
  useEffect(() => {
    if (!userId) return;
    const record = readPayTRRecovery(getSessionStorage(), userId);
    const recovered = record ? { ...record, startedAt: payTRRecoveryStartedAt(record.startedAt, Date.now()) } : null;
    setKnownAttempt(recovered);
    setAttemptStartedAt(recovered?.purchaseId === purchaseId ? recovered.startedAt : null);
  }, [userId, purchaseId]);

  const attemptActive =
    attemptPhase !== "idle" ||
    lastStartErrorKind === "unknown" ||
    knownAttempt?.purchaseId === purchaseId;

  const purchasesQuery = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
    enabled: isAuthenticated && isStudent,
    refetchInterval: (query) =>
      payTRPollIntervalMs({
        attemptActive,
        elapsedMs: attemptStartedAt !== null ? Date.now() - attemptStartedAt : 0,
        purchaseStatus: query.state.data?.find((item) => item.id === purchaseId)?.status,
      }),
  });

  const acceptanceQuery = useQuery({
    queryKey: ["purchase-acceptance", purchaseId],
    queryFn: () => fetchPurchaseAcceptanceState(purchaseId),
    enabled: isAuthenticated && isStudent,
  });

  const purchase = useMemo(() => {
    if (purchasesQuery.data === undefined) {
      return purchasesQuery.isError ? null : undefined;
    }
    return purchasesQuery.data.find((item) => item.id === purchaseId) ?? null;
  }, [purchasesQuery.data, purchasesQuery.isError, purchaseId]);

  const paymentStatusQuery = useQuery({
    queryKey: ["paytr-payment-status", purchaseId],
    queryFn: () => fetchPayTRPaymentStatus(purchaseId),
    enabled: isAuthenticated && isStudent && Boolean(purchase),
    retry: false,
    refetchInterval: () =>
      payTRPollIntervalMs({
        attemptActive,
        elapsedMs: attemptStartedAt !== null ? Date.now() - attemptStartedAt : 0,
        purchaseStatus: purchase?.status,
      }),
  });

  const state = paytrCheckoutState({
    paytrEnabled: PAYTR_ENABLED,
    purchase,
    purchaseQueryFailed: purchasesQuery.isError,
    acceptance: acceptanceQuery.isError ? null : acceptanceQuery.data,
    acceptanceQueryFailed: acceptanceQuery.isError,
    attemptPhase,
    iframeUrl,
    knownAttempt,
    lastStartErrorKind,
    revalidation,
    paymentStatusRequired: true,
    paymentStatus: paymentStatusQuery.isError ? null : paymentStatusQuery.data,
    paymentStatusQueryFailed: paymentStatusQuery.isError,
    retryRequested,
  });

  const canSubmit = useRef(false);
  canSubmit.current = state.canStartPayment;

  const revalidate = useCallback(async () => {
    verificationLock.current = true;
    setRevalidation("checking");
    const results = await Promise.allSettled([
      purchasesQuery.refetch({ throwOnError: true }),
      acceptanceQuery.refetch({ throwOnError: true }),
      paymentStatusQuery.refetch({ throwOnError: true }),
    ]);
    if (results.some((result) => result.status === "rejected" || result.value.isError)) {
      setRevalidation("failed");
      return;
    }
    const status = results[2].status === "fulfilled" ? results[2].value.data : null;
    if (status?.can_start_checkout && !status.has_active_attempt &&
        !status.requires_reconciliation) {
      clearPayTRRecovery(getSessionStorage(), userId, purchaseId);
      setKnownAttempt(null);
      setAttemptStartedAt(null);
    }
    setLastStartErrorKind(null);
    setFormError(null);
    setRevalidation("idle");
    verificationLock.current = false;
  }, [purchasesQuery, acceptanceQuery, paymentStatusQuery, userId, purchaseId]);

  const startCheckout = useMutation({
    mutationFn: (values: PayTRCustomerFormValues) =>
      startPayTRCheckout(purchaseId, values),
    // Never automatically POST: only the student's submit starts or resumes.
    retry: false,
    onSuccess: (response) => {
      attachMerchantOid(
        getSessionStorage(),
        userId,
        purchaseId,
        response.merchant_oid
      );
      setKnownAttempt(readPayTRRecovery(getSessionStorage(), userId));
      const safeUrl = readPayTRIframeUrl(response.iframe_url);
      setIframeUrl(safeUrl);
      setIframeRejected(!safeUrl);
      setAttemptPhase(safeUrl ? "iframe" : "verifying");
      void paymentStatusQuery.refetch();
    },
    onError: (error) => {
      const described = describePayTRCheckoutError(error);
      setLastStartErrorKind(described.kind);
      setAttemptPhase("idle");

      if (["unknown", "conflict", "service"].includes(described.kind)) {
        // The request may well have created an attempt. Keep the breadcrumb,
        // stop offering to pay, and let the student re-check the result.
        setKnownAttempt(readPayTRRecovery(getSessionStorage(), userId));
        if (described.kind !== "unknown") setFormError(described.message);
        if (described.kind === "conflict") {
          void revalidate();
        }
        return;
      }

      // The server answered, so no attempt is waiting on this submit.
      clearPayTRRecovery(getSessionStorage(), userId, purchaseId);
      setKnownAttempt(null);
      setAttemptStartedAt(null);
      setFieldErrors(described.fieldErrors);
      setFormError(
        Object.keys(described.fieldErrors).length > 0 ? null : described.message
      );
    },
    onSettled: () => {
      submitLock.current = false;
    },
  });

  const handleSubmit = useCallback(
    async (values: PayTRCustomerFormValues) => {
      if (submitLock.current || verificationLock.current || !canSubmit.current || !purchase || !userId) return;
      submitLock.current = true;
      setFieldErrors({});
      setFormError(null);
      setLastStartErrorKind(null);
      setRetryRequested(false);
      setFastPollWindowOver(false);
      setIframeRejected(false);

      const previousStartedAt = state.name === "payment_resume"
        ? Date.parse(paymentStatusQuery.data?.latest_attempt?.created_at ?? "")
        : NaN;
      const startedAt = Number.isFinite(previousStartedAt) ? previousStartedAt : Date.now();
      setAttemptStartedAt(startedAt);
      // Opened before the POST: a reply that never arrives still leaves a
      // trace pointing at this purchase.
      beginPayTRRecovery(getSessionStorage(), userId, {
        purchaseId,
        tutorId: purchase.tutor.id,
        startedAt,
      });
      setAttemptPhase("starting");
      startCheckout.mutate(values);
    },
    [purchase, purchaseId, startCheckout, userId, state.name, paymentStatusQuery.data]
  );

  // The fast-poll window ending is a UI change, not a verdict: the frame stays
  // and the student is offered a manual re-check.
  useEffect(() => {
    if (attemptStartedAt === null) return;
    const remaining = PAYTR_FAST_POLL_WINDOW_MS - (Date.now() - attemptStartedAt);
    if (remaining <= 0) {
      setFastPollWindowOver(true);
      return;
    }
    const timer = window.setTimeout(() => setFastPollWindowOver(true), remaining);
    return () => window.clearTimeout(timer);
  }, [attemptStartedAt]);

  // A settled purchase ends the attempt: drop the breadcrumb and let the rest
  // of the app see the new credits.
  useEffect(() => {
    if (!["payment_paid", "purchase_cancelled", "purchase_refunded"].includes(state.name)) return;
    clearPayTRRecovery(getSessionStorage(), userId, purchaseId);
    setKnownAttempt(null);
    setIframeUrl(null);
    setAttemptPhase("idle");
    setAttemptStartedAt(null);
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
  }, [state.name, queryClient, userId, purchaseId]);

  const recheck = useCallback(() => {
    if (revalidation === "checking") return;
    void revalidate();
  }, [revalidation, revalidate]);

  const requestRetry = useCallback(() => {
    if (!paymentStatusQuery.data?.can_retry_checkout) return;
    setRetryRequested(true);
    setLastStartErrorKind(null);
  }, [paymentStatusQuery.data]);

  const showSummary =
    state.name !== "purchase_unavailable" && state.name !== "query_error";

  return (
    <div className="min-h-[100dvh] bg-[var(--checkout-page-surface)] text-[var(--checkout-page-ink)]">
      <MinimalCheckoutHeader backHref="/profile/payments" backLabel="Paketlerim" />
      <main
        id="checkout-content"
        className="mx-auto w-full max-w-[70rem] px-4 pb-12 pt-6 sm:px-6"
      >
        <h1 className="text-[1.625rem] font-semibold leading-9 sm:text-[2rem] sm:leading-10">
          Ödemeyi tamamla
        </h1>
        <p className="mt-2 text-sm text-[#5c6b6d]">
          Paketini kontrol et, ardından ödeme bilgilerini gir.
        </p>

        {/* The summary comes first in the DOM: on a phone the student should
            see what they are paying for before the form, and a screen reader
            gets the same order. On a wide screen the grid places it in the
            second column without moving it in the document. */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22.5rem]">
          {showSummary && (
            <PayTRPurchaseSummary
              purchase={purchase}
              className="self-start lg:col-start-2 lg:row-start-1"
            />
          )}
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            {formError && state.name !== "payment_ready" && state.name !== "starting_payment" && (
              <p role="status" className="mb-4 text-sm text-[#b33a24]">{formError}</p>
            )}
            {renderMain()}
          </div>
        </div>
      </main>
    </div>
  );

  function renderMain() {
    if (state.name === "payment_ready" || state.name === "payment_resume" || state.name === "starting_payment") {
      return (
        <PayTRCustomerForm
          onSubmit={handleSubmit}
          isSubmitting={state.name === "starting_payment"}
          fieldErrors={fieldErrors}
          formError={formError}
          resumeExisting={state.name === "payment_resume"}
        />
      );
    }

    if (state.name === "iframe_open") {
      return (
        <>
          <PayTRFrame iframeUrl={state.iframeUrl} />
          {fastPollWindowOver && (
            <div className="mt-4 rounded-[20px] border border-[#e6dddd] bg-white p-4 sm:p-6">
              <p className="text-sm text-[#02171a]">
                Ödeme sonucu henüz doğrulanmadı. Durumu yeniden kontrol
                edebilirsin.
              </p>
              <button
                type="button"
                onClick={recheck}
                className="mt-3 flex min-h-[3rem] items-center justify-center rounded-full border border-[#02171a] px-5 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02171a] focus-visible:ring-offset-2"
              >
                Durumu kontrol et
              </button>
            </div>
          )}
        </>
      );
    }

    if (iframeRejected) {
      return (
        <>
          <PayTRFrame iframeUrl={null} />
          <PayTRResultState
            state={{ name: state.name }}
            onRecheck={recheck}
            className="mt-4"
          />
        </>
      );
    }

    if (state.name === "loading") {
      return <PayTRProcessingState state={{ name: state.name }} />;
    }

    return (
      <PayTRResultState
        state={{
          name: state.name,
          acceptanceStatus: state.acceptanceStatus,
          blockedReason: state.blockedReason,
        }}
        onRecheck={recheck}
        onRetry={state.canRetryPayment ? requestRetry : undefined}
      />
    );
  }
}

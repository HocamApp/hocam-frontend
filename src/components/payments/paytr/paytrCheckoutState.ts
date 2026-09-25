import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PayTRCheckoutErrorKind } from "@/lib/paymentsApi";
import type { PackagePurchase, PayTRPaymentStatus } from "@/types";

import type { PayTRRecoveryRecord } from "./paytrRecovery";

/**
 * One pure function from "everything the payment screen currently knows" to
 * "what it should render". Components read the result; they do not re-derive
 * eligibility from scattered conditions, because every such condition is a
 * chance to open a payment the server has not agreed to.
 *
 * Two rules shape the ordering below:
 *
 * - The backend purchase status is the last word. A paid purchase renders as
 *   paid however the browser got here, including through /odeme/basarisiz.
 * - Anything unresolved stays unresolved. A lost response, an unread query or
 *   an attempt this tab already started never resolves into "go ahead and pay
 *   again" — only a verified backend answer moves the screen forward.
 */

export type AcceptanceDecisionStatus = NonNullable<
  PurchaseAcceptanceState["acceptance"]
>["status"];

export type PayTRCheckoutStateName =
  | "loading"
  | "query_error"
  | "purchase_unavailable"
  | "acceptance_pending"
  | "acceptance_rejected"
  | "payment_unavailable"
  | "payment_ready"
  | "payment_resume"
  | "starting_payment"
  | "iframe_open"
  | "callback_pending"
  | "attempt_failed"
  | "manual_review"
  | "payment_paid"
  | "purchase_cancelled"
  | "purchase_refunded";

export type PayTRBlockedReason = "flag_off" | "coaching_unverified";

/** Where the local attempt is, as this tab's memory sees it. Never persisted:
 * the phase dies with the page, and the recovery record takes over. */
export type PayTRAttemptPhase = "idle" | "starting" | "iframe" | "verifying";

export interface PayTRVerifiedAttempt {
  status: "created" | "token_issued" | "succeeded" | "failed";
  manualReview: boolean;
}

export interface PayTRCheckoutStateInput {
  /** The frontend build flag. It gates new payments, never an existing one. */
  paytrEnabled: boolean;
  /** undefined while loading, null when the server has no such purchase for
   * this student. */
  purchase: PackagePurchase | null | undefined;
  purchaseQueryFailed?: boolean;
  revalidation?: "idle" | "required" | "checking" | "failed";
  acceptance: PurchaseAcceptanceState | null | undefined;
  acceptanceQueryFailed?: boolean;
  attemptPhase?: PayTRAttemptPhase;
  /** Already validated by the caller — this mapper does not vet origins. */
  iframeUrl?: string | null;
  /** The sessionStorage breadcrumb, if this tab has one. */
  knownAttempt?: PayTRRecoveryRecord | null;
  lastStartErrorKind?: PayTRCheckoutErrorKind | null;
  /**
   * Legacy mapper input for pure state tests. Real payment routes use the
   * owned purchase payment-status endpoint below.
   */
  verifiedAttempt?: PayTRVerifiedAttempt | null;
  /** Required by the real payment route before offering a new POST. */
  paymentStatusRequired?: boolean;
  paymentStatus?: PayTRPaymentStatus | null;
  paymentStatusQueryFailed?: boolean;
  retryRequested?: boolean;
}

export interface PayTRCheckoutState {
  name: PayTRCheckoutStateName;
  /** True when a new attempt or the same active order can be submitted. */
  canStartPayment: boolean;
  /** True only on a verified failed attempt: one new attempt, same purchase. */
  canRetryPayment: boolean;
  acceptanceStatus?: AcceptanceDecisionStatus;
  blockedReason?: PayTRBlockedReason;
  iframeUrl?: string;
}

function build(
  name: PayTRCheckoutStateName,
  extra: Partial<Omit<PayTRCheckoutState, "name">> = {}
): PayTRCheckoutState {
  return {
    name,
    canStartPayment: false,
    canRetryPayment: false,
    ...extra,
  };
}

/**
 * True only when the server has shown us there is no coaching in this package.
 *
 * Coaching always creates an acceptance record server-side — `CoachingPurchase`
 * has a required acceptance FK — so "no acceptance record at all" is proof of a
 * lesson-only purchase, and an existing record answers with includes_coaching.
 * Missing information is never read as lesson-only (B03).
 */
function isLessonOnly(acceptance: PurchaseAcceptanceState): boolean {
  if (!acceptance.acceptance) return true;
  return acceptance.acceptance.includes_coaching === false;
}

export function paytrCheckoutState(
  input: PayTRCheckoutStateInput
): PayTRCheckoutState {
  const {
    paytrEnabled,
    purchase,
    purchaseQueryFailed = false,
    revalidation = "idle",
    acceptance,
    acceptanceQueryFailed = false,
    attemptPhase = "idle",
    iframeUrl,
    knownAttempt,
    lastStartErrorKind,
    verifiedAttempt,
    paymentStatusRequired = false,
    paymentStatus,
    paymentStatusQueryFailed = false,
    retryRequested = false,
  } = input;

  if (purchase === undefined) return build("loading");
  if (purchase === null) {
    return build(purchaseQueryFailed ? "query_error" : "purchase_unavailable");
  }

  // Terminal server truth first — nothing local outranks it.
  if (purchase.status === "paid" || paymentStatus?.purchase_status === "paid") {
    return build("payment_paid");
  }
  if (purchase.status === "cancelled") return build("purchase_cancelled");
  if (purchase.status === "refunded") return build("purchase_refunded");

  if (paymentStatus?.manual_review || verifiedAttempt?.manualReview) {
    return build("manual_review");
  }

  if (attemptPhase === "iframe" && iframeUrl) {
    return build("iframe_open", { iframeUrl });
  }
  if (attemptPhase === "starting") return build("starting_payment");

  if (paymentStatusRequired && paymentStatus === undefined) {
    return build("loading");
  }
  if (paymentStatusRequired && (paymentStatus === null || paymentStatusQueryFailed)) {
    return build("query_error");
  }

  if (paymentStatus) {
    if (paymentStatus.purchase_id !== purchase.id ||
        paymentStatus.purchase_status !== purchase.status) {
      return build("query_error");
    }
    if (paymentStatus.requires_reconciliation ||
        paymentStatus.latest_attempt?.status === "succeeded") {
      return build("callback_pending");
    }
    if (paymentStatus.has_active_attempt) {
      if (paytrEnabled && paymentStatus.can_resume_checkout &&
          paymentStatus.checkout_enabled && acceptance &&
          !acceptanceQueryFailed && isLessonOnly(acceptance) &&
          (!acceptance.requires_tutor_acceptance ||
            acceptance.acceptance?.status === "accepted")) {
        return build("payment_resume", { canStartPayment: true });
      }
      return build("callback_pending");
    }
    if (paymentStatus.latest_attempt?.status === "failed") {
      if (!paymentStatus.can_retry_checkout || !paytrEnabled) {
        return build("attempt_failed");
      }
      if (!retryRequested) {
        return build("attempt_failed", { canRetryPayment: true });
      }
      // A confirmed retry still passes the acceptance and package gates below.
    } else if (!paymentStatus.can_start_checkout) {
      if (knownAttempt?.purchaseId === purchase.id) return build("callback_pending");
      return build("payment_unavailable");
    }
  }

  if (verifiedAttempt) {
    if (verifiedAttempt.status === "failed") {
      return build("attempt_failed", { canRetryPayment: true });
    }
    // created / token_issued / succeeded-but-purchase-still-pending: the
    // outcome is not ours to declare, and a second attempt is not ours to open.
    return build("callback_pending");
  }

  const startedHere =
    attemptPhase === "verifying" ||
    lastStartErrorKind === "unknown" ||
    knownAttempt?.purchaseId === purchase.id;
  if (startedHere && !(paymentStatus?.can_retry_checkout && retryRequested)) {
    return build("callback_pending");
  }

  if (lastStartErrorKind === "unavailable") return build("purchase_unavailable");
  if (revalidation === "checking") return build("loading");
  if (purchaseQueryFailed || revalidation !== "idle") return build("query_error");

  if (!paytrEnabled) {
    return build("payment_unavailable", { blockedReason: "flag_off" });
  }

  if (acceptance === undefined) return build("loading");
  if (!acceptance || acceptanceQueryFailed) return build("query_error");

  if (!isLessonOnly(acceptance)) {
    return build("payment_unavailable", { blockedReason: "coaching_unverified" });
  }

  if (!acceptance.requires_tutor_acceptance) {
    return build("payment_ready", { canStartPayment: true });
  }

  const decision = acceptance.acceptance;
  // requires_tutor_acceptance with no record is a contradiction the read and
  // init endpoints can disagree about (B06). Refetch, do not pay.
  if (!decision) return build("query_error");
  if (decision.status === "accepted") {
    return build("payment_ready", { canStartPayment: true });
  }
  if (decision.status === "pending") {
    return build("acceptance_pending", { acceptanceStatus: "pending" });
  }
  return build("acceptance_rejected", { acceptanceStatus: decision.status });
}

import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchase, PackagePurchaseStatus, PayTRPaymentStatus } from "@/types";

import { hasVerifiedCoachingAmount } from "./paytrCheckoutState";

/**
 * Where the rest of the app is allowed to point at PayTR.
 *
 * The payment route decides what a payment screen shows; these decide whether
 * a screen elsewhere — the checkout result, a package card — may offer to go
 * there at all. Same rule as everywhere else in this flow: an offer needs
 * proof, so an unread answer, an unknown package type or a settled purchase
 * all mean "offer nothing" rather than "probably fine".
 *
 * With the build flag on, the proof is the server's payment status for this
 * purchase. It is the only thing that sees attempts opened in another tab or
 * another device; this tab's breadcrumb can only narrow what it allows, never
 * widen it. With the flag off nothing here reads payment status: the card keeps
 * the behaviour it had before any of this existed.
 */

export type PayTRPurchaseAction =
  | "pay"
  | "check_status"
  | "status_loading"
  | "status_error"
  | "none";

/** Why a purchase the student could otherwise pay for offers no payment. */
export type PayTREntryBlockedReason =
  | "checkout_disabled"
  | "coaching_not_supported"
  | "coaching_price_unverified"
  | "amount_unverified"
  | "unavailable";

export interface PayTREntryDecision {
  action: PayTRPurchaseAction;
  blockedReason?: PayTREntryBlockedReason;
}

export interface PayTREntryInput {
  paytrEnabled: boolean;
  purchaseId: string;
  purchaseStatus: PackagePurchaseStatus;
  /** The stored package total in TL. Needed to verify a coaching bundle. */
  totalPrice?: number;
  /** undefined while loading, null when the answer could not be read. */
  acceptance: PurchaseAcceptanceState | null | undefined;
  /** undefined while loading, null when the answer could not be read. */
  paymentStatus: PayTRPaymentStatus | null | undefined;
  /** This tab remembers an attempt for this purchase. */
  hasKnownAttempt: boolean;
}

export function payTRPayHref(purchaseId: string): string {
  return `/package-purchases/${purchaseId}/pay`;
}

/** The payment screen's own cache key for this purchase's payment status. */
export function payTRPaymentStatusKey(purchaseId: string) {
  return ["paytr-payment-status", purchaseId] as const;
}

const BLOCKED_MESSAGES: Record<PayTREntryBlockedReason, string> = {
  checkout_disabled: "Online ödeme şu anda kapalı.",
  coaching_not_supported: "Koçluk içeren paketlerde online ödeme henüz açık değil.",
  coaching_price_unverified:
    "Koçluk tutarı doğrulanamadı. Daha sonra tekrar kontrol et.",
  amount_unverified: "Ödeme tutarı doğrulanamadı. Daha sonra tekrar kontrol et.",
  unavailable: "Bu paket için ödeme şu anda açılamıyor.",
};

export function payTREntryBlockedMessage(reason: PayTREntryBlockedReason): string {
  return BLOCKED_MESSAGES[reason];
}

function acceptanceAllowsPayment(acceptance: PurchaseAcceptanceState): boolean {
  if (!acceptance.requires_tutor_acceptance) return true;
  return acceptance.acceptance?.status === "accepted";
}

/** The server's own words for a refusal, mapped onto what we can explain.
 * Anything we do not recognise is still a refusal, just an unexplained one. */
function serverBlockedReason(code: string): PayTREntryBlockedReason {
  if (
    code === "checkout_disabled" ||
    code === "coaching_not_supported" ||
    code === "coaching_price_unverified"
  ) {
    return code;
  }
  return "unavailable";
}

/** An order exists or may exist. Its outcome belongs to the payment screen. */
function attemptOnRecord(status: PayTRPaymentStatus): boolean {
  return (
    status.has_active_attempt ||
    status.can_resume_checkout ||
    status.requires_reconciliation ||
    status.manual_review ||
    status.latest_attempt !== null
  );
}

export function payTREntryDecision(input: PayTREntryInput): PayTREntryDecision {
  const {
    paytrEnabled,
    purchaseId,
    purchaseStatus,
    totalPrice,
    acceptance,
    paymentStatus,
    hasKnownAttempt,
  } = input;

  if (purchaseStatus !== "pending") return { action: "none" };
  // Checking a started attempt stays reachable even after new payments are
  // switched off — someone may already be inside the iframe.
  if (!paytrEnabled) {
    return { action: hasKnownAttempt ? "check_status" : "none" };
  }

  if (acceptance === undefined || paymentStatus === undefined) {
    return { action: "status_loading" };
  }
  if (acceptance === null || paymentStatus === null) {
    return { action: "status_error" };
  }
  if (paymentStatus.purchase_id !== purchaseId) return { action: "status_error" };
  // The list this card came from is behind the server; it will catch up.
  if (paymentStatus.purchase_status !== "pending") return { action: "none" };

  // Another tab, another device or this one: once an order exists, the next
  // step is to look at it, never to open a second one. A resumable order is
  // included on purpose — resuming is the payment screen's call.
  if (attemptOnRecord(paymentStatus) || hasKnownAttempt) {
    return { action: "check_status" };
  }

  // Tutor still deciding, or the request ended: the acceptance copy says so.
  if (!acceptanceAllowsPayment(acceptance)) return { action: "none" };

  if (!paymentStatus.checkout_enabled) {
    return { action: "none", blockedReason: "checkout_disabled" };
  }
  if (!paymentStatus.can_start_checkout) {
    return {
      action: "none",
      blockedReason: serverBlockedReason(paymentStatus.checkout_blocked_reason),
    };
  }
  // Same rule as the payment screen: a coaching bundle needs its combined
  // amount verified; a lesson-only package is the server's word alone.
  if (
    acceptance.acceptance?.includes_coaching === true &&
    !(
      typeof totalPrice === "number" &&
      hasVerifiedCoachingAmount({ total_price: totalPrice }, paymentStatus)
    )
  ) {
    return { action: "none", blockedReason: "amount_unverified" };
  }
  return { action: "pay" };
}

export type PayTRPostCreateTarget =
  | "pay"
  | "checking"
  | "status_error"
  | "blocked"
  | "stay";

/**
 * Right after a package purchase is created: go to payment, wait for the
 * server's answer, or stay on the request screen.
 *
 * "stay", "blocked" and "status_error" all keep the created request on screen.
 * The caller must treat every one of them as "show the request", never as a
 * reason to POST a second package.
 */
export function payTRPostCreateTarget({
  paytrEnabled,
  purchase,
  acceptance,
  paymentStatus,
}: {
  paytrEnabled: boolean;
  purchase: Pick<PackagePurchase, "id" | "status" | "total_price">;
  acceptance: PurchaseAcceptanceState | null | undefined;
  paymentStatus: PayTRPaymentStatus | null | undefined;
}): { target: PayTRPostCreateTarget; blockedReason?: PayTREntryBlockedReason } {
  if (!paytrEnabled) return { target: "stay" };
  const decision = payTREntryDecision({
    paytrEnabled,
    purchaseId: purchase.id,
    purchaseStatus: purchase.status,
    totalPrice: purchase.total_price,
    acceptance,
    paymentStatus,
    hasKnownAttempt: false,
  });
  switch (decision.action) {
    case "pay":
      return { target: "pay" };
    case "status_loading":
      return { target: "checking" };
    case "status_error":
      return { target: "status_error" };
    default:
      return decision.blockedReason
        ? { target: "blocked", blockedReason: decision.blockedReason }
        : { target: "stay" };
  }
}

/**
 * The server's payment status agrees that nothing is in flight. Read on its
 * own right before a cancel is sent, so a card that went stale cannot cancel
 * a purchase whose payment started meanwhile.
 */
export function payTRServerAllowsUnpaidCancel(
  purchaseId: string,
  status: PayTRPaymentStatus | null | undefined
): boolean {
  if (!status || status.purchase_id !== purchaseId) return false;
  return (
    status.purchase_status === "pending" &&
    status.can_cancel_unpaid &&
    !status.has_active_attempt &&
    !status.can_resume_checkout &&
    !status.requires_reconciliation &&
    !status.manual_review
  );
}

/**
 * The acceptance answer offers unpaid cancellation; with payments live the
 * server's payment status must agree, because only it sees an attempt opened
 * in another tab. This tab's own knowledge narrows the offer further (B04).
 */
export function payTRShowsUnpaidCancel({
  paytrEnabled,
  canCancelUnpaid,
  hasKnownAttempt,
  purchaseId,
  purchaseStatus,
  paymentStatus,
}: {
  paytrEnabled: boolean;
  canCancelUnpaid: boolean;
  hasKnownAttempt: boolean;
  purchaseId: string;
  purchaseStatus: PackagePurchaseStatus;
  /** undefined while loading, null when the answer could not be read. */
  paymentStatus: PayTRPaymentStatus | null | undefined;
}): boolean {
  // The acceptance answer can be read a moment before the purchase settles.
  // A purchase that is no longer unpaid cannot be cancelled as unpaid.
  if (purchaseStatus !== "pending") return false;
  if (!canCancelUnpaid || hasKnownAttempt) return false;
  if (!paytrEnabled) return true;
  return payTRServerAllowsUnpaidCancel(purchaseId, paymentStatus);
}

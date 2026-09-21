import type { PurchaseAcceptanceState } from "@/lib/coachingApi";
import type { PackagePurchaseStatus } from "@/types";

/**
 * Where the rest of the app is allowed to point at PayTR.
 *
 * The payment route decides what a payment screen shows; these decide whether
 * a screen elsewhere — the checkout result, a package card — may offer to go
 * there at all. Same rule as everywhere else in this flow: an offer needs
 * proof, so an unread acceptance answer, an unknown package type or a settled
 * purchase all mean "offer nothing" rather than "probably fine".
 */

export type PayTRPurchaseAction = "pay" | "check_status" | "none";

export function payTRPayHref(purchaseId: string): string {
  return `/package-purchases/${purchaseId}/pay`;
}

/** True only when the server has shown there is no coaching in this package.
 * Coaching always creates an acceptance record (CoachingPurchase.acceptance is
 * a required FK), so a missing record is evidence, not an assumption (B03). */
function isLessonOnly(acceptance: PurchaseAcceptanceState): boolean {
  if (!acceptance.acceptance) return true;
  return acceptance.acceptance.includes_coaching === false;
}

function acceptancePayable(acceptance: PurchaseAcceptanceState): boolean {
  if (!isLessonOnly(acceptance)) return false;
  if (!acceptance.requires_tutor_acceptance) return true;
  return acceptance.acceptance?.status === "accepted";
}

export function payTRPurchaseAction({
  paytrEnabled,
  purchaseStatus,
  acceptance,
  hasKnownAttempt,
}: {
  paytrEnabled: boolean;
  purchaseStatus: PackagePurchaseStatus;
  /** undefined while loading, null when the answer could not be read. */
  acceptance: PurchaseAcceptanceState | null | undefined;
  /** This tab remembers an attempt for this purchase. */
  hasKnownAttempt: boolean;
}): PayTRPurchaseAction {
  if (purchaseStatus !== "pending") return "none";
  // Checking a started attempt stays reachable even after new payments are
  // switched off — someone may already be inside the iframe.
  if (hasKnownAttempt) return "check_status";
  if (!paytrEnabled) return "none";
  if (!acceptance) return "none";
  return acceptancePayable(acceptance) ? "pay" : "none";
}

/**
 * Right after a package purchase is created: go to payment, or stay on the
 * request screen.
 *
 * "stay" covers every case we cannot prove payable, including an acceptance
 * read that failed. The caller must treat that as "show the created request",
 * never as a reason to POST a second package.
 */
export function payTRPostCreateTarget({
  paytrEnabled,
  acceptance,
}: {
  paytrEnabled: boolean;
  acceptance: PurchaseAcceptanceState | null | undefined;
}): "pay" | "stay" {
  if (!paytrEnabled) return "stay";
  if (!acceptance) return "stay";
  return acceptancePayable(acceptance) ? "pay" : "stay";
}

/**
 * The server offers unpaid cancellation from acceptance state alone, which
 * does not know whether a PayTR attempt is in flight. Cancelling a purchase
 * while its payment may still land is the race worth avoiding here, so this
 * tab's own knowledge narrows the offer (B04).
 */
export function payTRShowsUnpaidCancel({
  canCancelUnpaid,
  hasKnownAttempt,
  purchaseStatus,
}: {
  canCancelUnpaid: boolean;
  hasKnownAttempt: boolean;
  purchaseStatus: PackagePurchaseStatus;
}): boolean {
  // The server derives can_cancel_unpaid from the acceptance record, which can
  // be read a moment before the purchase settles. A purchase that is no longer
  // unpaid cannot be cancelled as unpaid, whatever the flag still says.
  if (purchaseStatus !== "pending") return false;
  return canCancelUnpaid && !hasKnownAttempt;
}

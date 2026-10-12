import type { PackagePurchase } from "@/types";
import { serverNow } from "@/lib/serverClock";

/**
 * A lesson package that has been chosen and is waiting for its payment.
 *
 * Only these purchases carry `payment_deadline`: the moment the tutor's hours
 * they hold go back on sale. A coaching bundle waits for the tutor instead, and
 * anything created before the deadline existed has none, so both stay what they
 * were ("a request under review"). `open` says whether the hold is still live;
 * the server cancels the purchase a little after it ends, so a purchase can be
 * seen here past its deadline for a short while.
 */
export interface AwaitingPayment {
  open: boolean;
  deadlineMs: number;
}

export function awaitingPayment(
  purchase: Pick<PackagePurchase, "status" | "payment_deadline">,
  now: number = serverNow()
): AwaitingPayment | null {
  if (purchase.status !== "pending" || !purchase.payment_deadline) return null;
  const deadlineMs = Date.parse(purchase.payment_deadline);
  if (!Number.isFinite(deadlineMs)) return null;
  return { open: deadlineMs > now, deadlineMs };
}

/** What the status badge should say: the purchase's status, or what it is waiting for. */
export function packageBadgeStatus(
  purchase: Pick<PackagePurchase, "status" | "payment_deadline">,
  now: number = serverNow()
): string {
  const payment = awaitingPayment(purchase, now);
  if (!payment) return purchase.status;
  return payment.open ? "awaiting_payment" : "payment_expired";
}

/** Where to choose the hours again: this tutor's schedule step, with the plan the purchase was for. */
export function packageRestartHref(
  purchase: Pick<PackagePurchase, "tutor" | "plan">
): string {
  const query = new URLSearchParams();
  if (purchase.plan.lessons_per_week) query.set("per_week", String(purchase.plan.lessons_per_week));
  if (purchase.plan.duration_days) query.set("duration", String(purchase.plan.duration_days));
  const suffix = query.toString();
  return `/tutors/${purchase.tutor.id}/checkout/schedule${suffix ? `?${suffix}` : ""}`;
}

/** "14:35" in Istanbul for a real instant (the deadline is one, not a booking wall clock). */
export function deadlineTimeLabel(deadlineMs: number): string {
  return new Date(deadlineMs).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  });
}

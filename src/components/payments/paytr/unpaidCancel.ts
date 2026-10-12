import type { QueryClient } from "@tanstack/react-query";

import { cancelUnpaidPackagePurchase } from "@/lib/coachingApi";
import { fetchPayTRPaymentStatus } from "@/lib/paymentsApi";

import { payTRPaymentStatusKey, payTRServerAllowsUnpaidCancel } from "./paytrEntryPoints";

/** A cancel the fresh payment-status read refused to send. */
export class UnpaidCancelHeld extends Error {
  constructor(readonly reason: "in_flight" | "status_unreadable") {
    super(reason);
  }
}

/**
 * Cancel a purchase that has not been paid for, after asking the server once
 * more whether it still may be.
 *
 * The page's own copy of the payment status can be a few seconds old, and only
 * the server sees an attempt that was opened in another tab. So the status is
 * read fresh, right before the cancel, and the cancel is not sent if a payment
 * is in flight or the status cannot be read. A purchase whose payment started
 * a moment ago must never be cancelled from under it.
 */
export async function cancelUnpaidPurchase(
  queryClient: QueryClient,
  purchaseId: string
): Promise<void> {
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
  await cancelUnpaidPackagePurchase(purchaseId);
}

export const UNPAID_CANCEL_HELD_TEXT: Record<UnpaidCancelHeld["reason"], string> = {
  in_flight: "Ödeme sürüyor, satın alma şu anda iptal edilemez. Sonucu doğrulayana kadar bekle.",
  status_unreadable:
    "Ödeme durumu doğrulanamadığı için satın alma iptal edilmedi. Bağlantını kontrol edip tekrar dene.",
};

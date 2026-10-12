/** Where the refund screens live. One place, so a link can never drift from the
 * route it points at (the notification router builds the same status address). */
export const PAYMENTS_HREF = "/profile/payments";
export const REFUNDS_HREF = `${PAYMENTS_HREF}/refunds`;

/** The start of a refund request for one package. `reason` is only passed when
 * a link already knows it (a package whose hours were taken). */
export function newRefundHref(purchaseId: string, reason?: string): string {
  const query = new URLSearchParams({ purchase: purchaseId });
  if (reason) query.set("reason", reason);
  return `${REFUNDS_HREF}/new?${query.toString()}`;
}

export function refundStatusHref(refundId: string): string {
  return `${REFUNDS_HREF}/${encodeURIComponent(refundId)}`;
}

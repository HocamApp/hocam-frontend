import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  OPEN_REQUEST_LINK,
  REFUND_ENTRY,
  refundStatusLabel,
} from "@/lib/refundCopy";
import { openRefundFor } from "@/lib/refundPresentation";
import { newRefundHref, refundStatusHref } from "@/lib/refundRoutes";
import type { PackagePurchase, RefundRequest } from "@/types";

/**
 * The way into a refund, at the foot of a paid package's details. A package
 * with a request already open points to that request instead of offering a
 * second one, which the server would refuse anyway. A package that is not paid
 * has nothing to refund and shows nothing.
 */
export function RefundEntry({
  purchase,
  refunds,
}: {
  purchase: PackagePurchase;
  refunds: readonly RefundRequest[] | undefined;
}) {
  if (purchase.status !== "paid") return null;
  const open = openRefundFor(purchase.id, refunds);

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm leading-6 text-ink-mid">
        {open ? REFUND_ENTRY.openLead(refundStatusLabel(open.status)) : REFUND_ENTRY.lead}
      </p>
      <Button asChild variant="outline" size="sm" className="shrink-0 self-start sm:self-auto">
        <Link href={open ? refundStatusHref(open.id) : newRefundHref(purchase.id)}>
          {open ? OPEN_REQUEST_LINK : REFUND_ENTRY.ask}
        </Link>
      </Button>
    </div>
  );
}

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { refundStatusLabel } from "@/lib/refundCopy";
import type { RefundStatus } from "@/types";

/** DESIGN.md allows a solid fill or an outline, never a tint: waiting is ink,
 * approved is the outline (the money is still on its way), refused is the
 * error fill and settled is the success fill. */
const VARIANT: Record<RefundStatus, BadgeProps["variant"]> = {
  requested: "default",
  approved: "outline",
  rejected: "destructive",
  processed: "success",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  return <Badge variant={VARIANT[status] ?? "outline"}>{refundStatusLabel(status)}</Badge>;
}

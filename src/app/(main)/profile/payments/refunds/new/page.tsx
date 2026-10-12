"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { RefundFlow, RefundFlowSkeleton } from "@/components/payments/refund/RefundFlow";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { REFUND_PAGES } from "@/lib/refundCopy";
import { PAYMENTS_HREF } from "@/lib/refundRoutes";

function NewRefundContent() {
  const params = useSearchParams();
  const purchaseId = params.get("purchase");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  if (isLoading) return <RefundFlowSkeleton />;
  if (isError) return <ErrorMessage message={REFUND_PAGES.packagesLoadFailed} />;

  const purchase = purchaseId ? (data ?? []).find((item) => item.id === purchaseId) : undefined;
  if (!purchase) {
    return (
      <EmptyState
        title={REFUND_PAGES.packageNotFoundTitle}
        description={REFUND_PAGES.packageNotFoundDescription}
        action={
          <Button asChild>
            <Link href={PAYMENTS_HREF}>{REFUND_PAGES.backToPackages}</Link>
          </Button>
        }
      />
    );
  }

  return <RefundFlow purchase={purchase} initialReason={params.get("reason")} />;
}

export default function NewRefundPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <ProfileScreen title={REFUND_PAGES.newTitle} description={REFUND_PAGES.newDescription}>
        <Suspense fallback={<RefundFlowSkeleton />}>
          <NewRefundContent />
        </Suspense>
      </ProfileScreen>
    </RouteGuard>
  );
}

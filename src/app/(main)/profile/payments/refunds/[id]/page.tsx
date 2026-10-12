"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  RefundStatusSkeleton,
  RefundStatusView,
} from "@/components/payments/refund/RefundStatusView";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { REFUND_PAGES } from "@/lib/refundCopy";
import { PAYMENTS_HREF } from "@/lib/refundRoutes";
import { fetchRefundRequest } from "@/lib/refundsApi";

function isNotFound(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 404;
}

function RefundStatusContent() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["refund-request", id],
    queryFn: () => fetchRefundRequest(String(id)),
    enabled: Boolean(id),
    // A missing request stays missing; do not make the student wait on retries.
    retry: (failures, err) => !isNotFound(err) && failures < 2,
  });

  if (isLoading) return <RefundStatusSkeleton />;
  if (isError && isNotFound(error)) {
    return (
      <EmptyState
        title={REFUND_PAGES.requestNotFoundTitle}
        description={REFUND_PAGES.requestNotFoundDescription}
        action={
          <Button asChild>
            <Link href={PAYMENTS_HREF}>{REFUND_PAGES.backToPackages}</Link>
          </Button>
        }
      />
    );
  }
  if (isError || !data) return <ErrorMessage message={REFUND_PAGES.loadFailed} />;

  return <RefundStatusView refund={data} />;
}

export default function RefundStatusPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <ProfileScreen title={REFUND_PAGES.statusTitle} description={REFUND_PAGES.statusDescription}>
        <RefundStatusContent />
      </ProfileScreen>
    </RouteGuard>
  );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { PlaceLessonsFlow } from "@/components/payments/place/PlaceLessonsFlow";
import { ProfileScreen } from "@/components/profile/ProfileScreen";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RouteGuard } from "@/components/shared/RouteGuard";
import { Button } from "@/components/ui/button";
import { fetchPackagePurchases } from "@/lib/paymentsApi";
import { PLACE_PAGES } from "@/lib/placeLessonsCopy";
import { PAYMENTS_HREF } from "@/lib/refundRoutes";
import { hasUnplacedCredits } from "@/lib/unplacedCredits";

function PlaceLessonsContent() {
  const params = useSearchParams();
  const purchaseId = params.get("purchase");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["package-purchases"],
    queryFn: fetchPackagePurchases,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage message={PLACE_PAGES.packagesLoadFailed} />;

  const purchase = purchaseId ? (data ?? []).find((item) => item.id === purchaseId) : undefined;
  if (!purchase || !hasUnplacedCredits(purchase)) {
    return (
      <EmptyState
        title={PLACE_PAGES.packageNotFoundTitle}
        description={PLACE_PAGES.packageNotFoundDescription}
        action={
          <Button asChild>
            <Link href={PAYMENTS_HREF}>{PLACE_PAGES.backToPackages}</Link>
          </Button>
        }
      />
    );
  }

  return <PlaceLessonsFlow purchase={purchase} />;
}

export default function PlaceLessonsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <ProfileScreen title={PLACE_PAGES.title} description={PLACE_PAGES.description}>
        <Suspense fallback={<LoadingSpinner />}>
          <PlaceLessonsContent />
        </Suspense>
      </ProfileScreen>
    </RouteGuard>
  );
}

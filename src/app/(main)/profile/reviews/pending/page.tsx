"use client";

import { LegacyProfileRouteRedirect } from "@/components/profile/LegacyProfileRouteRedirect";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function PendingReviewsPage() {
  return (
    <RouteGuard requireAuth>
      <LegacyProfileRouteRedirect tutorHref="/dashboard/tutor" />
    </RouteGuard>
  );
}

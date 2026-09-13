"use client";

import { LegacyProfileRouteRedirect } from "@/components/profile/LegacyProfileRouteRedirect";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function PendingReservationsPage() {
  return (
    <RouteGuard requireAuth>
      <LegacyProfileRouteRedirect tutorHref="/dashboard/tutor?tab=bookings" />
    </RouteGuard>
  );
}

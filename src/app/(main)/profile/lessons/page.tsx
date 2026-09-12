"use client";

import { LegacyProfileRouteRedirect } from "@/components/profile/LegacyProfileRouteRedirect";
import { RouteGuard } from "@/components/shared/RouteGuard";

export default function LessonsPage() {
  return (
    <RouteGuard requireAuth>
      <LegacyProfileRouteRedirect tutorHref="/dashboard/tutor?tab=bookings" />
    </RouteGuard>
  );
}

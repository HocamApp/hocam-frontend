"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { SchedulePageClient } from "@/components/schedule/SchedulePageClient";

/** "Çalışma Programım" — the student's own calendar. Its own destination
 * rather than a tab inside the learning hub, per the feature spec. */
export default function SchedulePage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <SchedulePageClient />
    </RouteGuard>
  );
}

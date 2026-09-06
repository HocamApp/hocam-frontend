"use client";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { TutorStatisticsPage } from "@/components/tutor-statistics/TutorStatisticsPage";

export default function Page() {
  return (
    <RouteGuard requireAuth requireRole="tutor">
      <TutorStatisticsPage />
    </RouteGuard>
  );
}

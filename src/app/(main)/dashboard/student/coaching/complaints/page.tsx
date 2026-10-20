"use client";

import { Suspense } from "react";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { CoachingLoadingState } from "@/components/coaching/CoachingLoadingState";
import { StudentComplaintsBoard } from "@/components/coaching/StudentComplaintsBoard";

export default function StudentCoachingComplaintsPage() {
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Sorun bildir"
        width="narrow"
        currentHref="/dashboard/student/coaching/complaints"
        audience="student"
      >
        <Suspense fallback={<CoachingLoadingState rows={3} />}>
          <StudentComplaintsBoard />
        </Suspense>
      </CoachingPageShell>
    </RouteGuard>
  );
}

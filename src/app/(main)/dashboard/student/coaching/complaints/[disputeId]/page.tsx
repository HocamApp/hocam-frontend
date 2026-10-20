"use client";

import { useParams } from "next/navigation";

import { RouteGuard } from "@/components/shared/RouteGuard";
import { CoachingPageShell } from "@/components/coaching/CoachingPageShell";
import { StudentComplaintDetail } from "@/components/coaching/StudentComplaintDetail";

export default function StudentCoachingComplaintDetailPage() {
  const { disputeId } = useParams<{ disputeId: string }>();
  return (
    <RouteGuard requireAuth requireRole="student">
      <CoachingPageShell
        title="Sorun bildirimi"
        width="narrow"
        currentHref="/dashboard/student/coaching/complaints"
        audience="student"
      >
        <StudentComplaintDetail disputeId={disputeId} />
      </CoachingPageShell>
    </RouteGuard>
  );
}
